import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AccessTokenGuard, RolesGuard } from "../../shared/auth/auth.guards";
import { CurrentUser, Roles } from "../../shared/auth/auth.decorators";
import { UserPrincipal } from "../../shared/auth/auth.types";
import { UserRole } from "../../shared/database/entities";
import { CreatePromotionDto, UpdatePromotionDto } from "./promotions.dto";
import { PromotionsService } from "./promotions.service";

@Controller("staff/promotions")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class StaffPromotionsController {
  constructor(private readonly promotions: PromotionsService) {}
  @Get() list() { return this.promotions.list(); }
  @Post() create(@CurrentUser() user: UserPrincipal, @Body() body: CreatePromotionDto) { return this.promotions.create(user, body); }
  @Patch(":id") update(@Param("id") id: string, @Body() body: UpdatePromotionDto) { return this.promotions.update(id, body); }
  @Delete(":id") remove(@Param("id") id: string) { return this.promotions.remove(id); }
}
