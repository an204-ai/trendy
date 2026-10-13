import { Controller, Get, Param, Res } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { Response } from "express";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("products") listProducts() { return this.catalog.listProducts(); }
  @Get("products/:slug") getProduct(@Param("slug") slug: string) { return this.catalog.getProduct(slug); }
  @Get("categories") listCategories() { return this.catalog.listCategories(); }

  @Get("sitemap.xml")
  async getSitemap(@Res() res: Response) {
    const xml = await this.catalog.getSitemapXml();
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(xml);
  }
}
