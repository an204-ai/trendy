import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "../../shared/auth/auth.service";
import { AccessTokenGuard, RolesGuard } from "../../shared/auth/auth.guards";
import { Roles } from "../../shared/auth/auth.decorators";
import { UserRole } from "../../shared/database/entities";
import { CreateStaffDto } from "../../shared/auth/auth.dto";

@Controller("staff/users")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminStaffController {
  constructor(private readonly auth: AuthService) {}
  @Post() async createStaff(@Body() body: CreateStaffDto) { return { user: await this.auth.createStaff(body) }; }
}
