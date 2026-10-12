import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { AccessTokenGuard, RolesGuard } from "../auth/auth.guards";
import { ChatMessage, Conversation, User } from "../database/entities";
import { CustomerChatController, StaffChatController } from "./chat.controller";
import { ChatService } from "./chat.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Conversation, ChatMessage, User])],
  controllers: [CustomerChatController, StaffChatController],
  providers: [AccessTokenGuard, RolesGuard, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
