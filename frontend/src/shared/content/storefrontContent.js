const CDN = "https://gm-prd-resource.gentlemonster.com";

const collectionStoryImage = (u) => `${CDN}/assets/stories/2026-collection/${u}`;
const margielaStoryImage = (u) => `https://web-resource.gentlemonster.com/assets/stories/margiela/img/collection/${u}?ver=2.2`;

export const stories = [
  {
    slug: "chat-lieu-sac-mau",
    title: "Chất liệu và sắc màu",
    layout: "materials",
    cardImage: collectionStoryImage("img_campaign_01-pc.jpg"),
    hero: collectionStoryImage("img_campaign_01-pc.jpg"),
    gallery: [1, 2, 3, 4, 5].map((u) => collectionStoryImage(`img_campaign_${String(u).padStart(2, "0")}-pc.jpg`)),
    intro: "Kim loại bắt sáng tinh tế, acetate giữ lại chiều sâu của màu sắc. Chất liệu là điểm chạm đầu tiên tạo nên cảm xúc của một thiết kế.",
    sections: [
      { title: "Ánh sáng trên từng bề mặt", body: "Bề mặt kim loại phản chiếu ánh sáng thành những điểm nhấn thanh thoát. Gọng acetate lại tạo cảm giác đậm nét và giàu chiều sâu.", imageIndex: 1 },
      { title: "Sắc độ tạo nên cảm xúc", body: "Tròng kính trong, nâu hay xám đem đến những sắc thái khác nhau. Sự chuyển màu nhẹ nhàng có thể làm thay đổi cách bạn nhìn và được nhìn thấy.", imageIndex: 2 },
      { title: "Một điểm nhấn vừa đủ", body: "Khi chất liệu và màu sắc cân bằng, thiết kế trở nên nổi bật theo cách tự nhiên — tinh tế nhưng vẫn dễ dàng kết hợp mỗi ngày.", imageIndex: 3 },
    ],
    foot: "Chất liệu gặp gỡ sắc màu, tạo nên dấu ấn riêng.",
  },
  {
    slug: "nghe-thuat-che-tac",
    title: "Nghệ thuật chế tác",
    layout: "atelier",
    cardImage: margielaStoryImage("intro_img_pc.jpg"),
    hero: margielaStoryImage("intro_img_pc.jpg"),
    gallery: [1, 2, 3].map((u) => margielaStoryImage(`campaign_img_pc_${u}.jpg`)),
    intro: "Một thiết kế chỉ thật sự trọn vẹn khi đường nét, chất liệu và cảm giác khi đeo cùng hòa làm một.",
    sections: [
      { title: "Đường nét được cân nhắc", body: "Từ cầu kính đến càng kính, mỗi chi tiết góp phần tạo nên vẻ cân đối và cá tính. Không có đường nét nào đứng riêng lẻ.", imageIndex: 1 },
      { title: "Chạm vào chất liệu", body: "Độ bóng, sắc độ và cảm giác trên tay giúp hoàn thiện diện mạo của gọng kính — chỉn chu từ cái nhìn đầu tiên.", imageIndex: 2 },
      { title: "Thoải mái mỗi ngày", body: "Thiết kế đẹp cần đi cùng cảm giác vừa vặn. Một chiếc kính tốt sẽ trở thành người bạn đồng hành tự nhiên suốt ngày dài.", imageIndex: 3 },
    ],
    foot: "Chăm chút trong từng đường nét, vừa vặn trong từng khoảnh khắc.",
  },
];

export const homeHero = {
  title: "THIẾT KẾ MỚI",
  image: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1200&q=80",
  slides: [
    { video: "https://gm-prd-resource.gentlemonster.com/main/banner/844160776311460281/9b68ad1a-6e18-41e6-b18c-518ea111cc88/main_global_pc_1920*990.mp4", poster: "https://gm-prd-resource.gentlemonster.com/main/banner/844160776311460281/7096e70f-8026-4a87-b7c4-1207c0ce1375/main_global_pc_1920_990.jpg" },
    { video: "https://gm-prd-resource.gentlemonster.com/main/banner/798372671433820827/6fc4e780-c8ce-48bd-a8dd-3abff6ab7f8d/main_pc_1920*990.mp4", poster: "https://gm-prd-resource.gentlemonster.com/main/banner/798372671433820827/dce2ee4d-8824-4bd1-99f8-85e884166170/main_pc_1920*990.jpg" },
    { video: "https://gm-prd-resource.gentlemonster.com/main/banner/770800970997325499/acc3f823-6a91-4897-b629-3891b5632fe9/main_0_pc_1920*990.mp4", poster: "https://gm-prd-resource.gentlemonster.com/main/banner/770800970997325499/97311d97-035a-4002-95de-ba9eab0f8511/main_0_pc_3840_1980.jpg" },
    { video: "https://gm-prd-resource.gentlemonster.com/main/banner/745797614844190277/dc673826-17a9-4253-b4e5-d0f681db7017/main_0_pc_1920*990.mp4", poster: "https://gm-prd-resource.gentlemonster.com/main/banner/745797614844190277/849b4361-e36c-486c-a575-dc78871431f3/main_0_pc_3840*1980.jpg" },
  ],
  shopLabel: "MUA NGAY",
  storyLabel: "CÂU CHUYỆN",
  storySlug: "chat-lieu-sac-mau",
  category: "All",
};

