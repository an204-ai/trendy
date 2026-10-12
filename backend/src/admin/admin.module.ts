import { Module } from "@nestjs/common";
import { AuthModule } from "../shared/auth/auth.module";
import { AccessTokenGuard, RolesGuard } from "../shared/auth/auth.guards";
import { AdminStaffController } from "./staff/admin-staff.controller";

@Module({ imports: [AuthModule], controllers: [AdminStaffController], providers: [AccessTokenGuard, RolesGuard] })
export class AdminModule {}
