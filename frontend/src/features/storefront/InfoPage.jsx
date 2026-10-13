import { useEffect, useState } from "react";

const legalSections = [
  {
    title: "Thông tin thương hiệu và showroom",
    paragraphs: [
      "Trang web chính thức của Mắt Kính Trendy (TRENDY) hoạt động nhằm mục đích giới thiệu các bộ sưu tập kính mắt thời trang, gọng kính cận cao cấp, cung cấp thông tin khúc xạ chuyên môn và tiếp nhận đơn đặt hàng trực tuyến trên phạm vi toàn quốc.",
      "Tên thương hiệu: Mắt Kính Trendy.",
      "Địa chỉ showroom: 37 Nguyễn Gia Trí, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh.",
      "Số điện thoại đường dây nóng: 0392 615 888.",
      "Hòm thư điện tử hỗ trợ: cskh@trendyeye.vn.",
      "Thời gian đón tiếp và phục vụ khách hàng: 08:30 - 22:00 từ Thứ Hai đến Thứ Bảy hàng tuần.",
    ],
  },
  {
    title: "Quy định đặt hàng và xác nhận giao dịch",
    paragraphs: [
      "Quý khách có thể lựa chọn mua sắm trực tuyến thông qua website hoặc trải nghiệm thử kính trực tiếp tại showroom của Trendy.",
      "Mỗi đơn hàng gửi đi trên website sẽ được tạo lập một mã vận đơn riêng biệt. Đội ngũ chuyên viên tư vấn của Trendy sẽ liên hệ với quý khách để xác nhận thông tin đơn hàng, số đo thị lực (đối với yêu cầu lắp tròng kính cận hoặc loạn) và địa chỉ nhận hàng trước khi tiến hành quy trình đóng gói và gửi hàng.",
      "Trendy bảo lưu quyền từ chối hoặc hủy bỏ đơn hàng trong trường hợp thông tin liên lạc được cung cấp không chính xác, không liên hệ được với người nhận hoặc xảy ra sự cố kỹ thuật bất khả kháng liên quan đến số lượng tồn kho.",
    ],
  },
  {
    title: "Chính sách giá cả và phương thức thanh toán",
    paragraphs: [
      "Mọi mức giá niêm yết trên website đều là giá thanh toán chính thức bằng Đồng Việt Nam (VNĐ), đã bao gồm toàn bộ các loại thuế và phụ phí theo quy định hiện hành.",
      "Trendy áp dụng phương thức thanh toán linh hoạt, bao gồm thanh toán trực tiếp khi nhận hàng (COD) hoặc chuyển khoản ngân hàng thông qua cổng mã QR định danh an toàn.",
      "Giá bán niêm yết của sản phẩm có thể được điều chỉnh linh hoạt theo từng chương trình ưu đãi hoặc sự kiện ra mắt bộ sưu tập mới mà không áp dụng cho các giao dịch đã hoàn tất xác nhận trước đó.",
    ],
  },
  {
    title: "Chính sách giao nhận và đồng kiểm",
    paragraphs: [
      "Trendy áp dụng chính sách miễn phí vận chuyển cho toàn bộ đơn hàng giao đến các tỉnh thành trên cả nước.",
      "Thời gian chuyển phát tiêu chuẩn dao động từ hai đến bốn ngày làm việc tùy thuộc vào khoảng cách địa lý. Đối với các đơn hàng tại khu vực nội thành TP. Hồ Chí Minh, quý khách có thể yêu cầu giao hàng nhanh trong ngày.",
      "Nhằm đảm bảo quyền lợi cao nhất cho khách hàng, Trendy luôn khuyến khích quý khách đồng kiểm kiện hàng ngoại quan, mở kiểm tra tình trạng hộp kính, thẻ bảo hành, khăn lau và mẫu mã sản phẩm trước khi thanh toán và nhận hàng từ nhân viên bưu tá.",
    ],
  },
  {
    title: "Chính sách đổi sản phẩm và bảo dưỡng kỹ thuật",
    paragraphs: [
      "Khách hàng được hỗ trợ đổi sang mẫu kính khác trong thời hạn bảy ngày kể từ ngày nhận hàng khi sản phẩm còn nguyên vẹn tem nhãn, chưa qua sử dụng và đầy đủ hộp đựng, bao da, khăn lau cùng phụ kiện nguyên bản đi kèm."
    ],
  },
  {
    title: "Bản quyền sở hữu trí tuệ",
    paragraphs: [
      "Toàn bộ tài nguyên hiển thị trên website bao gồm hình ảnh sản phẩm, hình ảnh chiến dịch lookbook, video tư liệu, logo nhận diện thương hiệu, thiết kế đồ họa và các nội dung văn bản đều thuộc quyền sở hữu trí tuệ của Trendy hoặc các đối tác được ủy quyền hợp pháp.",
      "Mọi hành vi sao chép, trích xuất dữ liệu, sửa đổi, tái bản hoặc sử dụng hình ảnh và nội dung của Trendy cho các mục đích thương mại khi chưa nhận được sự đồng thuận bằng văn bản đều bị coi là vi phạm pháp luật sở hữu trí tuệ.",
    ],
  },
  {
    title: "Giải quyết tranh chấp và điều khoản thi hành",
    paragraphs: [
      "Trendy luôn cam kết giải quyết mọi vướng mắc, thắc mắc hoặc phản ánh của khách hàng dựa trên tinh thần trách nhiệm, lắng nghe và tôn trọng tối đa quyền lợi người tiêu dùng.",
      "Trong trường hợp phát sinh tranh chấp không thể giải quyết thông qua thương lượng trực tiếp, vụ việc sẽ được đưa ra cơ quan có thẩm quyền giải quyết theo đúng quy định của pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.",
    ],
  },
];

