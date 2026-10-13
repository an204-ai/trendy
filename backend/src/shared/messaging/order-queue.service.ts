import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import amqp, { ChannelModel, ConfirmChannel } from "amqplib";
import { randomUUID } from "node:crypto";
import { UserPrincipal } from "../auth/auth.types";
import { CreateOrderDto } from "../orders/orders.dto";
import { OrderCreationResult } from "../orders/order-creation.processor";

export interface OrderQueuePayload {
  customer: UserPrincipal | null;
  dto: CreateOrderDto;
  idempotencyKey?: string;
  actor: UserPrincipal;
}

interface PendingRequest {
  resolve: (result: OrderCreationResult) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

@Injectable()
export class OrderQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderQueueService.name);
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private readonly pendingRequests = new Map<string, PendingRequest>();
  private isConnecting = false;
  private isDestroyed = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    await this.connect().catch((err) => {
      this.logger.warn(`Chưa kết nối được RabbitMQ khi khởi động: ${(err as Error).message}`);
    });
  }

  async onModuleDestroy() {
    this.isDestroyed = true;
    for (const [id, req] of this.pendingRequests.entries()) {
      clearTimeout(req.timer);
      req.reject(new Error("Dịch vụ đang dừng xử lý"));
      this.pendingRequests.delete(id);
    }
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  isAvailable(): boolean {
    return Boolean(this.channel && !this.isDestroyed);
  }

  private async connect(): Promise<ConfirmChannel | null> {
    if (this.channel) return this.channel;
    if (this.isConnecting || this.isDestroyed) return null;

    this.isConnecting = true;
    try {
      const url = this.config.get<string>(
        "RABBITMQ_URL",
        "amqp://trendy:trendy-local-password@rabbitmq:5672"
      );
      const conn = await amqp.connect(url);
      const ch = await conn.createConfirmChannel();

      await ch.assertQueue("orders.create_requests", { durable: true });
      await ch.assertQueue("orders.create_responses", { durable: true });

      // Lắng nghe kết quả từ worker gửi về
      await ch.consume(
        "orders.create_responses",
        (msg) => {
          if (!msg) return;
          const correlationId = msg.properties.correlationId;
          if (correlationId && this.pendingRequests.has(correlationId)) {
            const req = this.pendingRequests.get(correlationId)!;
            clearTimeout(req.timer);
            this.pendingRequests.delete(correlationId);
            try {
              const result = JSON.parse(msg.content.toString()) as OrderCreationResult;
              req.resolve(result);
            } catch (parseErr) {
              req.reject(parseErr as Error);
            }
          }
          ch.ack(msg);
        },
        { noAck: false }
      );

      conn.on("close", () => {
        this.channel = null;
        this.connection = null;
        if (!this.isDestroyed) {
          setTimeout(() => void this.connect(), 3000);
        }
      });

      conn.on("error", (err) => {
        this.logger.warn(`Lỗi kết nối RabbitMQ: ${err.message}`);
      });

      this.connection = conn;
      this.channel = ch;
      this.logger.log("Đã kết nối thành công với Message Queue (RabbitMQ) xử lý đơn hàng");
      return ch;
    } catch (err) {
      this.logger.warn(`Kết nối RabbitMQ thất bại: ${(err as Error).message}`);
      return null;
    } finally {
      this.isConnecting = false;
    }
  }

  async requestOrderCreation(payload: OrderQueuePayload): Promise<OrderCreationResult> {
    let ch = this.channel;
    if (!ch) {
      ch = await this.connect();
    }
    if (!ch) {
      throw new Error("Không thể kết nối tới Message Queue");
    }

    const correlationId = randomUUID();

    return new Promise<OrderCreationResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(correlationId)) {
          this.pendingRequests.delete(correlationId);
          reject(new Error("Quá thời gian chờ xử lý từ Message Queue"));
        }
      }, 8000);

      this.pendingRequests.set(correlationId, { resolve, reject, timer });

      try {
        ch!.sendToQueue(
          "orders.create_requests",
          Buffer.from(JSON.stringify(payload)),
          {
            correlationId,
            replyTo: "orders.create_responses",
            persistent: true,
          }
        );
      } catch (sendErr) {
        clearTimeout(timer);
        this.pendingRequests.delete(correlationId);
        reject(sendErr as Error);
      }
    });
  }
}
