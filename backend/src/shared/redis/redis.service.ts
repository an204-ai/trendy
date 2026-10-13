import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private isConnected = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.get<string>("REDIS_URL") || "redis://localhost:6379";
    try {
      this.client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => Math.min(times * 100, 3000),
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        this.logger.log("Đã kết nối thành công với Redis cache");
      });

      this.client.on("error", (err) => {
        this.isConnected = false;
        this.logger.warn(`Lỗi kết nối Redis: ${err.message}`);
      });

      this.client.on("close", () => {
        this.isConnected = false;
      });

      this.client.connect().catch((err) => {
        this.logger.warn(`Không thể kết nối Redis khi khởi động: ${err.message}`);
      });
    } catch (err) {
      this.logger.warn(`Khởi tạo Redis client thất bại: ${err}`);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
    }
  }

  get isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable || !this.client) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      this.logger.warn(`Lỗi đọc cache key ${key}: ${err}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!this.isAvailable || !this.client) return;
    try {
      const payload = JSON.stringify(value);
      if (ttlSeconds > 0) {
        await this.client.set(key, payload, "EX", ttlSeconds);
      } else {
        await this.client.set(key, payload);
      }
    } catch (err) {
      this.logger.warn(`Lỗi ghi cache key ${key}: ${err}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.isAvailable || !this.client || keys.length === 0) return;
    try {
      await this.client.del(...keys);
    } catch (err) {
      this.logger.warn(`Lỗi xóa cache keys: ${err}`);
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isAvailable || !this.client) return;
    try {
      const stream = this.client.scanStream({ match: pattern, count: 100 });
      stream.on("data", async (keys: string[]) => {
        if (keys.length && this.client) {
          stream.pause();
          try {
            await this.client.del(...keys);
          } catch {}
          stream.resume();
        }
      });
    } catch (err) {
      this.logger.warn(`Lỗi xóa cache theo pattern ${pattern}: ${err}`);
    }
  }
}
