# Trendy Eye

Storefront React/Vite và backend NestJS cho tài khoản khách hàng, đơn COD, theo dõi đơn và xử lý đơn dành cho nhân viên.

## Chạy toàn hệ thống bằng Docker

Yêu cầu Docker Desktop đang chạy. Lần đầu khởi động sẽ tải image, cài dependency trong quá trình build, chạy migration và seed dữ liệu sản phẩm.

```sh
docker compose up -d --build
```

- Storefront: <http://127.0.0.1:4174>
- Health check: <http://127.0.0.1:4174/api/v1/health>
- API trực tiếp trên localhost: `http://127.0.0.1:3000/api/v1`

Compose chỉ khởi chạy PostgreSQL, RabbitMQ, API NestJS, worker xử lý sự kiện đơn hàng và web storefront. PostgreSQL/RabbitMQ chỉ truy cập trong Docker network; không mở cổng quản trị RabbitMQ.

Trên máy mới, sao chép `.env.example` thành `.env` rồi đổi các mật khẩu và secret. Tài khoản admin seed mặc định là `admin@trendy.local`; mật khẩu admin được lưu dưới `SEED_ADMIN_PASSWORD`. Giữ file `.env` riêng tư. Bật `COOKIE_SECURE=true` khi chạy sau HTTPS.

Để bật đăng nhập Google, tạo OAuth Client ID loại Web trong Google Cloud Console, thêm domain đang chạy vào Authorized JavaScript origins, rồi đặt cùng Client ID vào `GOOGLE_CLIENT_ID` trong file `.env`. Khi chạy Vite trực tiếp, sao chép `frontend/.env.example` thành `frontend/.env` và đặt Client ID đó vào `VITE_GOOGLE_CLIENT_ID`. Docker dùng `GOOGLE_CLIENT_ID` cho cả web và API.

```sh
docker compose logs -f api worker
# dừng các service, giữ lại dữ liệu

docker compose down
# xóa cả dữ liệu database và message broker

docker compose down -v
```

## Chạy giao diện Vite và API bằng Docker

Có thể dùng `docker compose up -d postgres rabbitmq api worker` rồi chạy giao diện từ thư mục `frontend`:

```sh
cd frontend && npm install
npm run dev
```

Nếu dùng đăng nhập Google trong cách chạy này, hãy thêm `VITE_GOOGLE_CLIENT_ID` vào `frontend/.env` trước khi khởi động Vite.

Vite chuyển tiếp `/api` tới `127.0.0.1:3000`. Web container mặc định ở cổng `4174` để không đụng Vite ở `4173`.

## Cấu trúc thư mục

Frontend và backend được chia theo vai trò. Thành phần dùng lại nằm trong `shared`.

```text
frontend/src/
  features/
    admin/             # Quản lý tài khoản nhân viên
    customer/          # Đăng nhập, hồ sơ, yêu thích, đơn COD và giỏ hàng
    staff/             # Đăng nhập nội bộ và xử lý đơn hàng
    storefront/        # Trang cửa hàng, sản phẩm, câu chuyện và thông tin
  shared/
    components/        # Header, footer, thẻ sản phẩm, tiến trình đơn hàng
    data/              # Dữ liệu cửa hàng dùng chung
    orders/            # Nhãn trạng thái và định dạng thông tin đơn
    services/          # API và truy vấn dữ liệu cửa hàng

backend/src/
  admin/               # Endpoint chỉ dành cho admin
  customer/            # Module và endpoint khách hàng
  staff/               # Module và endpoint xử lý đơn của nhân viên
  shared/
    auth/              # Đăng nhập, phiên và phân quyền
    catalog/           # API catalog
    database/          # Entity, migration và seed
    health/            # Health check
    messaging/         # Outbox và RabbitMQ
    orders/            # DTO, nghiệp vụ và module đơn hàng dùng chung
```