const privacySections = [
  {
    title: "Mục đích thu thập thông tin",
    paragraphs: [
      "Tiếp nhận, xử lý, xác nhận và hoàn tất quy trình giao nhận đơn đặt hàng kính mắt đến tận địa chỉ của quý khách.",
      "Lưu trữ thông số kỹ thuật đơn kính (độ cận, độ loạn, khoảng cách đồng tử) do quý khách cung cấp nhằm mục đích đo cắt tròng kính chính xác và hỗ trợ theo dõi lịch sử thị lực.",
      "Thực hiện chính sách bảo dưỡng kỹ thuật trọn đời, hỗ trợ nắn chỉnh gọng kính và thực hiện quyền lợi đổi trả sản phẩm khi phát sinh yêu cầu.",
      "Cung cấp thông tin cập nhật liên quan đến tình trạng xử lý đơn hàng và phản hồi kịp thời các thắc mắc của khách hàng qua hệ thống hỗ trợ trực tuyến.",
    ],
  },
  {
    title: "Phạm vi thông tin cá nhân thu thập",
    paragraphs: [
      "Thông tin định danh và liên hệ cơ bản: Họ và tên, số điện thoại, địa chỉ nhận hàng và địa chỉ hòm thư điện tử.",
      "Thông tin khúc xạ chuyên môn: Đơn kính đo thị lực hoặc các thông số độ cận, độ loạn mà quý khách cung cấp cho chuyên viên tư vấn khi đặt cắt tròng kính.",
      "Thông tin giao dịch: Danh mục sản phẩm đã đặt mua, mã vận đơn, danh sách sản phẩm yêu thích và lịch sử phản hồi dịch vụ.",
      "Trendy cam kết không lưu giữ thông tin thẻ ngân hàng hoặc dữ liệu tài khoản thanh toán tài chính của quý khách trên hệ thống máy chủ của chúng tôi.",
    ],
  },
  {
    title: "Thời gian lưu trữ dữ liệu cá nhân",
    paragraphs: [
      "Dữ liệu cá nhân của quý khách được lưu trữ bảo mật trên hệ thống máy chủ nội bộ trong suốt quá trình quý khách duy trì tài khoản hoặc để phục vụ chính sách bảo dưỡng kỹ thuật trọn đời của Trendy.",
      "Dữ liệu sẽ được xóa bỏ hoặc ẩn danh hoàn toàn khi có yêu cầu bằng văn bản hoặc thông báo trực tiếp từ quý khách gửi đến bộ phận chăm sóc khách hàng.",
    ],
  },
  {
    title: "Đối tượng tiếp cận dữ liệu",
    paragraphs: [
      "Đội ngũ chuyên môn và nhân viên chăm sóc khách hàng của Trendy trực tiếp tham gia vào quy trình tư vấn kỹ thuật, đóng gói và hỗ trợ bảo hành.",
      "Các đối tác cung cấp dịch vụ bưu chính chuyển phát uy tín được Trendy chỉ định nhằm thực hiện công tác giao kiện hàng đến tay quý khách.",
      "Cơ quan bảo vệ pháp luật có thẩm quyền trong các tình huống được yêu cầu bằng văn bản theo đúng trình tự pháp luật quy định.",
      "Trendy cam kết không thực hiện việc trao đổi, mua bán hoặc chuyển nhượng thông tin cá nhân của quý khách cho bất kỳ bên thứ ba nào vì mục đích quảng bá thương mại.",
    ],
  },
  {
    title: "Đơn vị thu thập và quản lý thông tin",
    paragraphs: [
      "Tên đơn vị: Mắt Kính Trendy (TRENDY).",
      "Địa chỉ showroom: 37 Nguyễn Gia Trí, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh.",
      "Đường dây nóng hỗ trợ: 0392 615 888.",
      "Hòm thư điện tử tiếp nhận thông tin: cskh@trendyeye.vn.",
    ],
  },
  {
    title: "Phương tiện tiếp cận và chỉnh sửa dữ liệu cá nhân",
    paragraphs: [
      "Quý khách có toàn quyền đăng nhập vào mục tài khoản cá nhân trên website để tự kiểm tra, tra cứu lịch sử mua hàng và cập nhật các thông tin cá nhân của mình.",
      "Quý khách có thể liên hệ trực tiếp với chuyên viên Trendy qua đường dây nóng 0392 615 888 hoặc kênh chat trực tuyến để yêu cầu kiểm tra, hiệu chỉnh hoặc hủy bỏ vĩnh viễn thông tin cá nhân trên hệ thống lưu trữ.",
    ],
  },
  {
    title: "Cam kết bảo mật an toàn thông tin",
    paragraphs: [
      "Trendy áp dụng các tiêu chuẩn kỹ thuật an toàn và giao thức mã hóa dữ liệu bảo mật trên máy chủ nhằm ngăn chặn các hành vi truy cập trái phép, rò rỉ dữ liệu hoặc mất mát thông tin.",
      "Toàn bộ thông tin cá nhân của khách hàng cùng thông số đơn kính mắt được bảo mật tuyệt đối và chỉ sử dụng cho các mục đích đã được thông báo.",
      "Trong tình huống máy chủ lưu trữ dữ liệu bị tấn công dẫn đến rủi ro rò rỉ thông tin khách hàng, Trendy có trách nhiệm báo cáo cơ quan chức năng điều tra xử lý và thông báo ngay đến quý khách bị ảnh hưởng.",
    ],
  },
];

