import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerOrder, OrderItem, OrderStatusHistory, OutboxEvent, Product, ProductVariant, Promotion } from "../database/entities";
import { MessagingModule } from "../messaging/messaging.module";
import { OrdersService } from "./orders.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerOrder, OrderItem, OrderStatusHistory, OutboxEvent, Product, ProductVariant, Promotion]),
    MessagingModule,
  ],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
