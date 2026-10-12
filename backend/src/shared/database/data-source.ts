import "reflect-metadata";
import { DataSource } from "typeorm";
import { databaseEntities } from "./entities";

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: databaseEntities,
  synchronize: false,
  migrationsRun: false,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : false,
});
