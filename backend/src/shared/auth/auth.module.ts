import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RefreshSession, User } from "../database/entities";
import { AccessTokenGuard } from "./auth.guards";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, RefreshSession]), JwtModule.registerAsync({
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({ secret: config.get<string>("JWT_ACCESS_SECRET", "local-only-change-this-secret") }),
  })],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenGuard],
  exports: [AuthService, AccessTokenGuard, JwtModule, TypeOrmModule],
})
export class AuthModule {}
