import { Module } from "@nestjs/common";
import { AuthModule } from "../shared/auth/auth.module";
import { AccessTokenGuard, RolesGuard } from "../shared/auth/auth.guards";
import { OrdersModule } from "../shared/orders/orders.module";
import { CustomerOrdersController } from "./orders/customer-orders.controller";

@Module({ imports: [AuthModule, OrdersModule], controllers: [CustomerOrdersController], providers: [AccessTokenGuard, RolesGuard] })
export class CustomerModule {}
