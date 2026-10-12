import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerOrder, OrderItem, OrderStatusHistory, OutboxEvent, Product, ProductVariant } from "../database/entities";
import { OrdersService } from "./orders.service";

@Module({
  imports: [TypeOrmModule.forFeature([CustomerOrder, OrderItem, OrderStatusHistory, OutboxEvent, Product, ProductVariant])],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
