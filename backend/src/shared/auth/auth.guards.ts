import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IsNull, MoreThan, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import type { Request } from "express";
import { RefreshSession, User, UserRole } from "../database/entities";
import { ROLE_METADATA } from "./auth.decorators";
import { UserPrincipal } from "./auth.types";

type AccessClaims = { sub: string; sid: string; role: UserRole };
type AuthRequest = Request & { user?: UserPrincipal };

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshSession) private readonly sessions: Repository<RefreshSession>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const authorization = request.headers.authorization;
    const token = typeof authorization === "string" && authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) throw new UnauthorizedException("Vui lòng đăng nhập");

    let claims: AccessClaims;
    try {
      claims = await this.jwt.verifyAsync<AccessClaims>(token);
    } catch {
      throw new UnauthorizedException("Phiên đăng nhập đã hết hạn");
    }
    if (!claims.sub || !claims.sid) throw new UnauthorizedException("Token không hợp lệ");

    const [user, session] = await Promise.all([
      this.users.findOne({ where: { id: claims.sub, active: true } }),
      this.sessions.findOne({ where: { id: claims.sid, userId: claims.sub, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) } }),
    ]);
    if (!user || !session) throw new UnauthorizedException("Phiên đăng nhập không còn hiệu lực");

    request.user = { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role };
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLE_METADATA, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const request = context.switchToHttp().getRequest<AuthRequest>();
    if (!request.user) throw new UnauthorizedException("Vui lòng đăng nhập");
    if (!roles.includes(request.user.role)) throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này");
    return true;
  }
}
