import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// Hash scrypt chuẩn tương thích với backend TrendyEye cho mật khẩu '12345678'
const ADMIN_PASSWORD_HASH =
  "scrypt$m0rbSlfdw7OY-tNcOqCVvg$4B0m7LyQ7iAEWyTidw-WxvxG-rBk-sSOfg6ogSd621yG394tY4Fhi7VHd1-jNz7jvPjfhOsJBfzY6lY-Xi9ieg";

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu Prisma cho TrendyEye...");

  // 1. Tạo tài khoản Admin admintrendy
  const admin = await prisma.user.upsert({
    where: { email: "admintrendy" },
    update: {
      fullName: "Admin Trendy",
      role: UserRole.ADMIN,
      passwordHash: ADMIN_PASSWORD_HASH,
      active: true,
    },
    create: {
      email: "admintrendy",
      fullName: "Admin Trendy",
      passwordHash: ADMIN_PASSWORD_HASH,
      role: UserRole.ADMIN,
      active: true,
    },
  });
  console.log(`✓ Tài khoản Admin: ${admin.email} (vai trò: ${admin.role})`);

  // 2. Tạo các danh mục mẫu (Cha - Con)
  const categoriesData = [
    {
      id: "kinh-can",
      title: "Kính cận",
      label: "Kính cận",
      parentId: null,
      sortOrder: 1,
      children: [
        { id: "kinh-can-doi-mau", title: "Kính cận đổi màu", label: "Kính cận đổi màu", sortOrder: 1 },
      ],
    },
    {
      id: "kinh-ram",
      title: "Kính râm",
      label: "Kính râm",
      parentId: null,
      sortOrder: 2,
      children: [
        { id: "kinh-ram-thoi-trang", title: "Kính râm thời trang", label: "Kính râm thời trang", sortOrder: 1 },
      ],
    },
    {
      id: "gong-kinh",
      title: "Gọng kính",
      label: "Gọng kính",
      parentId: null,
      sortOrder: 3,
      children: [
        { id: "gong-kim-loai", title: "Gọng kim loại", label: "Gọng kim loại", sortOrder: 1 },
      ],
    },
  ];

  for (const group of categoriesData) {
    await prisma.productCategory.upsert({
      where: { id: group.id },
      update: { title: group.title, label: group.label, parentId: null, sortOrder: group.sortOrder, active: true },
      create: { id: group.id, title: group.title, label: group.label, parentId: null, sortOrder: group.sortOrder, active: true },
    });

    for (const child of group.children) {
      await prisma.productCategory.upsert({
        where: { id: child.id },
        update: { title: child.title, label: child.label, parentId: group.id, sortOrder: child.sortOrder, active: true },
        create: { id: child.id, title: child.title, label: child.label, parentId: group.id, sortOrder: child.sortOrder, active: true },
      });
    }
  }
  console.log("✓ Danh mục sản phẩm đã được seed (Kính cận, Kính râm, Gọng kính)");

  // 3. Mỗi danh mục tạo 1 sản phẩm mẫu
  const productsData = [
    {
      code: "PRD-MILAN-01",
      slug: "kinh-can-gentle-monster-milan",
      name: "Kính Cận Gentle Monster Milan",
      sku: "GM-MILAN-01",
      price: 6800000,
      description: "Gọng kính cận Gentle Monster Milan dáng tròn thanh lịch, chất liệu acetate cao cấp tôn nét tinh tế.",
      image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1200&q=80",
      categories: ["kinh-can", "kinh-can-doi-mau"],
      variants: [
        { sku: "GM-MILAN-01-BLK", name: "Đen bóng", swatch: "#000000", price: 6800000, stockOnHand: 35 },
        { sku: "GM-MILAN-01-TOR", name: "Đồi mồi", swatch: "#451A03", price: 7100000, stockOnHand: 20 },
      ],
    },
    {
      code: "PRD-HER-01",
      slug: "kinh-ram-gentle-monster-her",
      name: "Kính Râm Gentle Monster Her",
      sku: "GM-HER-01",
      price: 7200000,
      description: "Mẫu kính râm oversize vuông cá tính, tròng kính chống tia UV400 bảo vệ mắt tối ưu.",
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
      categories: ["kinh-ram", "kinh-ram-thoi-trang"],
      variants: [
        { sku: "GM-HER-01-MATTE", name: "Đen nhám", swatch: "#1F2937", price: 7200000, stockOnHand: 50 },
        { sku: "GM-HER-01-GREY", name: "Xám khói", swatch: "#9CA3AF", price: 7500000, stockOnHand: 15 },
      ],
    },
    {
      code: "PRD-AIR-01",
      slug: "gong-kinh-lindberg-air",
      name: "Gọng Kính Titanium Lindberg Air",
      sku: "LB-AIR-01",
      price: 9500000,
      description: "Gọng kính siêu nhẹ chế tác từ Titanium nguyên khối không ốc vít, đẳng cấp thẩm mỹ tối giản.",
      image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&q=80",
      categories: ["gong-kinh", "gong-kim-loai"],
      variants: [
        { sku: "LB-AIR-01-GLD", name: "Vàng gold", swatch: "#D97706", price: 9500000, stockOnHand: 12 },
        { sku: "LB-AIR-01-SLV", name: "Xám chì", swatch: "#4B5563", price: 9500000, stockOnHand: 18 },
      ],
    },
  ];

  for (const item of productsData) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        code: item.code,
        slug: item.slug,
        name: item.name,
        price: item.price,
        description: item.description,
        image: item.image,
        active: true,
      },
      create: {
        code: item.code,
        slug: item.slug,
        name: item.name,
        sku: item.sku,
        price: item.price,
        description: item.description,
        image: item.image,
        active: true,
      },
    });

    // Liên kết danh mục
    for (const catId of item.categories) {
      await prisma.productCategoryLink.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: catId } },
        update: {},
        create: { productId: product.id, categoryId: catId },
      });
    }

    // Biến thể
    for (const v of item.variants) {
      await prisma.productVariant.upsert({
        where: { sku: v.sku },
        update: {
          name: v.name,
          swatch: v.swatch,
          price: v.price,
          stockOnHand: v.stockOnHand,
          active: true,
        },
        create: {
          productId: product.id,
          sku: v.sku,
          name: v.name,
          swatch: v.swatch,
          price: v.price,
          stockOnHand: v.stockOnHand,
          active: true,
        },
      });
    }

    // Ảnh sản phẩm
    const existingImg = await prisma.productImage.findFirst({ where: { productId: product.id, position: 0 } });
    if (!existingImg) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: item.image,
          alt: item.name,
          position: 0,
        },
      });
    }
  }

  console.log("✓ Mỗi danh mục đã được seed 1 sản phẩm kèm biến thể và tồn kho");
  console.log("🎉 Hoàn tất seed dữ liệu thành công!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi seed Prisma:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
