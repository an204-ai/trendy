import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { databaseEntities } from "./shared/database/entities";
import { AuthModule } from "./shared/auth/auth.module";
import { CatalogModule } from "./shared/catalog/catalog.module";
import { StaffModule } from "./staff/staff.module";
import { CustomerModule } from "./customer/customer.module";
import { AdminModule } from "./admin/admin.module";
import { HealthController } from "./shared/health/health.controller";
import { MessagingModule } from "./shared/messaging/messaging.module";
import { ChatModule } from "./shared/chat/chat.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: "default",
          ttl: Number(config.get("THROTTLE_TTL")) || 60_000,
          limit: Number(config.get("THROTTLE_LIMIT")) || 120,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres" as const,
        url: config.get<string>("DATABASE_URL", "postgresql://trendy:trendy-local-password@localhost:5432/trendy"),
        entities: databaseEntities,
        migrationsTableName: "MigrationHistory",
        synchronize: false,
        logging: config.get<string>("NODE_ENV") !== "production",
      }),
    }),
    AuthModule,
    CatalogModule,
    StaffModule,
    CustomerModule,
    AdminModule,
    MessagingModule,
    ChatModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
