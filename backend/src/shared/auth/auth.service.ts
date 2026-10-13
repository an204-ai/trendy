import { randomBytes, createHash, createPublicKey, createVerify } from "node:crypto";
import { Injectable, UnauthorizedException, ConflictException, BadRequestException, ForbiddenException, ServiceUnavailableException, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { DataSource, IsNull } from "typeorm";
import { RefreshSession, User, UserRole } from "../database/entities";
import { hashPassword, verifyPassword } from "./password";
import { UserPrincipal } from "./auth.types";

type TokenPair = { accessToken: string; refreshToken: string; user: UserPrincipal };

@Injectable()
export class AuthService {
  private googleKeysCache: { expiresAt: number; keys: Map<string, Record<string, string>> } | null = null;
  constructor(private readonly dataSource: DataSource, private readonly jwt: JwtService, private readonly config: ConfigService) { }

  async googleLogin(credential: string, nonce: string, userAgent?: string): Promise<TokenPair> {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID");
    if (!clientId) throw new ServiceUnavailableException("Đăng nhập Google chưa được cấu hình");

    const payload = await this.verifyGoogleCredential(credential, clientId);
    if (payload.nonce !== nonce) throw new UnauthorizedException("Phiên xác thực Google không khớp, vui lòng thử lại");
    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      throw new UnauthorizedException("Google chưa xác minh địa chỉ email này");
    }

    const email = this.normalizeEmail(payload.email);
    const users = this.dataSource.getRepository(User);
    let user = await users.findOneBy({ googleSubject: payload.sub });
    if (!user) {
      user = await users.findOneBy({ email });
      if (user) {
        if (user.role !== UserRole.CUSTOMER) throw new ForbiddenException("Đăng nhập Google chỉ dành cho tài khoản khách hàng");
        if (user.googleSubject && user.googleSubject !== payload.sub) throw new ConflictException("Email này đã liên kết với một tài khoản Google khác");
        user.googleSubject = payload.sub;
        user = await users.save(user);
      } else {
        const displayName = payload.name?.trim() || [payload.given_name, payload.family_name].filter(Boolean).join(" ") || email.split("@")[0];
        const customerCode = await this.nextCustomerCode();
        user = await users.save(users.create({
          customerCode,
          email,
          passwordHash: await hashPassword(randomBytes(48).toString("base64url")),
          googleSubject: payload.sub,
          fullName: displayName.slice(0, 120),
          phone: null,
          role: UserRole.CUSTOMER,
          active: true,
        }));
      }
    }
    if (!user.active) throw new UnauthorizedException("Tài khoản không còn hoạt động");
    if (user.role !== UserRole.CUSTOMER) throw new ForbiddenException("Đăng nhập Google chỉ dành cho tài khoản khách hàng");
    return this.issuePair(user, userAgent);
  }

  async updateProfile(userId: string, input: { fullName?: string; phone?: string }): Promise<UserPrincipal> {
    const users = this.dataSource.getRepository(User);
    const user = await users.findOneBy({ id: userId, active: true });
    if (!user) throw new UnauthorizedException("Tài khoản không còn hoạt động");
    if (input.fullName !== undefined && input.fullName !== null) {
      const fullName = input.fullName.trim();
      if (fullName.length < 2) throw new BadRequestException("Họ tên cần có ít nhất 2 ký tự");
      user.fullName = fullName;
    }
    if (input.phone !== undefined) user.phone = typeof input.phone === "string" ? input.phone.trim() || null : null;
    return this.toPrincipal(await users.save(user));
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const users = this.dataSource.getRepository(User);
    const user = await users.findOneBy({ id: userId, active: true });
    if (!user) throw new UnauthorizedException("Tài khoản không còn hoạt động");
    if (user.googleSubject && !user.passwordHash) {
      throw new BadRequestException("Tài khoản đăng nhập bằng Google không sử dụng tính năng đổi mật khẩu");
    }
    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new BadRequestException("Mật khẩu hiện tại chưa chính xác");
    }
    const cleanPassword = newPassword.trim();
    if (cleanPassword.length < 8) {
      throw new BadRequestException("Mật khẩu mới phải có ít nhất 8 ký tự");
    }
    if (currentPassword === cleanPassword) {
      throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu hiện tại");
    }
    user.passwordHash = await hashPassword(cleanPassword);
    await users.save(user);
  }

  async register(input: { email: string; password: string; fullName: string; phone?: string }, userAgent?: string): Promise<TokenPair> {
    const email = this.normalizeEmail(input.email);
    const repository = this.dataSource.getRepository(User);
    const customerCode = await this.nextCustomerCode();
    const user = await repository.save(repository.create({
      customerCode,
      email,
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      role: UserRole.CUSTOMER,
      active: true,
    }));
    return this.issuePair(user, userAgent);
  }

  async createStaff(input: { email: string; password: string; fullName: string; phone?: string; role?: UserRole }): Promise<UserPrincipal> {
    const email = this.normalizeEmail(input.email);
    const users = this.dataSource.getRepository(User);
    if (await users.findOneBy({ email })) throw new ConflictException("Email này đã tồn tại");
    const role = input.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.STAFF;
    const user = await users.save(users.create({
      email,
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      role,
      active: true,
    }));
    return this.toPrincipal(user);
  }

  async listStaff(): Promise<Array<{ id: string; email: string; fullName: string; phone: string | null; role: UserRole; active: boolean; createdAt: Date; updatedAt: Date }>> {
    const users = await this.dataSource.getRepository(User).find({
      where: [
        { role: UserRole.STAFF },
        { role: UserRole.ADMIN },
      ],
      order: { createdAt: "DESC" },
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      active: u.active,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
  }

  async updateStaff(
    id: string,
    input: { email?: string; fullName?: string; phone?: string; password?: string; active?: boolean; role?: UserRole },
    actorId?: string,
  ) {
    const users = this.dataSource.getRepository(User);
    const user = await users.findOneBy({ id });
    if (!user) throw new NotFoundException("Không tìm thấy người dùng");

    if (input.email) {
      const email = this.normalizeEmail(input.email);
      if (email !== user.email) {
        const existing = await users.findOneBy({ email });
        if (existing && existing.id !== user.id) {
          throw new ConflictException("Email này đã được sử dụng");
        }
        user.email = email;
      }
    }

    if (input.fullName !== undefined) {
      const fullName = input.fullName.trim();
      if (fullName.length < 2) throw new BadRequestException("Họ tên cần có ít nhất 2 ký tự");
      user.fullName = fullName;
    }

    if (input.phone !== undefined) {
      user.phone = typeof input.phone === "string" ? input.phone.trim() || null : null;
    }

    if (input.password && input.password.trim().length > 0) {
      const password = input.password.trim();
      if (password.length < 8) throw new BadRequestException("Mật khẩu tối thiểu 8 ký tự");
      user.passwordHash = await hashPassword(password);
    }

    if (input.role !== undefined && (input.role === UserRole.STAFF || input.role === UserRole.ADMIN)) {
      if (user.id === actorId && input.role !== UserRole.ADMIN) {
        throw new BadRequestException("Bạn không thể tự hạ quyền quản trị của chính mình");
      }
      user.role = input.role;
    }

    if (input.active !== undefined) {
      if (user.id === actorId && !input.active) {
        throw new BadRequestException("Bạn không thể tự khóa tài khoản của chính mình");
      }
      user.active = Boolean(input.active);
    }

    const saved = await users.save(user);
    return {
      id: saved.id,
      email: saved.email,
      fullName: saved.fullName,
      phone: saved.phone,
      role: saved.role,
      active: saved.active,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }

  async deleteStaff(id: string, actorId?: string) {
    const users = this.dataSource.getRepository(User);
    const user = await users.findOneBy({ id });
    if (!user) throw new NotFoundException("Không tìm thấy người dùng");

    if (user.id === actorId) {
      throw new BadRequestException("Bạn không thể tự xóa tài khoản của chính mình");
    }

    try {
      await users.remove(user);
      return { success: true, message: "Đã xóa tài khoản thành công" };
    } catch {
      user.active = false;
      await users.save(user);
      return { success: true, deactivated: true, message: "Tài khoản có dữ liệu liên kết nên đã được khóa hoạt động" };
    }
  }

  async login(emailInput: string, password: string, userAgent?: string): Promise<TokenPair> {
    const normalized = this.normalizeEmail(emailInput);
    const user = await this.dataSource.getRepository(User).findOne({
      where: [
        { email: normalized, active: true },
        { email: `${normalized}@trendyeye.com`, active: true },
      ],
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) throw new UnauthorizedException("Email hoặc mật khẩu chưa chính xác");
    if (user.role !== UserRole.CUSTOMER) throw new ForbiddenException("Tài khoản nhân viên hãy đăng nhập tại khu vực nội bộ");
    return this.issuePair(user, userAgent);
  }

  async loginStaff(emailInput: string, password: string, userAgent?: string): Promise<TokenPair> {
    const normalized = this.normalizeEmail(emailInput);
    const user = await this.dataSource.getRepository(User).findOne({
      where: [
        { email: normalized, active: true },
        { email: `${normalized}@trendyeye.com`, active: true },
        { email: `${normalized}@gentlemonster.com`, active: true },
      ],
    });
    if (!user || !(await verifyPassword(password, user.passwordHash))) throw new UnauthorizedException("Tên đăng nhập hoặc mật khẩu chưa chính xác");
    if (user.role !== UserRole.STAFF && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Khu vực này dành cho nhân viên và quản trị viên");
    }
    return this.issuePair(user, userAgent);
  }

  async refresh(rawToken: string | undefined, userAgent?: string): Promise<TokenPair> {
    if (!rawToken) throw new UnauthorizedException("Không tìm thấy refresh token");
    const tokenHash = this.hashToken(rawToken);
    const nextRawToken = randomBytes(48).toString("base64url");
    const expiresAt = this.refreshExpiry();

    const { user, session } = await this.dataSource.transaction(async (manager) => {
      const sessions = manager.getRepository(RefreshSession);
      const current = await sessions.createQueryBuilder("session")
        .setLock("pessimistic_write")
        .where('session."tokenHash" = :tokenHash', { tokenHash })
        .andWhere('session."revokedAt" IS NULL')
        .andWhere('session."expiresAt" > :now', { now: new Date() })
        .getOne();
      if (!current) throw new UnauthorizedException("Refresh token đã hết hạn hoặc được sử dụng");
      const user = await manager.getRepository(User).findOneBy({ id: current.userId, active: true });
      if (!user) throw new UnauthorizedException("Tài khoản không còn hoạt động");
      current.revokedAt = new Date();
      await sessions.save(current);
      const session = await sessions.save(sessions.create({
        userId: user.id,
        tokenHash: this.hashToken(nextRawToken),
        expiresAt,
        revokedAt: null,
        userAgent: userAgent?.slice(0, 300) || null,
      }));
      return { user, session };
    });
    return { accessToken: await this.createAccessToken(user, session.id), refreshToken: nextRawToken, user: this.toPrincipal(user) };
  }

  async logout(rawToken?: string): Promise<void> {
    if (!rawToken) return;
    await this.dataSource.getRepository(RefreshSession).update(
      { tokenHash: this.hashToken(rawToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async issuePair(user: User, userAgent?: string): Promise<TokenPair> {
    const refreshToken = randomBytes(48).toString("base64url");
    const session = await this.dataSource.getRepository(RefreshSession).save({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt: this.refreshExpiry(),
      revokedAt: null,
      userAgent: userAgent?.slice(0, 300) || null,
    });
    return { accessToken: await this.createAccessToken(user, session.id), refreshToken, user: this.toPrincipal(user) };
  }

  publicUser(user: User): UserPrincipal { return this.toPrincipal(user); }

  private async verifyGoogleCredential(credential: string, clientId: string): Promise<Record<string, any>> {
    const parts = credential.split(".");
    if (parts.length !== 3) throw new UnauthorizedException("Thông tin xác thực Google không hợp lệ");
    let header: Record<string, any>;
    let payload: Record<string, any>;
    try {
      header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8"));
      payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    } catch {
      throw new UnauthorizedException("Thông tin xác thực Google không hợp lệ");
    }
    if (header.alg !== "RS256" || typeof header.kid !== "string") throw new UnauthorizedException("Chữ ký Google không hợp lệ");

    const key = await this.getGoogleSigningKeys().then((keys) => keys.get(header.kid));
    if (!key) throw new UnauthorizedException("Không tìm thấy khóa xác minh Google");
    try {
      const verifier = createVerify("RSA-SHA256");
      verifier.update(`${parts[0]}.${parts[1]}`);
      verifier.end();
      if (!verifier.verify(createPublicKey({ key: key as any, format: "jwk" }), Buffer.from(parts[2], "base64url"))) {
        throw new UnauthorizedException("Chữ ký Google không hợp lệ");
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Không thể xác minh chữ ký Google");
    }

    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(clientId) || (audiences.length > 1 && payload.azp !== clientId)) throw new UnauthorizedException("Google Client ID không khớp");
    if (!["accounts.google.com", "https://accounts.google.com"].includes(payload.iss)) throw new UnauthorizedException("Nguồn token Google không hợp lệ");
    if (typeof payload.exp !== "number" || payload.exp <= now || typeof payload.iat !== "number" || payload.iat > now + 60) throw new UnauthorizedException("Token Google đã hết hạn hoặc chưa hợp lệ");
    return payload;
  }

  private async getGoogleSigningKeys(): Promise<Map<string, Record<string, string>>> {
    if (this.googleKeysCache && this.googleKeysCache.expiresAt > Date.now()) return this.googleKeysCache.keys;
    let response: Response;
    try {
      response = await fetch("https://www.googleapis.com/oauth2/v3/certs", { signal: AbortSignal.timeout(5000) });
    } catch {
      throw new ServiceUnavailableException("Không thể kết nối dịch vụ xác minh Google");
    }
    if (!response.ok) throw new ServiceUnavailableException("Dịch vụ xác minh Google hiện không khả dụng");
    const body = await response.json() as { keys?: Array<Record<string, string>> };
    const keys = new Map((body.keys || []).filter((item) => item.kid && item.kty === "RSA").map((item) => [item.kid, item]));
    if (!keys.size) throw new ServiceUnavailableException("Không tải được khóa xác minh Google");
    const maxAge = Number(response.headers.get("cache-control")?.match(/max-age=(\d+)/i)?.[1] || 300);
    this.googleKeysCache = { keys, expiresAt: Date.now() + Math.max(60, maxAge) * 1000 };
    return keys;
  }

  private async createAccessToken(user: User, sessionId: string): Promise<string> {
    return this.jwt.signAsync({ sub: user.id, sid: sessionId, role: user.role }, {
      expiresIn: this.config.get<string>("JWT_ACCESS_TTL", "15m") as any,
    });
  }

  private normalizeEmail(value: string): string {
    const email = value.trim().toLowerCase();
    if (!email) throw new BadRequestException("Email không hợp lệ");
    return email;
  }

  private hashToken(value: string): string { return createHash("sha256").update(value).digest("hex"); }
  private refreshExpiry(): Date {
    const days = Math.max(1, Number(this.config.get("REFRESH_TOKEN_DAYS", 30)) || 30);
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }
  private async nextCustomerCode(): Promise<string> {
    const repository = this.dataSource.getRepository(User);
    const lastCustomer = await repository
      .createQueryBuilder("user")
      .where("user.customerCode IS NOT NULL")
      .andWhere("user.customerCode LIKE :prefix", { prefix: "KH%" })
      .orderBy("user.customerCode", "DESC")
      .getOne();

    if (!lastCustomer?.customerCode) {
      return "KH0001";
    }

    const numStr = lastCustomer.customerCode.replace(/^KH/, "");
    const num = parseInt(numStr, 10);
    if (isNaN(num)) {
      return `KH${String(Date.now()).slice(-4)}`;
    }
    const nextNum = num + 1;
    return `KH${String(nextNum).padStart(4, "0")}`;
  }

  private toPrincipal(user: User): UserPrincipal {
    return {
      id: user.id,
      customerCode: user.customerCode,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isGoogle: Boolean(user.googleSubject),
    };
  }
}
