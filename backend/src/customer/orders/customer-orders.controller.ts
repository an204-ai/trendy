import { Body, Controller, Get, Headers, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, Roles } from "../../shared/auth/auth.decorators";
import { AccessTokenGuard, RolesGuard } from "../../shared/auth/auth.guards";
import { UserRole } from "../../shared/database/entities";
import { UserPrincipal } from "../../shared/auth/auth.types";
import { CheckPromotionDto, CreateOrderDto } from "../../shared/orders/orders.dto";
import { OrdersService } from "../../shared/orders/orders.service";

@Controller("orders")
@UseGuards(AccessTokenGuard, RolesGuard)
export class CustomerOrdersController {
  constructor(private readonly orders: OrdersService) {}
  @Post() @Roles(UserRole.CUSTOMER) create(@CurrentUser() user: UserPrincipal, @Body() body: CreateOrderDto, @Headers("idempotency-key") key?: string) { return this.orders.create(user, body, key); }
  @Post("check-promotion") @Roles(UserRole.CUSTOMER) checkPromotion(@CurrentUser() user: UserPrincipal, @Body() body: CheckPromotionDto) { return this.orders.checkPromotion(user.id, body.code, body.subtotal); }
  @Get("mine") @Roles(UserRole.CUSTOMER) list(@CurrentUser() user: UserPrincipal) { return this.orders.listMine(user.id); }
  @Get("mine/:orderCode") @Roles(UserRole.CUSTOMER) get(@CurrentUser() user: UserPrincipal, @Param("orderCode") orderCode: string) { return this.orders.getOwned(user.id, orderCode); }
}
