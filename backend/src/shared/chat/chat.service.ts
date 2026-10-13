import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ChatMessage, Conversation, UserRole } from "../database/entities";
import { UserPrincipal } from "../auth/auth.types";

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation) private readonly conversations: Repository<Conversation>,
    @InjectRepository(ChatMessage) private readonly messages: Repository<ChatMessage>,
  ) {}

  async getCustomerConversation(customerId: string) {
    const conversation = await this.conversations.findOne({ where: { customerId, status: "OPEN" }, order: { updatedAt: "DESC" } });
    if (!conversation) return { conversation: null, messages: [] };
    const rows = await this.messages.find({ where: { conversationId: conversation.id }, relations: { sender: true }, order: { createdAt: "ASC" }, take: 200 });
    await this.messages.update({ conversationId: conversation.id, readByCustomer: false }, { readByCustomer: true });
    return { conversation: { id: conversation.id, status: conversation.status }, messages: rows.map((message) => this.presentMessage(message)) };
  }

  async sendCustomerMessage(customer: UserPrincipal, body: string) {
    let conversation = await this.conversations.findOne({ where: { customerId: customer.id, status: "OPEN" }, order: { updatedAt: "DESC" } });
    if (!conversation) conversation = await this.conversations.save(this.conversations.create({ customerId: customer.id, status: "OPEN", lastMessageAt: null }));
    const saved = await this.messages.save(this.messages.create({ conversationId: conversation.id, senderUserId: customer.id, body: body.trim(), readByStaff: false, readByCustomer: true }));
    conversation.lastMessageAt = saved.createdAt;
    await this.conversations.save(conversation);
    const message = await this.messages.findOne({ where: { id: saved.id }, relations: { sender: true } });
    return { conversationId: conversation.id, message: this.presentMessage(message!) };
  }

  async listForStaff() {
    const conversations = await this.conversations.createQueryBuilder("conversation")
      .leftJoinAndSelect("conversation.customer", "customer")
      .orderBy("conversation.lastMessageAt", "DESC", "NULLS LAST")
      .addOrderBy("conversation.updatedAt", "DESC")
      .take(200).getMany();
    return Promise.all(conversations.map(async (conversation) => {
      const [latestMessage, unreadCount] = await Promise.all([
        this.messages.findOne({ where: { conversationId: conversation.id }, order: { createdAt: "DESC" } }),
        this.messages.count({ where: { conversationId: conversation.id, readByStaff: false } }),
      ]);
      return {
        id: conversation.id,
        status: conversation.status,
        lastMessageAt: conversation.lastMessageAt,
        customer: conversation.customer ? { id: conversation.customer.id, email: conversation.customer.email, fullName: conversation.customer.fullName, phone: conversation.customer.phone } : null,
        latestMessage: latestMessage ? { body: latestMessage.body, senderUserId: latestMessage.senderUserId, createdAt: latestMessage.createdAt } : null,
        unreadCount,
      };
    }));
  }

  async getStaffMessages(conversationId: string) {
    const conversation = await this.conversations.findOne({ where: { id: conversationId }, relations: { customer: true } });
    if (!conversation) throw new NotFoundException("Không tìm thấy hội thoại");
    const rows = await this.messages.find({ where: { conversationId }, relations: { sender: true }, order: { createdAt: "ASC" }, take: 500 });
    await this.messages.update({ conversationId, readByStaff: false }, { readByStaff: true });
    return {
      conversation: { id: conversation.id, status: conversation.status, customer: { id: conversation.customer.id, email: conversation.customer.email, fullName: conversation.customer.fullName, phone: conversation.customer.phone } },
      messages: rows.map((message) => this.presentMessage(message)),
    };
  }

  async sendStaffMessage(conversationId: string, staff: UserPrincipal, body: string) {
    const conversation = await this.conversations.findOneBy({ id: conversationId });
    if (!conversation) throw new NotFoundException("Không tìm thấy hội thoại");
    if (conversation.status !== "OPEN") throw new ConflictException("Hội thoại đã đóng");
    const saved = await this.messages.save(this.messages.create({ conversationId, senderUserId: staff.id, body: body.trim(), readByStaff: true, readByCustomer: false }));
    conversation.lastMessageAt = saved.createdAt;
    await this.conversations.save(conversation);
    const message = await this.messages.findOne({ where: { id: saved.id }, relations: { sender: true } });
    return this.presentMessage(message!);
  }

  async updateStatus(conversationId: string, status: "OPEN" | "CLOSED") {
    const conversation = await this.conversations.findOneBy({ id: conversationId });
    if (!conversation) throw new NotFoundException("Không tìm thấy hội thoại");
    conversation.status = status;
    await this.conversations.save(conversation);
    return { id: conversation.id, status: conversation.status };
  }

  async deleteConversation(conversationId: string) {
    const conversation = await this.conversations.findOneBy({ id: conversationId });
    if (!conversation) throw new NotFoundException("Không tìm thấy hội thoại");
    await this.conversations.delete(conversationId);
    return { success: true, id: conversationId };
  }

  private presentMessage(message: ChatMessage) {
    return {
      id: message.id,
      body: message.body,
      senderUserId: message.senderUserId,
      senderName: message.sender?.fullName || "",
      senderRole: message.sender?.role || UserRole.CUSTOMER,
      createdAt: message.createdAt,
    };
  }
}