export default function InfoPage({ initialTab = "legal" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const isPrivacy = activeTab === "privacy";
  const sections = isPrivacy ? privacySections : legalSections;

  return (
    <main className="px-5 pb-20 pt-[110px] md:px-[4.2vw] md:pt-[125px]">
      <div className="mb-7 flex items-center gap-2 text-[9px] uppercase tracking-[.08em] text-black">
        <a href="/">Trang chủ</a>
        <span>/</span>
        <span>{isPrivacy ? "Chính sách bảo mật" : "Thông tin pháp lý"}</span>
      </div>

      <header className="border-b border-black/10 pb-8">
        <h1 className="font-display text-4xl uppercase md:text-6xl">
          {isPrivacy ? "CHÍNH SÁCH BẢO MẬT" : "THÔNG TIN PHÁP LÝ"}
        </h1>
      </header>

      <nav className="mx-auto mt-8 flex max-w-4xl border-b border-black/10 text-[11px] uppercase tracking-[.1em]" aria-label="Phân mục pháp lý">
        <a
          href="/legal"
          onClick={(e) => {
            if (!e.metaKey && !e.ctrlKey) {
              setActiveTab("legal");
            }
          }}
          className={`border-b-2 pb-3 pr-8 transition-colors ${
            !isPrivacy
              ? "border-black font-semibold text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Thông tin pháp lý & Điều khoản
        </a>
        <a
          href="/privacy"
          onClick={(e) => {
            if (!e.metaKey && !e.ctrlKey) {
              setActiveTab("privacy");
            }
          }}
          className={`border-b-2 pb-3 pr-8 transition-colors ${
            isPrivacy
              ? "border-black font-semibold text-black"
              : "border-transparent text-neutral-400 hover:text-black"
          }`}
        >
          Chính sách bảo mật
        </a>
      </nav>

      <section className="mx-auto mt-7 max-w-4xl">
        {sections.map((item, index) => (
          <details key={item.title} open={index === 0} className="group border-t border-black/10 last:border-b">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between py-4 text-[11px] font-medium uppercase tracking-[.08em] text-black transition-colors hover:opacity-70 focus:outline-none [&::-webkit-details-marker]:hidden">
              <span>{item.title}</span>
              <span className="text-base font-light transition-transform duration-200 group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <div className="max-w-3xl pb-6 pr-4 text-xs leading-relaxed text-black/90">
              {item.paragraphs.map((paragraph, pIdx) => (
                <p key={pIdx} className="mb-3.5 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </details>
        ))}
      </section>
    </main>
  );
}
