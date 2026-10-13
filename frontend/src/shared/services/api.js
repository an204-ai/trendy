const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
let customerToken = "";
let staffToken = "";
let customerRefreshPromise = null;
let staffRefreshPromise = null;

function isStaffEndpoint(path) {
  return path.startsWith("/staff") || path.startsWith("/admin") || path.startsWith("/auth/staff");
}

export function getCustomerToken() { return customerToken; }
export function getStaffToken() { return staffToken; }

export function translateErrorMessage(raw) {
  if (!raw || typeof raw !== "string") return "Đã xảy ra lỗi, vui lòng thử lại";

  // Check if string is already natural Vietnamese (contains diacritics)
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(raw);

  if (raw.includes(" · ")) {
    return raw.split(" · ").map(translateErrorMessage).join(" · ");
  }
  // Only split commas if it looks like a list of English validator errors
  if (!hasVietnamese && raw.includes(", ") && /(must|should|is|be|than)/i.test(raw)) {
    return raw.split(", ").map(translateErrorMessage).join(" · ");
  }

  const s = raw.trim();

  // Known exact / common English phrases
  const exactDict = {
    "Invalid credentials": "Email hoặc mật khẩu không chính xác",
    "Invalid email or password": "Email hoặc mật khẩu không chính xác",
    "Wrong password": "Mật khẩu không chính xác",
    "Incorrect password": "Mật khẩu không chính xác",
    "User not found": "Không tìm thấy tài khoản người dùng",
    "Email already in use": "Địa chỉ email đã được sử dụng",
    "Email already exists": "Địa chỉ email đã tồn tại trong hệ thống",
    "Product not found": "Không tìm thấy sản phẩm",
    "Category not found": "Không tìm thấy danh mục",
    "Order not found": "Không tìm thấy thông tin đơn hàng",
    "Promotion not found": "Mã khuyến mãi không tồn tại",
    "Promotion expired": "Mã khuyến mãi đã hết hạn",
    "Promotion has expired": "Mã khuyến mãi đã hết hạn",
    "Promotion usage limit reached": "Mã khuyến mãi đã hết lượt sử dụng",
    "Promotion already used by customer": "Bạn đã sử dụng mã khuyến mãi này rồi",
    "Minimum order amount not met": "Chưa đạt giá trị đơn hàng tối thiểu để áp dụng mã",
    "Failed to fetch": "Không thể kết nối đến máy chủ, vui lòng thử lại sau",
    "NetworkError when attempting to fetch resource.": "Mất kết nối mạng, vui lòng kiểm tra đường truyền",
  };
  if (exactDict[s]) return exactDict[s];

  if (hasVietnamese) return s;

  const fieldDict = {
    slug: "Đường dẫn tĩnh",
    name: "Tên",
    sku: "Mã SKU",
    code: "Mã",
    price: "Giá bán",
    image: "Hình ảnh",
    front: "Hình ảnh mặt trước",
    images: "Hình ảnh",
    email: "Email",
    phone: "Số điện thoại",
    password: "Mật khẩu",
    fullName: "Họ và tên",
    description: "Mô tả",
    title: "Tiêu đề",
    discountValue: "Mức giảm giá",
    minimumOrder: "Đơn tối thiểu",
    maximumDiscount: "Giảm tối đa",
    usageLimit: "Giới hạn sử dụng",
    recipientName: "Tên người nhận",
    addressLine: "Địa chỉ",
    province: "Tỉnh / Thành phố",
    district: "Quận / Huyện",
    ward: "Phường / Xã",
    stockOnHand: "Số lượng tồn kho",
    quantity: "Số lượng",
    status: "Trạng thái",
    role: "Vai trò",
    categoryIds: "Danh mục",
    variants: "Biến thể sản phẩm",
    note: "Ghi chú",
    startsAt: "Thời gian bắt đầu",
    endsAt: "Thời gian kết thúc",
  };

  const getFieldName = (k) => fieldDict[k] || k;

  let match = s.match(/^(\w+)\s+must be longer than or equal to\s+(\d+)\s+characters?/i);
  if (match) return `${getFieldName(match[1])} phải có ít nhất ${match[2]} ký tự`;

  match = s.match(/^(\w+)\s+must be shorter than or equal to\s+(\d+)\s+characters?/i);
  if (match) return `${getFieldName(match[1])} không được vượt quá ${match[2]} ký tự`;

  match = s.match(/^(\w+)\s+must not be less than\s+(\d+)/i);
  if (match) return `${getFieldName(match[1])} không được nhỏ hơn ${match[2]}`;

  match = s.match(/^(\w+)\s+must not be greater than\s+(\d+)/i);
  if (match) return `${getFieldName(match[1])} không được lớn hơn ${match[2]}`;

  match = s.match(/^(\w+)\s+should not be empty/i) || s.match(/^(\w+)\s+must not be empty/i);
  if (match) return `Vui lòng nhập ${getFieldName(match[1]).toLowerCase()}`;

  match = s.match(/^(\w+)\s+must be an email/i);
  if (match) return "Địa chỉ email không đúng định dạng";

  match = s.match(/^(\w+)\s+must be (an integer number|a number)/i);
  if (match) return `${getFieldName(match[1])} phải là số hợp lệ`;

  match = s.match(/^(\w+)\s+must be a string/i);
  if (match) return `${getFieldName(match[1])} phải là chuỗi văn bản`;

  match = s.match(/^(\w+)\s+must be a boolean value/i);
  if (match) return `${getFieldName(match[1])} không hợp lệ`;

  match = s.match(/^each value in\s+(\w+)\s+must be/i);
  if (match) return `Dữ liệu trong ${getFieldName(match[1]).toLowerCase()} không hợp lệ`;

  match = s.match(/^(\w+)\s+must contain at least\s+(\d+)\s+elements?/i);
  if (match) return `${getFieldName(match[1])} cần có ít nhất ${match[2]} mục`;

  match = s.match(/^(\w+)\s+must contain no more than\s+(\d+)\s+elements?/i);
  if (match) return `${getFieldName(match[1])} tối đa ${match[2]} mục`;

  match = s.match(/^(\w+)\s+must be a valid ISO 8601 date string/i);
  if (match) return `${getFieldName(match[1])} không đúng định dạng ngày giờ`;

  if (/Unauthorized/i.test(s) && !/đăng nhập/i.test(s)) return "Phiên làm việc đã hết hạn hoặc chưa đăng nhập";
  if (/Forbidden/i.test(s) && !/quyền/i.test(s)) return "Bạn không có quyền thực hiện thao tác này";
  if (/Not Found/i.test(s)) return "Không tìm thấy dữ liệu yêu cầu";
  if (/Conflict/i.test(s)) return "Dữ liệu bị trùng lặp hoặc đã tồn tại trong hệ thống";
  if (/Internal Server Error/i.test(s)) return "Lỗi máy chủ nội bộ, vui lòng thử lại sau";
  if (/Bad Request/i.test(s)) return "Thông tin nhập vào chưa hợp lệ, vui lòng kiểm tra lại";

  return s;
}

