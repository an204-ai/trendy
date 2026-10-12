import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxEvent } from "../database/entities";
import { OutboxPublisher } from "./outbox.publisher";
@Module({ imports: [TypeOrmModule.forFeature([OutboxEvent])], providers: [OutboxPublisher] })
export class MessagingModule {}
