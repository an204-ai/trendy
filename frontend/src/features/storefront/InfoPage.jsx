const legalItems = [
  ["Thông tin website", "TRENDY · Cửa hàng trực tuyến · © 2026 TRENDY."],
  ["Quyền riêng tư", "Thông tin túi hàng và sản phẩm yêu thích được lưu trong trình duyệt. Bản demo không gửi dữ liệu thanh toán đến đơn vị xử lý."],
  ["Điều khoản sử dụng", "Hình ảnh sản phẩm và tư liệu được sử dụng trong bản mẫu giao diện cửa hàng Trendy."],
];

export default function InfoPage() {
  return <main className="px-5 pb-20 pt-[110px] md:px-[4.2vw] md:pt-[125px]">
    <div className="mb-7 flex items-center gap-2 text-[9px] uppercase tracking-[.08em] text-black"><a href="/">Trang chủ</a><span>/</span><span>Thông tin pháp lý</span></div>
    <header className="border-b border-black/10 pb-8">
      <h1 className="font-display text-5xl md:text-6xl">THÔNG TIN PHÁP LÝ</h1>
    </header>
    <section className="mx-auto mt-7 max-w-4xl">
      {legalItems.map(([title, answer]) => <details key={title} className="border-t border-black/10 last:border-b">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between text-[10px] uppercase tracking-[.08em]">{title}<span className="text-base">+</span></summary>
        <p className="max-w-2xl pb-5 pr-6 text-xs leading-6 text-black">{answer}</p>
      </details>)}
    </section>
  </main>;
}
