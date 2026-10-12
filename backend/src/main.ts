import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: "20mb" }));
  app.use(urlencoded({ extended: true, limit: "20mb" }));
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT || 3000), "0.0.0.0");
}
void bootstrap();
