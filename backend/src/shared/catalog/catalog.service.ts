import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import { Product, ProductCategory, ProductCategoryLink, ProductImage, ProductVariant } from "../database/entities";
import { CreateCategoryDto, CreateProductDto, ProductVariantInputDto, UpdateCategoryDto, UpdateProductDto } from "./catalog.dto";

const productRelations = { variants: true, images: true, categoryLinks: { category: true } } as const;
const slugify = (value: string) => value.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const withoutFrameShape = (specifications?: Record<string, unknown> | null) => {
  if (!specifications) return specifications || null;
  const remaining = { ...specifications };
  delete remaining.frameShape;
  return Object.keys(remaining).length ? remaining : null;
};

@Injectable()
export class CatalogService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(ProductCategory) private readonly categories: Repository<ProductCategory>,
  ) {}

  async listProducts() {
    const products = await this.products.find({ where: { active: true }, relations: productRelations, order: { createdAt: "DESC" } });
    return products.map((product) => this.present(product));
  }

  async getProduct(slug: string) {
    const product = await this.products.findOne({ where: { slug, active: true }, relations: productRelations });
    if (!product) throw new NotFoundException("Không tìm thấy sản phẩm");
    return this.present(product);
  }

  async listCategories() {
    const categories = await this.categories.find({ where: { active: true }, relations: { children: true }, order: { sortOrder: "ASC", title: "ASC" } });
    return categories.filter((category) => !category.parentId).map((category) => ({ ...category, children: (category.children || []).filter((child) => child.active).sort((a, b) => a.sortOrder - b.sortOrder) }));
  }

  async listAdminProducts() {
    const rows = await this.products.find({ relations: productRelations, order: { updatedAt: "DESC" } });
    return rows.map((product) => this.present(product, true));
  }

  async getAdminProduct(id: string) {
    const product = await this.products.findOne({ where: { id }, relations: productRelations });
    if (!product) throw new NotFoundException("Không tìm thấy sản phẩm");
    return this.present(product, true);
  }

  async createProduct(dto: CreateProductDto) {
    return this.dataSource.transaction(async (manager) => {
      await this.assertCategoryIds(dto.categoryIds, manager.getRepository(ProductCategory));
      await this.assertProductIdentifiers(dto, manager.getRepository(Product));
      this.assertVariants(dto.variants);
      const products = manager.getRepository(Product);
      const product = await products.save(products.create({
        code: dto.code.trim(), slug: slugify(dto.slug), name: dto.name.trim(), sku: dto.sku.trim(), price: dto.price,
        description: dto.description?.trim() || null, image: dto.image.trim(), front: dto.front?.trim() || null,
        specifications: withoutFrameShape(dto.specifications),
        active: dto.active !== undefined ? Boolean(dto.active) : true,
      }));
      await this.replaceProductLinks(manager, product.id, dto.categoryIds);
      await this.replaceImages(manager, product, dto.images);
      await this.replaceVariants(manager, product, dto.variants);
      const saved = await products.findOne({ where: { id: product.id }, relations: productRelations });
      return this.present(saved!, true);
    });
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    return this.dataSource.transaction(async (manager) => {
      const products = manager.getRepository(Product);
      const product = await products.findOne({ where: { id }, relations: productRelations });
      if (!product) throw new NotFoundException("Không tìm thấy sản phẩm");
      if (dto.categoryIds) await this.assertCategoryIds(dto.categoryIds, manager.getRepository(ProductCategory));
      await this.assertProductIdentifiers(dto, products, id);
      if (dto.variants) this.assertVariants(dto.variants);
      Object.assign(product, {
        ...(dto.code !== undefined ? { code: dto.code.trim() } : {}),
        ...(dto.slug !== undefined ? { slug: slugify(dto.slug) } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.sku !== undefined ? { sku: dto.sku.trim() } : {}),
        ...(dto.price !== undefined ? { price: dto.price } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.image !== undefined ? { image: dto.image.trim() } : {}),
        ...(dto.front !== undefined ? { front: dto.front.trim() || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.specifications !== undefined ? { specifications: withoutFrameShape(dto.specifications) } : {}),
      });
      await products.save(product);
      if (dto.categoryIds) await this.replaceProductLinks(manager, product.id, dto.categoryIds);
      if (dto.images) await this.replaceImages(manager, product, dto.images);
      if (dto.variants) await this.replaceVariants(manager, product, dto.variants);
      const saved = await products.findOne({ where: { id: product.id }, relations: productRelations });
      return this.present(saved!, true);
    });
  }

  async deleteProduct(id: string) {
    const product = await this.products.findOneBy({ id });
    if (!product) throw new NotFoundException("Không tìm thấy sản phẩm");
    await this.products.delete({ id });
    return { id, deleted: true };
  }

  async updateStock(productId: string, sku: string, stockOnHand: number) {
    const repo = this.dataSource.getRepository(ProductVariant);
    const variant = await repo.findOneBy({ productId, sku });
    if (!variant) throw new NotFoundException("Không tìm thấy biến thể sản phẩm");
    variant.stockOnHand = stockOnHand;
    await repo.save(variant);
    return { productId, sku, stockOnHand: variant.stockOnHand };
  }

  async listAdminCategories() {
    return this.categories.find({ relations: { children: true }, order: { sortOrder: "ASC", title: "ASC" } });
  }

  async createCategory(dto: CreateCategoryDto) {
    const id = slugify(dto.id || dto.title);
    if (!id) throw new BadRequestException("Mã danh mục không hợp lệ");
    const existing = await this.categories.findOneBy({ id });
    if (existing) throw new ConflictException("Mã danh mục đã được sử dụng");
    if (dto.parentId) await this.ensureActiveParent(dto.parentId);
    const category = this.categories.create({ id, title: dto.title.trim(), label: dto.label?.trim() || dto.title.trim(), parentId: dto.parentId || null, sortOrder: dto.sortOrder ?? 0, active: true });
    return this.categories.save(category);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categories.findOneBy({ id });
    if (!category) throw new NotFoundException("Không tìm thấy danh mục");
    if (dto.parentId !== undefined && (dto.parentId || null) !== category.parentId) {
      if (dto.parentId === id) throw new BadRequestException("Danh mục không thể là danh mục cha của chính nó");
      if (dto.parentId) {
        await this.ensureActiveParent(dto.parentId);
        let parentId: string | null = dto.parentId;
        while (parentId) {
          if (parentId === id) throw new BadRequestException("Không thể tạo vòng lặp danh mục");
          parentId = (await this.categories.findOneBy({ id: parentId }))?.parentId || null;
        }
      }
      category.parentId = dto.parentId || null;
    }
    if (dto.title !== undefined) category.title = dto.title.trim();
    if (dto.label !== undefined) category.label = dto.label.trim() || category.title;
    if (dto.sortOrder !== undefined) category.sortOrder = dto.sortOrder;
    if (dto.active !== undefined) category.active = dto.active;
    return this.categories.save(category);
  }

  async deleteCategory(id: string) {
    return this.dataSource.transaction(async (manager) => {
      const categories = manager.getRepository(ProductCategory);
      const allCategories = await categories.find({ select: { id: true, parentId: true } });
      if (!allCategories.some((category) => category.id === id)) throw new NotFoundException("Không tìm thấy danh mục");

      const descendants = new Map<string, number>([[id, 0]]);
      let currentDepth = 0;
      let frontier = [id];
      while (frontier.length) {
        const next = allCategories
          .filter((category) => frontier.includes(category.parentId || ""))
          .filter((category) => !descendants.has(category.id));
        currentDepth += 1;
        next.forEach((category) => descendants.set(category.id, currentDepth));
        frontier = next.map((category) => category.id);
      }

      const ids = [...descendants.keys()];
      await manager.getRepository(ProductCategoryLink).delete({ categoryId: In(ids) });
      for (const categoryId of [...ids].sort((a, b) => descendants.get(b)! - descendants.get(a)!)) {
        await categories.delete({ id: categoryId });
      }
      return { id, deleted: true };
    });
  }

  private async assertCategoryIds(ids: string[], repo: Repository<ProductCategory>) {
    const unique = [...new Set(ids || [])];
    if (unique.length !== (ids || []).length) throw new BadRequestException("Danh mục bị lặp");
    if (!unique.length) return;
    const found = await repo.find({ where: { id: In(unique), active: true } });
    if (found.length !== unique.length) throw new BadRequestException("Có danh mục không tồn tại hoặc đã ngừng hoạt động");
  }

  private async assertProductIdentifiers(dto: Partial<CreateProductDto>, repo: Repository<Product>, currentId?: string) {
    for (const key of ["code", "slug", "sku"] as const) {
      const value = dto[key]?.trim();
      if (!value) continue;
      const existing = await repo.findOneBy({ [key]: key === "slug" ? slugify(value) : value } as any);
      if (existing && existing.id !== currentId) throw new ConflictException(`Mã sản phẩm ${key} đã được sử dụng`);
    }
  }

  private assertVariants(variants: ProductVariantInputDto[]) {
    const skus = variants.map((variant) => variant.sku.trim().toLocaleUpperCase());
    if (new Set(skus).size !== skus.length) throw new BadRequestException("SKU biến thể bị trùng");
  }

  private async replaceProductLinks(manager: any, productId: string, categoryIds: string[]) {
    const repo = manager.getRepository(ProductCategoryLink);
    await repo.delete({ productId });
    const links = [...new Set(categoryIds || [])].map((categoryId) => repo.create({ productId, categoryId }));
    if (links.length) await repo.save(links);
  }

  private async replaceImages(manager: any, product: Product, images?: string[]) {
    const repo = manager.getRepository(ProductImage);
    await repo.delete({ productId: product.id });
    const urls = (images?.length ? images : [product.image, product.front].filter((url): url is string => Boolean(url))).map((url) => url.trim()).filter(Boolean);
    if (urls.length) await repo.save(urls.map((url, position) => repo.create({ productId: product.id, url, alt: product.name, position })));
  }

  private async replaceVariants(manager: any, product: Product, inputs: ProductVariantInputDto[]) {
    const repo = manager.getRepository(ProductVariant);
    const existing = await repo.find({ where: { productId: product.id } });
    for (const input of inputs) {
      const sku = input.sku.trim();
      const collision = await repo.findOneBy({ sku });
      if (collision && collision.productId !== product.id) throw new ConflictException(`SKU ${sku} đã được sử dụng`);
      const variant = existing.find((item) => item.sku === sku) || repo.create({ productId: product.id, sku, name: input.name.trim() });
      Object.assign(variant, {
        sku,
        name: input.name.trim(),
        swatch: input.swatch?.trim() || null,
        price: input.price ?? null,
        stockOnHand: input.stockOnHand ?? null,
        image: input.image?.trim() || null,
        active: true,
      });
      await repo.save(variant);
    }
    const activeSkus = inputs.map((input) => input.sku.trim());
    const update = repo.createQueryBuilder().update(ProductVariant).set({ active: false }).where('"productId" = :productId', { productId: product.id });
    if (activeSkus.length) update.andWhere('"sku" NOT IN (:...activeSkus)', { activeSkus });
    await update.execute();
  }

  private async ensureActiveParent(id: string) {
    const parent = await this.categories.findOneBy({ id, active: true });
    if (!parent) throw new NotFoundException("Không tìm thấy danh mục cha");
  }

  private present(product: Product, includeInactive = false) {
    return {
      id: product.id,
      code: product.code,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      price: product.price,
      description: product.description,
      image: product.image,
      front: product.front,
      active: product.active,
      category: (product.categoryLinks || []).map((link) => link.category).filter((category) => category?.active).map((category) => category.id),
      categories: (product.categoryLinks || []).map((link) => link.category).filter((category) => category?.active),
      specifications: withoutFrameShape(product.specifications),
      variants: (product.variants || []).filter((variant) => includeInactive || variant.active).map(({ id, sku, name, swatch, price, stockOnHand, image, active }) => ({ id, sku, name, swatch, price, stockOnHand, image, active })),
      images: (product.images || []).sort((a, b) => a.position - b.position).map(({ url, alt, position }) => ({ url, alt, position })),
    };
  }
}