export class ApiError extends Error {
  constructor(message, status = 500, details = null) {
    const vnMessage = translateErrorMessage(message);
    super(vnMessage);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function decodeResponse(response) {
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const rawMessage = Array.isArray(payload?.message) ? payload.message.join(" · ") : payload?.message || payload?.error || `Yêu cầu thất bại (${response.status})`;
    const message = translateErrorMessage(rawMessage);
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

async function refreshCustomerSession() {
  if (!customerRefreshPromise) {
    customerRefreshPromise = fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" })
      .then(decodeResponse)
      .then((payload) => { customerToken = payload.accessToken; return payload; })
      .catch((error) => { customerToken = ""; throw error; })
      .finally(() => { customerRefreshPromise = null; });
  }
  return customerRefreshPromise;
}

async function refreshStaffSession() {
  if (!staffRefreshPromise) {
    staffRefreshPromise = fetch(`${API_BASE}/auth/staff/refresh`, { method: "POST", credentials: "include" })
      .then(decodeResponse)
      .then((payload) => { staffToken = payload.accessToken; return payload; })
      .catch((error) => { staffToken = ""; throw error; })
      .finally(() => { staffRefreshPromise = null; });
  }
  return staffRefreshPromise;
}

export async function apiRequest(path, options = {}, retry = true) {
  const isStaff = options.staffAuth !== undefined
    ? Boolean(options.staffAuth)
    : (isStaffEndpoint(path) || Boolean(staffToken && !customerToken));
  const token = options.token || (isStaff ? (staffToken || customerToken) : (customerToken || staffToken));
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  if (response.status === 401 && retry && path !== "/auth/login" && path !== "/auth/staff/login" && path !== "/auth/register" && path !== "/auth/google") {
    try {
      if (isStaff) {
        await refreshStaffSession();
      } else {
        await refreshCustomerSession();
      }
      return apiRequest(path, options, false);
    } catch {
      if (isStaff) staffToken = "";
      else customerToken = "";
    }
  }
  return decodeResponse(response);
}

export async function restoreSessions() {
  const [customerResult, staffResult] = await Promise.allSettled([
    refreshCustomerSession(),
    refreshStaffSession(),
  ]);
  return {
    customer: customerResult.status === "fulfilled" ? customerResult.value.user : null,
    staff: staffResult.status === "fulfilled" ? staffResult.value.user : null,
  };
}

export async function restoreSession() { return refreshCustomerSession(); }
export async function login(email, password) {
  const payload = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false);
  customerToken = payload.accessToken;
  return payload.user;
}
export async function loginStaff(email, password) {
  const payload = await apiRequest("/auth/staff/login", { method: "POST", body: JSON.stringify({ email, password }) }, false);
  staffToken = payload.accessToken;
  return payload.user;
}
export async function register({ email, password, fullName, phone }) {
  const payload = await apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ email, password, fullName, ...(phone ? { phone } : {}) }) }, false);
  customerToken = payload.accessToken;
  return payload.user;
}
export async function loginWithGoogle(credential, nonce) {
  const payload = await apiRequest("/auth/google", { method: "POST", body: JSON.stringify({ credential, nonce }) }, false);
  customerToken = payload.accessToken;
  return payload.user;
}
export async function updateMyProfile(values) {
  const payload = await apiRequest("/auth/profile", { method: "PATCH", body: JSON.stringify(values) });
  return payload.user;
}
export async function changePassword({ currentPassword, newPassword }, isStaff = false) {
  return apiRequest("/auth/change-password", {
    method: "POST",
    staffAuth: isStaff,
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}
export async function logout() {
  try { await apiRequest("/auth/logout", { method: "POST" }, false); } finally { customerToken = ""; }
}
export async function logoutStaff() {
  try { await apiRequest("/auth/staff/logout", { method: "POST" }, false); } finally { staffToken = ""; }
}
export function clearAccessToken() { customerToken = ""; staffToken = ""; }
export const placeCodOrder = (payload, idempotencyKey) => apiRequest("/orders", { method: "POST", headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}, body: JSON.stringify(payload) });
export const checkPromotionCode = (code, subtotal) => apiRequest("/orders/check-promotion", { method: "POST", body: JSON.stringify({ code, subtotal }) });
export const getMyOrders = () => apiRequest("/orders/mine");
export const getMyOrder = (code) => apiRequest(`/orders/mine/${encodeURIComponent(code)}`);
export const getStaffOrders = (status = "", query = "") => {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (query.trim()) params.set("q", query.trim());
  const suffix = params.toString();
  return apiRequest(`/staff/orders${suffix ? `?${suffix}` : ""}`);
};
export const getStaffOrder = (code) => apiRequest(`/staff/orders/${encodeURIComponent(code)}`);
export const updateStaffOrder = (code, payload) => apiRequest(`/staff/orders/${encodeURIComponent(code)}`, { method: "PATCH", body: JSON.stringify(payload) });
export const createStaffOrder = (payload) => apiRequest("/staff/orders", { method: "POST", body: JSON.stringify(payload) });
export const cancelStaffOrder = (code, note) => apiRequest(`/staff/orders/${encodeURIComponent(code)}/cancel`, { method: "POST", body: JSON.stringify({ note }) });
export const refundStaffOrder = (code, payload = {}) => apiRequest(`/staff/orders/${encodeURIComponent(code)}/refund`, { method: "POST", body: JSON.stringify(payload) });
export const deleteStaffOrder = (code) => apiRequest(`/staff/orders/${encodeURIComponent(code)}`, { method: "DELETE" });
export const getStaffCustomers = () => apiRequest("/staff/customers");
export const getStaffUsers = () => apiRequest("/staff/users");
export const createStaffUser = (payload) => apiRequest("/staff/users", { method: "POST", body: JSON.stringify(payload) });
export const updateStaffUser = (id, payload) => apiRequest(`/staff/users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteStaffUser = (id) => apiRequest(`/staff/users/${encodeURIComponent(id)}`, { method: "DELETE" });
export const getStaffProducts = () => apiRequest("/staff/products");
export const createStaffProduct = (payload) => apiRequest("/staff/products", { method: "POST", body: JSON.stringify(payload) });
export const updateStaffProduct = (id, payload) => apiRequest(`/staff/products/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteStaffProduct = (id) => apiRequest(`/staff/products/${encodeURIComponent(id)}`, { method: "DELETE" });
export const updateProductStock = (id, sku, stockOnHand) => apiRequest(`/staff/products/${encodeURIComponent(id)}/variants/${encodeURIComponent(sku)}/stock`, { method: "PATCH", body: JSON.stringify({ stockOnHand }) });
export const getStaffCategories = () => apiRequest("/staff/categories");
export const createStaffCategory = (payload) => apiRequest("/staff/categories", { method: "POST", body: JSON.stringify(payload) });
export const updateStaffCategory = (id, payload) => apiRequest(`/staff/categories/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteStaffCategory = (id) => apiRequest(`/staff/categories/${encodeURIComponent(id)}`, { method: "DELETE" });
export const getStaffPromotions = () => apiRequest("/staff/promotions");
export const createStaffPromotion = (payload) => apiRequest("/staff/promotions", { method: "POST", body: JSON.stringify(payload) });
export const updateStaffPromotion = (id, payload) => apiRequest(`/staff/promotions/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
export const deleteStaffPromotion = (id) => apiRequest(`/staff/promotions/${encodeURIComponent(id)}`, { method: "DELETE" });
export const getStaffConversations = () => apiRequest("/staff/chat/conversations");
export const getStaffConversationMessages = (id) => apiRequest(`/staff/chat/conversations/${encodeURIComponent(id)}/messages`);
export const sendStaffChatMessage = (id, body) => apiRequest(`/staff/chat/conversations/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify({ body }) });
export const updateStaffConversation = (id, status) => apiRequest(`/staff/chat/conversations/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteStaffConversation = (id) => apiRequest(`/staff/chat/conversations/${encodeURIComponent(id)}`, { method: "DELETE" });
export const getCustomerConversation = () => apiRequest("/customer/chat");
export const sendCustomerChatMessage = (body) => apiRequest("/customer/chat/messages", { method: "POST", body: JSON.stringify({ body }) });
export const getCatalogProducts = () => apiRequest("/products", {}, false);
export const getCatalogCategories = () => apiRequest("/categories", {}, false);
