import { Module } from "@nestjs/common";
import { AuthModule } from "../shared/auth/auth.module";
import { AccessTokenGuard, RolesGuard } from "../shared/auth/auth.guards";
import { OrdersModule } from "../shared/orders/orders.module";
import { StaffOrdersController } from "./orders/staff-orders.controller";
import { CatalogModule } from "../shared/catalog/catalog.module";
import { StaffCatalogController } from "./catalog/staff-catalog.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Promotion, User } from "../shared/database/entities";
import { StaffPromotionsController } from "./promotions/staff-promotions.controller";
import { PromotionsService } from "./promotions/promotions.service";
import { StaffCustomersController } from "./customers/staff-customers.controller";

@Module({ imports: [AuthModule, OrdersModule, CatalogModule, TypeOrmModule.forFeature([Promotion, User])], controllers: [StaffOrdersController, StaffCatalogController, StaffPromotionsController, StaffCustomersController], providers: [AccessTokenGuard, RolesGuard, PromotionsService] })
export class StaffModule {}
