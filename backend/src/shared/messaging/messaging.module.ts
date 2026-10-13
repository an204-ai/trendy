import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxEvent } from "../database/entities";
import { OutboxPublisher } from "./outbox.publisher";
import { OrderQueueService } from "./order-queue.service";

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent])],
  providers: [OutboxPublisher, OrderQueueService],
  exports: [OutboxPublisher, OrderQueueService],
})
export class MessagingModule {}
