import "reflect-metadata";
import amqp, { ChannelModel, ConfirmChannel, ConsumeMessage } from "amqplib";
import { AppDataSource } from "./shared/database/data-source";
import { ProcessedMessage } from "./shared/database/entities";
import { executeOrderCreation } from "./shared/orders/order-creation.processor";

const rabbitUrl = process.env.RABBITMQ_URL || "amqp://trendy:trendy-local-password@localhost:5672";
const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let connection: ChannelModel | null = null;
let channel: ConfirmChannel | null = null;
const dataSource = AppDataSource;

async function setup(activeChannel: ConfirmChannel) {
  // 1. Queue xử lý tạo đơn hàng đồng thời chống xung đột tồn kho (RPC Pattern)
  await activeChannel.assertQueue("orders.create_requests", { durable: true });
  await activeChannel.assertQueue("orders.create_responses", { durable: true });

  // 2. Queue xử lý sự kiện outbox
  await activeChannel.assertQueue("orders", {
    durable: true,
    arguments: { "x-dead-letter-exchange": "", "x-dead-letter-routing-key": "orders.dead" },
  });
  await activeChannel.assertQueue("orders.retry", {
    durable: true,
    arguments: { "x-message-ttl": 5000, "x-dead-letter-exchange": "", "x-dead-letter-routing-key": "orders" },
  });
  await activeChannel.assertQueue("orders.dead", { durable: true });

  // Prefetch 1 đảm bảo xử lý tuần tự từng yêu cầu tạo đơn, triệt để loại bỏ race condition
  await activeChannel.prefetch(1);

  // Consumer cho yêu cầu tạo đơn
  await activeChannel.consume(
    "orders.create_requests",
    (message) => {
      if (message) void handleCreateOrderRequest(activeChannel, message);
    },
    { noAck: false }
  );

  // Consumer cho sự kiện thông báo outbox
  await activeChannel.consume(
    "orders",
    (message) => {
      if (message) void handleOutboxMessage(activeChannel, message);
    },
    { noAck: false }
  );

  console.info("✓ Worker Message Queue đã sẵn sàng xử lý yêu cầu đơn hàng");
}

async function handleCreateOrderRequest(activeChannel: ConfirmChannel, message: ConsumeMessage) {
  const correlationId = message.properties.correlationId;
  const replyTo = message.properties.replyTo;

  try {
    const payload = JSON.parse(message.content.toString());
    console.info(`[MQ Worker] Nhận yêu cầu tạo đơn hàng (correlationId: ${correlationId})`);

    // Thực thi kiểm tra tồn kho và tạo đơn nguyên tử trong transaction
    // NẾU THIẾU TỒN KHO: result.success = false, hoàn toàn KHÔNG tạo bản ghi đơn hàng nào vào database
    const result = await executeOrderCreation(
      dataSource,
      payload.customer,
      payload.dto,
      payload.idempotencyKey,
      payload.actor
    );

    if (replyTo) {
      activeChannel.sendToQueue(replyTo, Buffer.from(JSON.stringify(result)), {
        correlationId,
        persistent: true,
      });
    }

    activeChannel.ack(message);

    if (result.success) {
      console.info(`[MQ Worker] Đã tạo thành công đơn ${result.orderCode} qua Queue`);
    } else {
      console.warn(`[MQ Worker] Từ chối tạo đơn do không đủ điều kiện: ${result.message}`);
    }
  } catch (error) {
    console.error(`[MQ Worker] Lỗi xử lý yêu cầu tạo đơn: ${(error as Error).message}`);
    if (replyTo) {
      activeChannel.sendToQueue(
        replyTo,
        Buffer.from(
          JSON.stringify({
            success: false,
            statusCode: 500,
            message: (error as Error).message || "Lỗi xử lý đơn hàng trong Message Queue",
          })
        ),
        { correlationId, persistent: true }
      );
    }
    activeChannel.ack(message);
  }
}

async function handleOutboxMessage(activeChannel: ConfirmChannel, message: ConsumeMessage) {
  try {
    const packet = JSON.parse(message.content.toString()) as { pattern?: string; data?: { eventId?: string; orderId?: string } };
    if (packet.data?.eventId) {
      await dataSource.transaction(async (manager) => {
        const processed = manager.getRepository(ProcessedMessage);
        if (await processed.findOneBy({ id: packet.data!.eventId! })) return;
        await processed.insert({ id: packet.data!.eventId!, eventName: packet.pattern || "unknown" });
      });
    }
    activeChannel.ack(message);
    console.info(`[MQ Worker] Đã ghi nhận sự kiện ${packet.pattern} (${message.properties.messageId || ""})`);
  } catch (error) {
    const current = Number(message.properties.headers?.["x-retry-count"] || 0);
    if (current < 5) {
      activeChannel.sendToQueue("orders.retry", message.content, {
        persistent: true,
        contentType: message.properties.contentType,
        messageId: message.properties.messageId,
        headers: { ...message.properties.headers, "x-retry-count": current + 1 },
      });
      await activeChannel.waitForConfirms();
      activeChannel.ack(message);
    } else {
      activeChannel.nack(message, false, false);
      console.error("[MQ Worker] Chuyển sự kiện vào orders.dead:", (error as Error).message);
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
      activeConnection.on("close", () => {
        channel = null;
        connection = null;
      });
      await new Promise<void>((resolve) => activeConnection.once("close", resolve));
    } catch (error) {
      console.error("Worker không thể kết nối tới RabbitMQ, sẽ thử lại sau 3s:", (error as Error).message);
      await sleep(3000);
    }
  }
}

process.on("SIGTERM", async () => {
  await channel?.close().catch(() => undefined);
  await connection?.close().catch(() => undefined);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(0);
});

void connectForever();
