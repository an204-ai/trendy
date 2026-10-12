import { Controller, Get, Param, Patch, Query, Body, UseGuards, Post, Delete } from "@nestjs/common";
import { CurrentUser, Roles } from "../../shared/auth/auth.decorators";
import { AccessTokenGuard, RolesGuard } from "../../shared/auth/auth.guards";
import { UserRole } from "../../shared/database/entities";
import { UserPrincipal } from "../../shared/auth/auth.types";
import { CancelOrderDto, CreateStaffOrderDto, RefundOrderDto, UpdateOrderDto } from "../../shared/orders/orders.dto";
import { OrdersService } from "../../shared/orders/orders.service";

@Controller("staff/orders")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class StaffOrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Get() list(@Query("status") status?: string, @Query("q") query?: string) { return this.orders.listForStaff(status, query); }
  @Post() create(@CurrentUser() user: UserPrincipal, @Body() body: CreateStaffOrderDto) { return this.orders.createForStaff(user, body); }
  @Get(":orderCode") get(@Param("orderCode") orderCode: string) { return this.orders.getForStaff(orderCode); }
  @Patch(":orderCode") update(@Param("orderCode") orderCode: string, @CurrentUser() user: UserPrincipal, @Body() body: UpdateOrderDto) { return this.orders.updateForStaff(orderCode, user, body); }
  @Post(":orderCode/cancel") cancel(@Param("orderCode") orderCode: string, @CurrentUser() user: UserPrincipal, @Body() body: CancelOrderDto) { return this.orders.cancelForStaff(orderCode, user, body.note); }
  @Post(":orderCode/refund") refund(@Param("orderCode") orderCode: string, @CurrentUser() user: UserPrincipal, @Body() body: RefundOrderDto) { return this.orders.refundForStaff(orderCode, user, body.reference, body.note); }
  @Delete(":orderCode") remove(@Param("orderCode") orderCode: string, @CurrentUser() user: UserPrincipal) { return this.orders.archiveForStaff(orderCode, user); }
}
