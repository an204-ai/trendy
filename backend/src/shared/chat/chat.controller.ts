import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AccessTokenGuard, RolesGuard } from "../auth/auth.guards";
import { CurrentUser, Roles } from "../auth/auth.decorators";
import { UserPrincipal } from "../auth/auth.types";
import { UserRole } from "../database/entities";
import { SendChatMessageDto, UpdateConversationDto } from "./chat.dto";
import { ChatService } from "./chat.service";

@Controller("customer/chat")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.CUSTOMER)
export class CustomerChatController {
  constructor(private readonly chat: ChatService) {}
  @Get() get(@CurrentUser() user: UserPrincipal) { return this.chat.getCustomerConversation(user.id); }
  @Post("messages") send(@CurrentUser() user: UserPrincipal, @Body() body: SendChatMessageDto) { return this.chat.sendCustomerMessage(user, body.body); }
}

@Controller("staff/chat")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class StaffChatController {
  constructor(private readonly chat: ChatService) {}
  @Get("conversations") list() { return this.chat.listForStaff(); }
  @Get("conversations/:id/messages") messages(@Param("id") id: string) { return this.chat.getStaffMessages(id); }
  @Post("conversations/:id/messages") send(@Param("id") id: string, @CurrentUser() user: UserPrincipal, @Body() body: SendChatMessageDto) { return this.chat.sendStaffMessage(id, user, body.body); }
  @Patch("conversations/:id") update(@Param("id") id: string, @Body() body: UpdateConversationDto) { return this.chat.updateStatus(id, body.status); }
  @Delete("conversations/:id") remove(@Param("id") id: string) { return this.chat.deleteConversation(id); }
}
