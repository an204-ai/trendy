import { Body, Controller, Get, Patch, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Throttle } from "@nestjs/throttler";
import type { Request, Response } from "express";
import { CurrentUser } from "./auth.decorators";
import { AccessTokenGuard } from "./auth.guards";
import { GoogleLoginDto, LoginDto, ProfileUpdateDto, RegisterDto } from "./auth.dto";
import { AuthService } from "./auth.service";
import { UserPrincipal } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post("register")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async register(@Body() body: RegisterDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const pair = await this.auth.register(body, this.userAgent(request));
    this.setRefreshCookie(response, pair.refreshToken);
    return { accessToken: pair.accessToken, user: pair.user };
  }

  @Post("login")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(@Body() body: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const pair = await this.auth.login(body.email, body.password, this.userAgent(request));
    this.setRefreshCookie(response, pair.refreshToken);
    return { accessToken: pair.accessToken, user: pair.user };
  }

  @Post("staff/login")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async loginStaff(@Body() body: LoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const pair = await this.auth.loginStaff(body.email, body.password, this.userAgent(request));
    this.setRefreshCookie(response, pair.refreshToken);
    return { accessToken: pair.accessToken, user: pair.user };
  }

  @Post("google")
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async googleLogin(@Body() body: GoogleLoginDto, @Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const pair = await this.auth.googleLogin(body.credential, body.nonce, this.userAgent(request));
    this.setRefreshCookie(response, pair.refreshToken);
    return { accessToken: pair.accessToken, user: pair.user };
  }

  @Post("refresh")
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const pair = await this.auth.refresh(this.readCookie(request, "refreshToken"), this.userAgent(request));
    this.setRefreshCookie(response, pair.refreshToken);
    return { accessToken: pair.accessToken, user: pair.user };
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.auth.logout(this.readCookie(request, "refreshToken"));
    response.clearCookie("refreshToken", { httpOnly: true, sameSite: "lax", secure: this.secureCookie(), path: "/api/v1/auth" });
    return { ok: true };
  }

  @Get("me")
  @UseGuards(AccessTokenGuard)
  me(@CurrentUser() user: UserPrincipal) { return { user }; }

  @Patch("profile")
  @UseGuards(AccessTokenGuard)
  async updateProfile(@CurrentUser() user: UserPrincipal, @Body() body: ProfileUpdateDto) {
    return { user: await this.auth.updateProfile(user.id, body) };
  }

  private setRefreshCookie(response: Response, value: string) {
    const days = Math.max(1, Number(this.config.get("REFRESH_TOKEN_DAYS", 30)) || 30);
    response.cookie("refreshToken", value, {
      httpOnly: true,
      secure: this.secureCookie(),
      sameSite: "lax",
      path: "/api/v1/auth",
      maxAge: days * 24 * 60 * 60 * 1000,
    });
  }

  private secureCookie() { return this.config.get<string>("COOKIE_SECURE", "false") === "true"; }
  private userAgent(request: Request): string | undefined { const value = request.headers["user-agent"]; return Array.isArray(value) ? value[0] : value; }
  private readCookie(request: Request, name: string): string | undefined {
    const header = request.headers.cookie;
    if (!header) return undefined;
    const prefix = `${name}=`;
    const item = header.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
    if (!item) return undefined;
    try { return decodeURIComponent(item.slice(prefix.length)); } catch { return undefined; }
  }
}
