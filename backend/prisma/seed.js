const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("node:crypto");

const prisma = new PrismaClient();

function getAdminPasswordHash(password) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

async function main() {
  console.log("🌱 Bắt đầu kiểm tra và cập nhật database TrendyEye...");

  try {
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "RefreshSession" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "Product" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "ProductVariant" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "ProductImage" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "CustomerOrder" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "OrderItem" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "OrderStatusHistory" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "OrderTransaction" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "Promotion" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "Conversation" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "ChatMessage" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "OutboxEvent" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
        ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT now();
        ALTER TABLE "Product" ALTER COLUMN "updatedAt" SET DEFAULT now();
        ALTER TABLE "CustomerOrder" ALTER COLUMN "updatedAt" SET DEFAULT now();
        ALTER TABLE "Promotion" ALTER COLUMN "updatedAt" SET DEFAULT now();
        ALTER TABLE "Conversation" ALTER COLUMN "updatedAt" SET DEFAULT now();
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END $$;
    `);
    console.log("✓ Đã đảm bảo giá trị mặc định cho các cột ID và updatedAt.");
  } catch (err) {
    console.warn("Lưu ý cấu hình cột:", err.message);
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admintrendy";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "11111111";
  const adminPasswordHash = getAdminPasswordHash(adminPassword);

  // 1. Tài khoản Admin từ biến môi trường
  const existingAdmin = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: {
        fullName: "Admin Trendy",
        role: "ADMIN",
        passwordHash: adminPasswordHash,
        active: true,
      },
    });
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        fullName: "Admin Trendy",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        active: true,
      },
    });
  }
  console.log(`✓ Tài khoản Admin: ${adminEmail}`);

  // 2. Định nghĩa 2 danh mục cha và các danh mục con
  const categoriesData = [
    {
      id: "kinh-can",
      title: "Kính cận",
      label: "Kính cận",
      parentId: null,
      sortOrder: 1,
      children: [
        { id: "kinh-can-doi-mau", title: "Kính cận đổi màu", label: "Kính cận đổi màu", sortOrder: 1 },
        { id: "kinh-lao-doi-mau", title: "Kính lão đổi màu", label: "Kính lão đổi màu", sortOrder: 2 },
        { id: "kinh-lao-nhua-deo", title: "Kính lão full nhựa dẻo", label: "Kính lão full nhựa dẻo", sortOrder: 3 },
        { id: "gong-nhua-deo", title: "Gọng nhựa (dẻo)", label: "Gọng nhựa (dẻo)", sortOrder: 4 },
      ],
    },
    {
      id: "kinh-thoi-trang",
      title: "Kính thời trang",
      label: "Kính thời trang",
      parentId: null,
      sortOrder: 2,
      children: [
        { id: "kinh-mat-thoi-trang", title: "Kính mắt thời trang", label: "Kính mắt thời trang", sortOrder: 1 },
        { id: "kinh-phan-cuc", title: "Kính phân cực chống chói", label: "Kính phân cực chống chói", sortOrder: 2 },
        { id: "doi-mau-khong-can", title: "Kính đổi màu không cận", label: "Kính đổi màu không cận", sortOrder: 3 },
        { id: "kinh-f1", title: "Kính chống bụi F1", label: "Kính chống bụi F1", sortOrder: 4 },
      ],
    },
  ];

  const allowedIds = [
    "kinh-can",
    "kinh-can-doi-mau",
    "kinh-lao-doi-mau",
    "kinh-lao-nhua-deo",
    "gong-nhua-deo",
    "kinh-thoi-trang",
    "kinh-mat-thoi-trang",
    "kinh-phan-cuc",
    "doi-mau-khong-can",
    "kinh-f1",
  ];

  // Xóa các danh mục không thuộc 2 nhóm trên (như kinh-ram, gong-kinh...)
  console.log("🧹 Dọn dẹp danh mục không thuộc Kính cận & Kính thời trang...");
  // Xóa danh mục con ngoài danh sách trước
  await prisma.productCategory.deleteMany({
    where: {
      parentId: { not: null },
      id: { notIn: allowedIds },
    },
  });
  // Xóa danh mục cha ngoài danh sách
  await prisma.productCategory.deleteMany({
    where: {
      id: { notIn: allowedIds },
    },
  });
  console.log("✓ Đã dọn dẹp danh mục cũ.");

  // Tạo / cập nhật 2 danh mục cha và các con
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
  console.log("✓ Đã thiết lập 2 danh mục cha: Kính cận & Kính thời trang cùng các danh mục con.");

  // 3. 10 sản phẩm Gentle Monster cao cấp
  const existingProductsCount = await prisma.product.count();
  if (existingProductsCount > 0 && process.env.FORCE_SEED !== "true") {
    console.log(`ℹ️ Đã tồn tại ${existingProductsCount} sản phẩm trong database, bỏ qua bước seed lại sản phẩm để bảo vệ toàn vẹn dữ liệu tồn kho.`);
  } else {
    console.log("🧹 Khởi tạo 10 sản phẩm mẫu Gentle Monster...");
    await prisma.productCategoryLink.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.product.deleteMany({});

    const productsData = [
    // 5 Sản phẩm Kính cận
    {
      code: "PRD-GM-MILAN",
      slug: "gentle-monster-milan",
      name: "Gentle Monster Milan",
      sku: "GM-MILAN-01",
      price: 6800000,
      description:
        "Gentle Monster Milan mang dáng kính tròn thanh lịch và vượt thời gian, là biểu tượng trí thức của thương hiệu.\nĐược chế tác thủ công từ chất liệu acetate nguyên khối cao cấp với độ bóng hoàn hảo và bản lề kim loại chống gỉ sét bền bỉ.\nĐệm mũi êm ái cùng cấu trúc ôm sát thái dương giúp tạo sự thoải mái tối đa khi sử dụng suốt cả ngày dài.\nMặt kính cắt tinh xảo phù hợp lắp tròng cận, viễn hoặc tròng đổi màu chống tia cực tím hiện đại.\nSản phẩm là lựa chọn hoàn hảo tôn lên vẻ thanh thoát, sang trọng cho cả nam và nữ trong mọi hoàn cảnh.",
      image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1200&h=1200&q=80",
      front: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1200&h=1200&q=80",
      categories: ["kinh-can", "kinh-can-doi-mau"],
      specifications: {
        frameMaterial: "Acetate cao cấp",
        lensMaterial: "Tròng demo quang học chống lóa",
        lensType: "Kính cận / Tròng đổi màu UV400",
        customDetails: [
          "Kính cận dáng tròn thanh lịch bằng acetate đen bóng",
          "Bộ sưu tập kính mắt 2026",
          "Chất liệu gọng: Nhựa acetate cao cấp nguyên khối",
          "Tròng kính: Tròng quang học chống ánh sáng xanh",
          "Dáng kính: Dáng tròn cổ điển thanh thoát",
          "Khả năng bảo vệ: Ngăn chặn 99.9% tia UV",
          "Nhà sản xuất & nhập khẩu: IICOMBINED CO., LTD.",
          "Xuất xứ: Hàn Quốc",
        ],
      },
      variants: [
        { sku: "GM-MILAN-01-DEN-KHON", name: "Đen bóng (01) / Không cận", swatch: "#000000", price: 6800000, stockOnHand: 25 },
        { sku: "GM-MILAN-01-DEN-1-0", name: "Đen bóng (01) / 1.0", swatch: "#000000", price: 6800000, stockOnHand: 15 },
        { sku: "GM-MILAN-01-DEN-1-5", name: "Đen bóng (01) / 1.5", swatch: "#000000", price: 6800000, stockOnHand: 15 },
        { sku: "GM-MILAN-01-DOI-KHON", name: "Đồi mồi (B4) / Không cận", swatch: "#451A03", price: 7100000, stockOnHand: 20 },
        { sku: "GM-MILAN-01-DOI-1-0", name: "Đồi mồi (B4) / 1.0", swatch: "#451A03", price: 7100000, stockOnHand: 12 },
        { sku: "GM-MILAN-01-DOI-1-5", name: "Đồi mồi (B4) / 1.5", swatch: "#451A03", price: 7100000, stockOnHand: 10 },
      ],
    },
    {
      code: "PRD-GM-SOUTHSIDE",
      slug: "gentle-monster-south-side-n",
      name: "Gentle Monster South Side N",
      sku: "GM-SOUTHSIDE-01",
      price: 6900000,
      description:
        "South Side N là phiên bản nâng cấp của thiết kế vuông bo góc kinh điển đã làm nên tên tuổi Gentle Monster.\nGây ấn tượng bởi điểm nhấn hai đinh tán kim loại chữ T biểu tượng tinh xảo ở góc mắt và đầu càng kính.\nChất liệu acetate đúc nguyên bản có độ đàn hồi và trọng lượng nhẹ giúp tối ưu trải nghiệm đeo thường nhật.\nCàng kính được khắc họa tiết kim loại chìm tinh xảo thể hiện đẳng cấp gia công thủ công chuẩn xác.\nMẫu gọng kính đa dụng, phù hợp mọi phong cách từ thời trang đường phố cá tính đến văn phòng lịch lãm.",
      image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&h=1200&q=80",
      front: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=1200&h=1200&q=80",
      categories: ["kinh-can", "gong-nhua-deo"],
      specifications: {
        frameMaterial: "Acetate dẻo cao cấp",
        lensMaterial: "Tròng quang học phân cực",
        lensType: "Chống ánh sáng xanh & UV400",
        customDetails: [
          "Kính cận vuông bo góc đinh tán kim loại chữ T",
          "Bộ sưu tập kính mắt 2026",
          "Chất liệu gọng: Nhựa acetate đúc nguyên bản",
          "Tròng kính: Tròng quang học phủ lớp chống phản quang",
          "Dáng kính: Dáng vuông bo góc Wellington kinh điển",
          "Khả năng bảo vệ: Ngăn chặn 99.9% tia UV",
          "Nhà sản xuất & nhập khẩu: IICOMBINED CO., LTD.",
          "Xuất xứ: Hàn Quốc",
        ],
      },
      variants: [
        { sku: "GM-SOUTHSIDE-01-DEN-KHON", name: "Đen tuyền / Không cận", swatch: "#111827", price: 6900000, stockOnHand: 30 },
        { sku: "GM-SOUTHSIDE-01-DEN-1-0", name: "Đen tuyền / 1.0", swatch: "#111827", price: 6900000, stockOnHand: 18 },
        { sku: "GM-SOUTHSIDE-01-DEN-1-5", name: "Đen tuyền / 1.5", swatch: "#111827", price: 6900000, stockOnHand: 14 },
        { sku: "GM-SOUTHSIDE-01-CLR-KHON", name: "Trong suốt (C1) / Không cận", swatch: "#F3F4F6", price: 7200000, stockOnHand: 20 },
        { sku: "GM-SOUTHSIDE-01-CLR-1-0", name: "Trong suốt (C1) / 1.0", swatch: "#F3F4F6", price: 7200000, stockOnHand: 15 },
      ],
    },
    {
      code: "PRD-GM-KUBO",
      slug: "gentle-monster-kubo",
      name: "Gentle Monster Kubo",
      sku: "GM-KUBO-01",
      price: 7200000,
      description:
        "Gentle Monster Kubo sở hữu đường nét vuông vức mạnh mẽ, tôn vinh phong thái chững chạc và bản lĩnh hiện đại.\nPhần viền kính được vát cạnh sắc nét kết hợp cùng cốt kim loại gia cố chạy dọc thân càng kính siêu bền.\nBản lề 5 chấu linh hoạt mở rộng góc độ tự nhiên giúp ôm khít khuôn mặt mà không gây áp lực lên sống mũi.\nTương thích hoàn hảo với mọi độ khúc xạ từ kính cận, kính viễn đến các dòng tròng đổi màu công nghệ cao.\nSản phẩm là điểm nhấn phong cách không thể thiếu cho những ai theo đuổi vẻ ngoài lịch lãm và đĩnh đạc.",
      image: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1200&h=1200&q=80",
      front: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=1200&h=1200&q=80",
      categories: ["kinh-can", "kinh-lao-doi-mau"],
      specifications: {
        frameMaterial: "Acetate cao cấp & lõi titan",
        lensMaterial: "Tròng quang học cao cấp",
        lensType: "Kính cận lão & đổi màu UV",
        customDetails: [
          "Kính cận viền vuông đậm nét acetate nguyên khối",
          "Bộ sưu tập kính mắt 2026",
          "Chất liệu gọng: Nhựa acetate bóng phối lõi kim loại",
          "Tròng kính: Tròng quang học cao cấp phủ đa tầng",
          "Dáng kính: Dáng vuông cá tính hiện đại",
          "Khả năng bảo vệ: Ngăn chặn 99.9% tia UV",
          "Nhà sản xuất & nhập khẩu: IICOMBINED CO., LTD.",
          "Xuất xứ: Hàn Quốc",
        ],
      },
      variants: [
        { sku: "GM-KUBO-01-DEN-KHON", name: "Đen bóng (01) / Không cận", swatch: "#000000", price: 7200000, stockOnHand: 25 },
        { sku: "GM-KUBO-01-DEN-1-0", name: "Đen bóng (01) / 1.0", swatch: "#000000", price: 7200000, stockOnHand: 16 },
        { sku: "GM-KUBO-01-GRY-KHON", name: "Xám khói trong (KC1) / Không cận", swatch: "#6B7280", price: 7400000, stockOnHand: 20 },
        { sku: "GM-KUBO-01-GRY-1-0", name: "Xám khói trong (KC1) / 1.0", swatch: "#6B7280", price: 7400000, stockOnHand: 12 },
      ],
    },
    {
      code: "PRD-GM-JEFF",
      slug: "gentle-monster-jeff",
      name: "Gentle Monster Jeff",
      sku: "GM-JEFF-01",
      price: 7500000,
      description:
        "Jeff định hình phong cách thời trang dẫn đầu xu hướng với form kính phi công oversized bản rộng đột phá.\nCầu kính đôi phối hợp nhịp nhàng giữa acetate trong suốt và thanh kim loại mạ titanium sáng bóng thời thượng.\nTrọng lượng phân bổ đều trên toàn bộ khung kính, tạo độ cân bằng hoàn hảo và sự thoáng nhẹ khi đeo lâu.\nChi tiết logo Gentle Monster khắc laser tinh xảo bên trong càng kính mang đậm dấu ấn chế tác xa xỉ.\nMẫu kính lý tưởng cho những tín đồ thời trang mong muốn khẳng định cá tính độc bản và gu thẩm mỹ khác biệt.",
      image: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&h=1200&q=80",
      front: "https://images.unsplash.com/photo-1577803645773-f96470509666?auto=format&fit=crop&w=1200&h=1200&q=80",
      categories: ["kinh-can", "kinh-lao-nhua-deo"],
      specifications: {
        frameMaterial: "Acetate dẻo kết hợp Titanium",
        lensMaterial: "Tròng chống lóa đa lớp",
        lensType: "Kính cận Oversized & thời trang",
        customDetails: [
          "Kính cận dáng phi công oversized cầu đôi độc đáo",
          "Bộ sưu tập kính mắt 2026",
          "Chất liệu gọng: Phối hợp titanium và acetate dẻo",
          "Tròng kính: Tròng quang học cao cấp chống lóa",
          "Dáng kính: Dáng phi công bản rộng oversized",
          "Khả năng bảo vệ: Ngăn chặn 99.9% tia UV",
          "Nhà sản xuất & nhập khẩu: IICOMBINED CO., LTD.",
          "Xuất xứ: Hàn Quốc",
        ],
      },
      variants: [
        { sku: "GM-JEFF-01-DEN-KHON", name: "Đen phối bạc (01) / Không cận", swatch: "#0F172A", price: 7500000, stockOnHand: 20 },
        { sku: "GM-JEFF-01-DEN-1-0", name: "Đen phối bạc (01) / 1.0", swatch: "#0F172A", price: 7500000, stockOnHand: 14 },
        { sku: "GM-JEFF-01-AMB-KHON", name: "Hổ phách (B4) / Không cận", swatch: "#78350F", price: 7800000, stockOnHand: 15 },
        { sku: "GM-JEFF-01-AMB-1-0", name: "Hổ phách (B4) / 1.0", swatch: "#78350F", price: 7800000, stockOnHand: 10 },
      ],
    },
    {
      code: "PRD-GM-ALIO",
      slug: "gentle-monster-alio-x",
      name: "Gentle Monster Alio X",
      sku: "GM-ALIO-01",
      price: 8200000,
      description:
        "Alio X là kiệt tác kính cận nửa viền Browline hòa quyện hoàn mỹ giữa hơi thở cổ điển và nét tân thời.\nKhung viền trên bằng acetate tuyển chọn gắn kết liền mạch với nửa dưới viền kim loại titanium siêu thanh mảnh.\nVe mũi silicone cao cấp có thể điều chỉnh linh hoạt, chống trơn trượt hiệu quả và không để lại vết hằn trên da.\nĐược gia công với độ chính xác cơ khí đỉnh cao nhằm đảm bảo sự cân đối tuyệt đối giữa vẻ đẹp và độ bền.\nSản phẩm tôn vinh khí chất lịch lãm, trí tuệ và đẳng cấp sang trọng của các quý ông và quý cô thời hiện đại.",
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&h=1200&q=80",
      front: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&h=1200&q=80",
      categories: ["kinh-can", "kinh-can-doi-mau"],
      specifications: {
        frameMaterial: "Titanium & Acetate cao cấp",
        lensMaterial: "Tròng quang học cao cấp",
        lensType: "Nửa viền Browline đổi màu",
        customDetails: [
          "Kính cận nửa viền Browline titanium cao cấp",
          "Bộ sưu tập kính mắt 2026",
          "Chất liệu gọng: Titanium siêu nhẹ kết hợp viền acetate",
          "Tròng kính: Tròng quang học cao cấp đổi màu",
          "Dáng kính: Nửa viền Browline lịch lãm",
          "Khả năng bảo vệ: Ngăn chặn 99.9% tia UV",
          "Nhà sản xuất & nhập khẩu: IICOMBINED CO., LTD.",
          "Xuất xứ: Hàn Quốc",
        ],
      },
      variants: [
        { sku: "GM-ALIO-01-BLK-KHON", name: "Đen viền vàng gold / Không cận", swatch: "#1C1917", price: 8200000, stockOnHand: 22 },
        { sku: "GM-ALIO-01-BLK-1-0", name: "Đen viền vàng gold / 1.0", swatch: "#1C1917", price: 8200000, stockOnHand: 16 },
        { sku: "GM-ALIO-01-SLV-KHON", name: "Đen viền bạc titanium / Không cận", swatch: "#374151", price: 8200000, stockOnHand: 18 },
        { sku: "GM-ALIO-01-SLV-1-0", name: "Đen viền bạc titanium / 1.0", swatch: "#374151", price: 8200000, stockOnHand: 14 },
      ],
    },

    // 5 Sản phẩm Kính thời trang
    {
      code: "PRD-GM-HER",
      slug: "gentle-monster-her",
      name: "Gentle Monster Her",
      sku: "GM-HER-01",
      price: 7200000,
      description:
        "Gentle Monster Her là mẫu kính râm vuông oversize thần thái bậc nhất, luôn đứng đầu danh sách được yêu thích.\nMặt kính phẳng đặc trưng kết hợp cùng tròng kính Zeiss trứ danh của Đức ngăn chặn tuyệt đối tia tử ngoại.\nThiết kế bản gọng rộng cá tính với các đường cắt góc dứt khoát tạo hiệu ứng thon gọn gương mặt diệu kỳ.\nĐiểm xuyết logo ba chấm kim loại ở hai bên gọng tạo dấu ấn nhận diện thương hiệu tinh tế và kín đáo.\nPhụ kiện hoàn hảo nâng tầm mọi bộ trang phục, từ phong cách tối giản thường nhật đến sự kiện thời trang cao cấp.",
      image: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=1200&h=1200&q=80",
      front: "https://images.unsplash.com/photo-1509695507497-903c140c43b0?auto=format&fit=crop&w=1200&h=1200&q=80",
      categories: ["kinh-thoi-trang", "kinh-mat-thoi-trang"],
      specifications: {
        frameMaterial: "Acetate cao cấp đen bóng",
        lensMaterial: "Tròng phẳng Zeiss của Đức",
        lensType: "Chống tia UV400 & phân cực",
        customDetails: [
          "Kính râm dáng vuông oversized tròng phẳng Zeiss",
          "Bộ sưu tập kính thời trang 2026",
          "Chất liệu gọng: Nhựa acetate đen bóng cao cấp",
          "Tròng kính: Tròng phẳng Zeiss màu xám phân cực",
          "Dáng kính: Dáng vuông bản to oversized",
          "Khả năng bảo vệ: Ngăn chặn 99.9% tia UV",
          "Nhà sản xuất & nhập khẩu: IICOMBINED CO., LTD.",
          "Xuất xứ: Hàn Quốc",
        ],
      },
      variants: [
        { sku: "GM-HER-01-BLK", name: "Đen bóng (01)", swatch: "#000000", price: 7200000, stockOnHand: 50 },
        { sku: "GM-HER-01-BRW", name: "Nâu trà chuyển sắc", swatch: "#78350F", price: 7500000, stockOnHand: 25 },
      ],
    },
    {
      code: "PRD-GM-LANG",
      slug: "gentle-monster-lang",
      name: "Gentle Monster Lang",
      sku: "GM-LANG-01",
      price: 6800000,
      description:
        "Gentle Monster Lang cuốn hút bởi dáng tròn cong mềm mại, mang phong vị cổ điển kết hợp tinh thần tương lai.\nTròng kính phân cực cao cấp giúp lọc sạch các tia chói từ mặt đường, mặt nước, đem lại tầm nhìn sắc nét và dịu mát.\nKhung kính nhẹ nhàng ôm gọn gương mặt, thích hợp cho việc di chuyển đường dài hay các chuyến du lịch biển.\nHai đinh tán kim loại hình tròn tinh tế tại góc mắt tạo điểm nhấn thị giác duyên dáng và thanh lịch.\nLà sự hòa quyện tuyệt vời giữa công năng bảo vệ mắt tối ưu và ngôn ngữ thời trang phóng khoáng bất tận.",
      image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&h=1200&q=80",
      front: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&h=1200&q=80",
      categories: ["kinh-thoi-trang", "kinh-phan-cuc"],
      specifications: {
        frameMaterial: "Acetate uốn cong cao cấp",
        lensMaterial: "Tròng phân cực Polarized",
        lensType: "Chống lóa phân cực & chống UV400",
        customDetails: [
          "Kính mát dáng tròn viền cong phân cực chống chói",
          "Bộ sưu tập kính thời trang 2026",
          "Chất liệu gọng: Nhựa acetate bóng siêu nhẹ",
          "Tròng kính: Tròng phân cực chống chói và chống lóa",
          "Dáng kính: Dáng tròn bo viền mềm mại",
          "Khả năng bảo vệ: Ngăn chặn 99.9% tia UV",
          "Nhà sản xuất & nhập khẩu: IICOMBINED CO., LTD.",
          "Xuất xứ: Hàn Quốc",
        ],
      },
      variants: [
        { sku: "GM-LANG-01-BLK", name: "Đen tuyền (01)", swatch: "#18181B", price: 6800000, stockOnHand: 38 },
        { sku: "GM-LANG-01-BLU", name: "Tròng xanh biển thời thượng", swatch: "#0284C7", price: 7100000, stockOnHand: 22 },
      ],
    },
    {
      code: "PRD-GM-TAMBU",
      slug: "gentle-monster-tambu",
      name: "Gentle Monster Tambu",
      sku: "GM-TAMBU-01",
      price: 7900000,
      description:
        "Tambu là tuyên ngôn thời trang táo bạo với dáng mắt mèo phá cách được các ngôi sao quốc tế săn đón nồng nhiệt.\nGọng kính dày dặn với các đường vát khối 3D sống động tạo nên diện mạo ấn tượng và đầy quyền lực.\nTròng kính chống tia UV với sắc độ chuyển tiếp mượt mà bảo vệ mắt trong mọi điều kiện ánh sáng tự nhiên.\nCàng kính bản to khắc chìm tên thương hiệu Gentle Monster mạ bạc sang trọng ở vị trí tiếp nối bản lề.\nSự lựa chọn hoàn hảo dành cho những cá tính thời trang tiên phong muốn bứt phá mọi giới hạn quy chuẩn.",
      image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&h=1200&q=80",
      front: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=1200&h=1200&q=80",
      categories: ["kinh-thoi-trang", "doi-mau-khong-can"],
      specifications: {
        frameMaterial: "Acetate điêu khắc 3D",
        lensMaterial: "Tròng quang học chống tia UV",
        lensType: "Mắt mèo thời trang đổi màu",
        customDetails: [
          "Kính mát mắt mèo thời thượng gọng đúc 3D",
          "Bộ sưu tập kính thời trang 2026",
          "Chất liệu gọng: Nhựa acetate điêu khắc khối 3D",
          "Tròng kính: Tròng quang học đổi màu chống lóa",
          "Dáng kính: Dáng mắt mèo sắc sảo phá cách",
          "Khả năng bảo vệ: Ngăn chặn 99.9% tia UV",
          "Nhà sản xuất & nhập khẩu: IICOMBINED CO., LTD.",
          "Xuất xứ: Hàn Quốc",
        ],
      },
      variants: [
        { sku: "GM-TAMBU-01-BLK", name: "Đen bóng (01)", swatch: "#000000", price: 7900000, stockOnHand: 30 },
        { sku: "GM-TAMBU-01-WHT", name: "Trắng sữa (W1)", swatch: "#FAFAFA", price: 8200000, stockOnHand: 18 },
      ],
    },
    {
      code: "PRD-GM-LILIT",
      slug: "gentle-monster-lilit",
      name: "Gentle Monster Lilit",
      sku: "GM-LILIT-01",
      price: 7400000,
      description:
        "Gentle Monster Lilit đại diện cho trường phái tối giản với form dáng vuông phẳng nguyên khối hiện đại.\nĐược gọt giũa tỉ mỉ từng góc cạnh, mang đến cảm giác liền mạch không tì vết từ mặt trước ra đến đuôi càng kính.\nTròng kính phân cực cao cấp ngăn chặn hiệu quả ánh sáng độc hại, bảo vệ mắt tuyệt đối dưới ánh nắng gay gắt.\nCác chi tiết chốt kim loại được đúc chìm khéo léo đảm bảo độ bền cơ học vượt trội qua nhiều năm sử dụng.\nMẫu kính unisex đa năng, mang lại thần thái tự tin, sang trọng và cuốn hút cho chủ nhân trong mọi góc nhìn.",
      image: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1200&h=1200&q=80",
      front: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?auto=format&fit=crop&w=1200&h=1200&q=80",
      categories: ["kinh-thoi-trang", "kinh-f1"],
      specifications: {
        frameMaterial: "Acetate nguyên khối chống trầy",
        lensMaterial: "Tròng phẳng Polarized",
        lensType: "Chống bụi & chống tia cực tím F1",
        customDetails: [
          "Kính mát vuông phẳng tối giản nguyên khối",
          "Bộ sưu tập kính thời trang 2026",
          "Chất liệu gọng: Nhựa acetate đen nguyên khối chống trầy",
          "Tròng kính: Tròng phẳng phân cực màu khói cao cấp",
          "Dáng kính: Dáng vuông phẳng hiện đại",
          "Khả năng bảo vệ: Ngăn chặn 99.9% tia UV",
          "Nhà sản xuất & nhập khẩu: IICOMBINED CO., LTD.",
          "Xuất xứ: Hàn Quốc",
        ],
      },
      variants: [
        { sku: "GM-LILIT-01-BLK", name: "Đen bóng (01)", swatch: "#09090B", price: 7400000, stockOnHand: 40 },
        { sku: "GM-LILIT-01-BRN", name: "Hổ phách tròng nâu trà", swatch: "#B45309", price: 7700000, stockOnHand: 22 },
      ],
    },
    {
      code: "PRD-GM-ROCOCO",
      slug: "gentle-monster-rococo",
      name: "Gentle Monster Rococo",
      sku: "GM-ROCOCO-01",
      price: 8500000,
      description:
        "Rococo chinh phục mọi ánh nhìn với dáng oval thuôn dài lấy cảm hứng từ phong trào Y2K và nghệ thuật vị lai.\nKhung kính acetate vát cong đa chiều mềm mại tạo cảm giác bay bổng nhưng vô cùng chắc chắn và ôm sát gương mặt.\nTròng kính Zeiss cao cấp màu xám khói lọc trọn vẹn 99.9% tia tử ngoại, giữ cho đôi mắt luôn dịu mát và thư thái.\nLogo biểu tượng kim loại sáng bóng trên càng kính tạo điểm nhấn nổi bật trên nền acetate bóng bẩy.\nLà phụ kiện đắt giá nâng tầm phong cách sành điệu, dành riêng cho những tín đồ thời trang dẫn đầu xu thế.",
      image: "https://images.unsplash.com/photo-1582142407894-ec85a1260a46?auto=format&fit=crop&w=1200&h=1200&q=80",
      front: "https://images.unsplash.com/photo-1582142407894-ec85a1260a46?auto=format&fit=crop&w=1200&h=1200&q=80",
      categories: ["kinh-thoi-trang", "kinh-mat-thoi-trang"],
      specifications: {
        frameMaterial: "Nhựa acetate đen bóng",
        lensMaterial: "Tròng kính Zeiss màu xám UV400",
        lensType: "Dáng kính phi công oval",
        customDetails: [
          "Kính mát phi công oval chất liệu acetate đen cao cấp",
          "Bộ sưu tập kính thời trang 2026",
          "Chất liệu gọng: Nhựa acetate đen nguyên khối",
          "Tròng kính: Tròng kính màu xám khói Zeiss UV400",
          "Dáng kính: Dáng oval vát cong thuôn dài",
          "Khả năng bảo vệ: Ngăn chặn 99.9% tia UV",
          "Nhà sản xuất & nhập khẩu: IICOMBINED CO., LTD.",
          "Xuất xứ: Hàn Quốc",
        ],
      },
      variants: [
        { sku: "GM-ROCOCO-01-XAM-KHON", name: "Xám khói mờ / Không cận", swatch: "#4B5563", price: 8500000, stockOnHand: 25 },
        { sku: "GM-ROCOCO-01-XAM-1-0", name: "Xám khói mờ / 1.0", swatch: "#4B5563", price: 8500000, stockOnHand: 15 },
        { sku: "GM-ROCOCO-01-XAM-1-5", name: "Xám khói mờ / 1.5", swatch: "#4B5563", price: 8500000, stockOnHand: 15 },
        { sku: "GM-ROCOCO-01-DEN-KHON", name: "Đen bóng (01) / Không cận", swatch: "#000000", price: 8500000, stockOnHand: 25 },
        { sku: "GM-ROCOCO-01-DEN-1-0", name: "Đen bóng (01) / 1.0", swatch: "#000000", price: 8500000, stockOnHand: 15 },
        { sku: "GM-ROCOCO-01-DEN-1-5", name: "Đen bóng (01) / 1.5", swatch: "#000000", price: 8500000, stockOnHand: 15 },
      ],
    },
  ];

  for (const item of productsData) {
    const product = await prisma.product.create({
      data: {
        code: item.code,
        slug: item.slug,
        name: item.name,
        sku: item.sku,
        price: item.price,
        description: item.description,
        specifications: item.specifications,
        image: item.image,
        front: item.front,
        active: true,
      },
    });

    // Liên kết danh mục (cả cha lẫn con)
    for (const catId of item.categories) {
      await prisma.productCategoryLink.create({
        data: { productId: product.id, categoryId: catId },
      });
    }

    // Biến thể
    for (const v of item.variants) {
      await prisma.productVariant.create({
        data: {
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
    await prisma.productImage.create({
      data: {
        productId: product.id,
        url: item.image,
        alt: item.name,
        position: 0,
      },
    });
  }

    console.log(`✓ Đã tạo thành công ${productsData.length} sản phẩm Gentle Monster kèm biến thể và danh mục.`);
  }
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
