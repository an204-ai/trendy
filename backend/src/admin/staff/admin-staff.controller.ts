import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "../../shared/auth/auth.service";
import { AccessTokenGuard, RolesGuard } from "../../shared/auth/auth.guards";
import { CurrentUser, Roles } from "../../shared/auth/auth.decorators";
import { UserRole } from "../../shared/database/entities";
import { CreateStaffDto, UpdateStaffDto } from "../../shared/auth/auth.dto";
import { UserPrincipal } from "../../shared/auth/auth.types";

@Controller("staff/users")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminStaffController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  async listStaff() {
    return { users: await this.auth.listStaff() };
  }

  @Post()
  async createStaff(@Body() body: CreateStaffDto) {
    return { user: await this.auth.createStaff(body) };
  }

  @Patch(":id")
  async updateStaff(
    @Param("id") id: string,
    @CurrentUser() currentUser: UserPrincipal,
    @Body() body: UpdateStaffDto,
  ) {
    return { user: await this.auth.updateStaff(id, body, currentUser.id) };
  }

  @Delete(":id")
  async deleteStaff(
    @Param("id") id: string,
    @CurrentUser() currentUser: UserPrincipal,
  ) {
    return await this.auth.deleteStaff(id, currentUser.id);
  }
}

