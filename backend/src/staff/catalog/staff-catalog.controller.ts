import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { AccessTokenGuard, RolesGuard } from "../../shared/auth/auth.guards";
import { Roles } from "../../shared/auth/auth.decorators";
import { UserRole } from "../../shared/database/entities";
import { CatalogService } from "../../shared/catalog/catalog.service";
import { CreateCategoryDto, CreateProductDto, UpdateCategoryDto, UpdateProductDto, UpdateStockDto } from "../../shared/catalog/catalog.dto";

@Controller("staff")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(UserRole.STAFF, UserRole.ADMIN)
export class StaffCatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("products") listProducts() { return this.catalog.listAdminProducts(); }
  @Post("products") createProduct(@Body() body: CreateProductDto) { return this.catalog.createProduct(body); }
  @Patch("products/:id") updateProduct(@Param("id") id: string, @Body() body: UpdateProductDto) { return this.catalog.updateProduct(id, body); }
  @Delete("products/:id") deleteProduct(@Param("id") id: string) { return this.catalog.deleteProduct(id); }
  @Patch("products/:id/variants/:sku/stock") updateStock(@Param("id") id: string, @Param("sku") sku: string, @Body() body: UpdateStockDto) { return this.catalog.updateStock(id, sku, body.stockOnHand); }

  @Get("categories") listCategories() { return this.catalog.listAdminCategories(); }
  @Post("categories") createCategory(@Body() body: CreateCategoryDto) { return this.catalog.createCategory(body); }
  @Patch("categories/:id") updateCategory(@Param("id") id: string, @Body() body: UpdateCategoryDto) { return this.catalog.updateCategory(id, body); }
  @Delete("categories/:id") deleteCategory(@Param("id") id: string) { return this.catalog.deleteCategory(id); }
}
