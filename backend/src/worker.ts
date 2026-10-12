import "reflect-metadata";
import amqp, { ChannelModel, ConfirmChannel, ConsumeMessage } from "amqplib";
import { AppDataSource } from "./shared/database/data-source";
import { CustomerOrder, OrderStatusHistory, ProcessedMessage } from "./shared/database/entities";

const rabbitUrl = process.env.RABBITMQ_URL || "amqp://trendy:trendy-local-password@localhost:5672";
const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let connection: ChannelModel | null = null;
let channel: ConfirmChannel | null = null;
const dataSource = AppDataSource;

async function setup(channel: ConfirmChannel) {
  await channel.assertQueue("orders", { durable: true, arguments: { "x-dead-letter-exchange": "", "x-dead-letter-routing-key": "orders.dead" } });
  await channel.assertQueue("orders.retry", { durable: true, arguments: { "x-message-ttl": 5000, "x-dead-letter-exchange": "", "x-dead-letter-routing-key": "orders" } });
  await channel.assertQueue("orders.dead", { durable: true });
  await channel.prefetch(10);
  await channel.consume("orders", (message) => { if (message) void handleMessage(channel!, message); }, { noAck: false });
}

async function handleMessage(activeChannel: ConfirmChannel, message: ConsumeMessage) {
  try {
    const packet = JSON.parse(message.content.toString()) as { pattern?: string; data?: { eventId?: string; orderId?: string } };
    if (packet.pattern !== "order.created" || !packet.data?.eventId || !packet.data.orderId) throw new Error("Unsupported or incomplete order event");
    await dataSource.transaction(async (manager) => {
      const processed = manager.getRepository(ProcessedMessage);
      if (await processed.findOneBy({ id: packet.data!.eventId! })) return;
      const orderRepo = manager.getRepository(CustomerOrder);
      const order = await orderRepo.createQueryBuilder("customerOrder").setLock("pessimistic_write").where('"customerOrder"."id" = :id', { id: packet.data!.orderId }).getOne();
      if (!order) throw new Error(`Order ${packet.data!.orderId} not found`);
      if (order.status === "RECEIVED") {
        order.status = "PENDING_CONFIRMATION";
        await orderRepo.save(order);
        await manager.getRepository(OrderStatusHistory).save({ orderId: order.id, fromStatus: "RECEIVED", toStatus: "PENDING_CONFIRMATION", actorUserId: null, note: "Đơn đã vào hàng đợi xử lý" });
      }
      await processed.insert({ id: packet.data!.eventId!, eventName: packet.pattern! });
    });
    activeChannel.ack(message);
    console.info(`Processed COD order event ${message.properties.messageId || ""}`);
  } catch (error) {
    const current = Number(message.properties.headers?.["x-retry-count"] || 0);
    if (current < 5) {
      activeChannel.sendToQueue("orders.retry", message.content, { persistent: true, contentType: message.properties.contentType, messageId: message.properties.messageId, headers: { ...message.properties.headers, "x-retry-count": current + 1 } });
      await activeChannel.waitForConfirms();
      activeChannel.ack(message);
    } else {
      activeChannel.nack(message, false, false);
      console.error("Order event moved to orders.dead:", (error as Error).message);
    }
  }
}

async function connectForever() {
  while (true) {
    try {
      if (!dataSource.isInitialized) await dataSource.initialize();
      const activeConnection = await amqp.connect(rabbitUrl);
      const activeChannel = await activeConnection.createConfirmChannel();
      connection = activeConnection;
      channel = activeChannel;
      await setup(activeChannel);
      activeConnection.on("close", () => { channel = null; connection = null; });
      await new Promise<void>((resolve) => activeConnection.once("close", resolve));
    } catch (error) {
      console.error("Worker could not connect; retrying:", (error as Error).message);
      await sleep(3000);
    }
  }
}

process.on("SIGTERM", async () => { await channel?.close().catch(() => undefined); await connection?.close().catch(() => undefined); if (dataSource.isInitialized) await dataSource.destroy(); process.exit(0); });
void connectForever();
