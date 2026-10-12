import { Controller, Get, Param } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}
  @Get("products") listProducts() { return this.catalog.listProducts(); }
  @Get("products/:slug") getProduct(@Param("slug") slug: string) { return this.catalog.getProduct(slug); }
  @Get("categories") listCategories() { return this.catalog.listCategories(); }
}
