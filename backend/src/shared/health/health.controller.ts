import { Controller, Get, Optional } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisService } from "../redis/redis.service";

@Controller("health")
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    @Optional() private readonly redis?: RedisService,
  ) {}

  @Get() async health() {
    await this.dataSource.query("SELECT 1");
    return {
      status: "ok",
      database: "ok",
      redis: this.redis?.isAvailable ? "ok" : "degraded",
    };
  }
}

