import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DataSource } from "typeorm";
import amqp, { ChannelModel, ConfirmChannel } from "amqplib";
import { IsNull } from "typeorm";
import { OutboxEvent } from "../database/entities";

@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private timer: NodeJS.Timeout | null = null;
  private busy = false;
  private stopped = false;
  constructor(private readonly dataSource: DataSource, private readonly config: ConfigService) {}

  onModuleInit() { this.timer = setInterval(() => void this.publishPending(), 1500); this.timer.unref(); void this.publishPending(); }
  async onModuleDestroy() {
    this.stopped = true;
    if (this.timer) clearInterval(this.timer);
    await this.channel?.close().catch(() => undefined);
    await this.connection?.close().catch(() => undefined);
  }

  async publishImmediate() {
    await this.publishPending();
  }

  private async ensureChannel() {
    if (this.channel) return this.channel;
    const connection = await amqp.connect(this.config.get<string>("RABBITMQ_URL", "amqp://trendy:trendy-local-password@rabbitmq:5672"));
    const channel = await connection.createConfirmChannel();
    await channel.assertQueue("orders", { durable: true, arguments: { "x-dead-letter-exchange": "", "x-dead-letter-routing-key": "orders.dead" } });
    await channel.assertQueue("orders.retry", { durable: true, arguments: { "x-message-ttl": 5000, "x-dead-letter-exchange": "", "x-dead-letter-routing-key": "orders" } });
    await channel.assertQueue("orders.dead", { durable: true });
    connection.on("close", () => { if (this.connection === connection) { this.connection = null; this.channel = null; } });
    connection.on("error", (error) => this.logger.warn(`RabbitMQ connection: ${error.message}`));
    this.connection = connection;
    this.channel = channel;
    return channel;
  }

  private async publishPending() {
    if (this.busy || this.stopped || !this.dataSource.isInitialized) return;
    this.busy = true;
    try {
      const rows = await this.dataSource.getRepository(OutboxEvent).find({ where: { publishedAt: IsNull() }, order: { createdAt: "ASC" }, take: 20 });
      if (!rows.length) return;
      const channel = await this.ensureChannel();
      for (const event of rows) {
        const packet = { pattern: event.eventName, data: { ...event.payload, eventId: event.id } };
        channel.sendToQueue("orders", Buffer.from(JSON.stringify(packet)), { persistent: true, contentType: "application/json", messageId: event.id });
        await channel.waitForConfirms();
        await this.dataSource.getRepository(OutboxEvent).update({ id: event.id, publishedAt: IsNull() }, { publishedAt: new Date(), attempts: event.attempts + 1, lastError: null });
      }
    } catch (error) {
      this.logger.warn(`Outbox publish pending; will retry: ${(error as Error).message}`);
      const connection = this.connection;
      this.channel = null;
      this.connection = null;
      await connection?.close().catch(() => undefined);
      await this.dataSource.getRepository(OutboxEvent).createQueryBuilder().update().set({ attempts: () => '"attempts" + 1', lastError: (error as Error).message }).where('"publishedAt" IS NULL').execute().catch(() => undefined);
    } finally { this.busy = false; }
  }
}