export const homeSections = [
  {
    id: "new-arrivals",
    title: "MỚI NHẤT: THIẾT KẾ VỪA RA MẮT",
    display: "lookbook",
    action: "XEM THÊM",
    previewLabel: "XEM SẢN PHẨM",
  },
  {
    id: "top-this-week",
    title: "BÁN CHẠY NHẤT TUẦN NÀY",
    display: "cutout",
    action: "XEM THÊM",
  },
];

export const stores = [
  { city: "Hồ Chí Minh", country: "Việt Nam", name: "Trendy Nguyễn Gia Trí", address: "37 Nguyễn Gia Trí, Phường Thạnh Mỹ Tây, Hồ Chí Minh", hours: "Vui lòng liên hệ để biết giờ hoạt động", image: "/images/storefront-trendy.jpg" },
];

export const storefrontContent = {
  siteName: "TRENDY",
  pageTitles: {
    home: "TRANG CHỦ",
    store: { All: "CỬA HÀNG", Sunglasses: "KÍNH RÂM", Glasses: "KÍNH MẮT" },
    stores: "TÌM CỬA HÀNG",
    stories: "CÂU CHUYỆN",
    cart: "TÚI HÀNG",
    checkout: "THANH TOÁN",
    legal: "THÔNG TIN PHÁP LÝ",
    complete: "ĐẶT HÀNG THÀNH CÔNG",
    product: "SẢN PHẨM",
  },
  navigation: {
    items: [
      { label: "Cửa hàng", href: "/stores" },
      { label: "Câu chuyện", href: "/stories" },
    ],
    locale: "VIỆT NAM · TIẾNG VIỆT · VNĐ",
  },
  home: { wishlistLabel: "THÊM VÀO DANH SÁCH YÊU THÍCH" },
  stories: { allStories: "TẤT CẢ CÂU CHUYỆN", start: "Khám phá" },
  stores: {
    title: "CỬA HÀNG",
    filtersLabel: "Bộ lọc",
    countryLabel: "Quốc gia / Khu vực",
    cityLabel: "Thành phố",
    currentLocation: "Sử dụng vị trí hiện tại",
    resultLabel: "Cửa hàng phù hợp",
    directions: "Chỉ đường",
    openMap: "Mở bản đồ",
    noStores: "Không tìm thấy cửa hàng phù hợp.",
    locationError: "Không thể xác định vị trí. Hãy chọn quốc gia và thành phố.",
    locationUnsupported: "Trình duyệt không hỗ trợ vị trí hiện tại.",
    selectCountry: "Chọn quốc gia / khu vực",
    selectCity: "Chọn thành phố",
    mapLabel: "Bản đồ cửa hàng Trendy",
  },
  store: {
    filters: [
      { label: "Tất cả", type: "all" },
      { label: "Mẫu mới", type: "tag", value: "new-arrival" },
      { label: "Bán chạy", type: "tag", value: "bestseller" },
      { label: "Tròng màu", type: "tag", value: "tinted-lens" },
      { label: "Quà tặng", type: "tag", value: "gift" },
    ],
    categories: [
      { label: "Tất cả", value: "All" },
      { label: "Kính cận", value: "kinh-can" },
      { label: "Kính thời trang", value: "kinh-thoi-trang" },
    ],
    sortOptions: ["Nổi bật", "Giá thấp đến cao", "Giá cao đến thấp", "Tên sản phẩm"],
    title: {
      All: "TẤT CẢ SẢN PHẨM",
      "kinh-can": "KÍNH CẬN",
      "kinh-thoi-trang": "KÍNH THỜI TRANG",
    },
    description: {
      All: "Những thiết kế kính được chọn lọc cho phong cách riêng của bạn.",
      "kinh-can": "Thiết kế gọng kính cận được chọn lọc cho phong cách riêng của bạn.",
      "kinh-thoi-trang": "Những thiết kế kính thời trang với sắc độ đặc trưng.",
    },
  },
  product: {
    detailsTitle: "CHI TIẾT",
    sizingTitle: "KÍCH THƯỚC & ĐỘ VỪA",
    shippingTitle: "GIAO HÀNG & ĐỔI TRẢ",
    shippingDescription: "Miễn phí giao hàng. Đơn hàng được xử lý và gửi đi trong khoảng 5–7 ngày làm việc.",
    returnDescription: "Hỗ trợ đổi trả trong vòng 7 ngày kể từ khi nhận hàng.",
    taxDescription: "Giá đã bao gồm thuế và phí áp dụng.",
    addToCart: "THÊM VÀO GIỎ",
    shippingNote: "Miễn phí giao hàng · Đã gồm thuế và phí",
    storeLocator: "Tìm cửa hàng",
    recommendationTitle: "GỢI Ý DÀNH CHO BẠN",
    allProductsLabel: "Xem tất cả",
  },
  footer: {
    about: "Theo dõi các kênh chính thức để cập nhật mẫu kính và câu chuyện mới.",
    socialLinks: [
      { label: "Instagram", href: "" },
      { label: "TikTok", href: "" },
      { label: "YouTube", href: "" },
    ],
    customerCare: "Thông tin",
    links: [
      { label: "Tìm cửa hàng", href: "/stores" },
      { label: "Thông tin pháp lý", href: "/legal" },
    ],
    newsletter: "Bản tin",
    newsletterDescription: "Nhận tin về mẫu kính và câu chuyện mới.",
    locale: "VIỆT NAM · TIẾNG VIỆT · VNĐ",
    copyright: "© 2026 TRENDY",
    legalLinks: [
      { label: "Chính sách bảo mật", href: "/legal" },
      { label: "Điều khoản sử dụng", href: "/legal" },
    ],
  },
};
