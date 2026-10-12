import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product, ProductCategory } from "../database/entities";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";
@Module({ imports: [TypeOrmModule.forFeature([Product, ProductCategory])], controllers: [CatalogController], providers: [CatalogService], exports: [CatalogService] })
export class CatalogModule {}