- `frontend/`: giao diện React/Vite, tài nguyên tĩnh, cấu hình proxy và Dockerfile web.
- `backend/`: API NestJS, worker RabbitMQ và Dockerfile backend.
- Thư mục gốc: Docker Compose, tài liệu và cấu hình môi trường cục bộ.

## Chức năng đã có

- Đăng ký/đăng nhập/đăng xuất. Khách hàng dùng `/account/login`; nhân viên/admin dùng `/staff/login` và endpoint riêng `/api/v1/auth/staff/login`. Access token JWT sống ngắn được giữ trong bộ nhớ trình duyệt; refresh token ngẫu nhiên chỉ lưu dưới dạng hash trong PostgreSQL và gửi bằng cookie `HttpOnly`, `SameSite=Lax`, xoay token mỗi lần refresh.
- Đăng nhập Google bằng Google Identity Services; API xác minh chữ ký ID token, issuer, thời hạn và Client ID trước khi tạo phiên. Tài khoản Google mới được tạo với quyền `CUSTOMER`; tài khoản có email đã xác minh có thể liên kết với hồ sơ khách hàng hiện tại.
- Khách hàng cập nhật họ tên và số điện thoại trong hồ sơ; email đăng nhập không thể sửa từ màn hình này.
- Vai trò `CUSTOMER`, `STAFF`, `ADMIN`. Đăng ký công khai luôn tạo khách hàng; chỉ admin tạo được tài khoản nhân viên qua API.
- Đặt hàng COD sau đăng nhập. Backend tự lấy giá/SKU từ catalog, lưu ảnh chụp tên và giá vào dòng đơn, hỗ trợ `Idempotency-Key` và tạo order event trong cùng transaction.
- Theo dõi đơn hàng và lịch sử trạng thái riêng tư theo chủ tài khoản.
- Nhân viên xem danh sách và chi tiết đơn, chuyển trạng thái theo luồng, nhập hãng vận chuyển/mã vận đơn và xác nhận đã thu COD khi giao thành công tại `/staff/orders`.
- Admin có thể tạo tài khoản nhân viên tại `/admin/staff`; khách hàng không thể dùng endpoint đăng nhập nội bộ.
- Outbox PostgreSQL phát sự kiện sang RabbitMQ; worker xử lý idempotent, retry tối đa 5 lần rồi chuyển message lỗi sang dead-letter queue.

## Database

Các bảng đặt tên PascalCase, không dùng dấu gạch dưới: `User`, `RefreshSession`, `Product`, `ProductCategory`, `ProductVariant`, `ProductImage`, `ProductCategoryLink`, `CustomerOrder`, `OrderItem`, `OrderStatusHistory`, `OutboxEvent`, `ProcessedMessage`. Migration là nguồn schema; TypeORM `synchronize` luôn tắt.

Catalog backend seed theo dữ liệu hiện có ở `backend/src/shared/database/catalog.seed.json`. `stockOnHand: null` có nghĩa inventory chưa được quản lý/tồn kho chưa xác định; khi backend có số lượng tồn, hệ thống mới khóa và trừ tồn nguyên tử trong transaction.

## Vai trò và API chính

- Khách hàng: `POST /api/v1/auth/register`, `/auth/login`, `/auth/google`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, `PATCH /auth/profile`, `POST /orders`, `GET /orders/mine`, `GET /orders/mine/:orderCode`.
- Nhân viên/admin: `POST /api/v1/auth/staff/login`, `GET /api/v1/staff/orders`, `GET /api/v1/staff/orders/:orderCode`, `PATCH /api/v1/staff/orders/:orderCode`.
- Nhân viên/admin: `GET /staff/orders`, `GET /staff/orders/:orderCode`, `PATCH /staff/orders/:orderCode`.
- Admin: `POST /staff/users` tạo tài khoản `STAFF`.
- Catalog: `GET /products`, `/products/:slug`, `/categories`.
