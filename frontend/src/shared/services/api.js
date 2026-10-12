const API_BASE = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");
let accessToken = "";
let refreshPromise = null;

export class ApiError extends Error {
  constructor(message, status = 500, details = null) { super(message); this.name = "ApiError"; this.status = status; this.details = details; }
}

async function decodeResponse(response) {
  const text = await response.text();
  let payload = null;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  if (!response.ok) {
    const message = Array.isArray(payload?.message) ? payload.message.join(" · ") : payload?.message || payload?.error || `Yêu cầu thất bại (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }
  return payload;
}

async function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" })
      .then(decodeResponse)
      .then((payload) => { accessToken = payload.accessToken; return payload; })
      .catch((error) => { accessToken = ""; throw error; })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function apiRequest(path, options = {}, retry = true) {
  const headers = new Headers(options.headers || {});
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  if (options.body && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: "include" });
  if (response.status === 401 && retry && !path.startsWith("/auth/")) {
    try { await refreshSession(); return apiRequest(path, options, false); } catch { accessToken = ""; }
  }
  return decodeResponse(response);
}

export async function restoreSession() { return refreshSession(); }
export async function login(email, password) {
  const payload = await apiRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }, false);
  accessToken = payload.accessToken;
  return payload.user;
}
export async function loginStaff(email, password) {
  const payload = await apiRequest("/auth/staff/login", { method: "POST", body: JSON.stringify({ email, password }) }, false);
  accessToken = payload.accessToken;
  return payload.user;
}
export async function register({ email, password, fullName, phone }) {
  const payload = await apiRequest("/auth/register", { method: "POST", body: JSON.stringify({ email, password, fullName, ...(phone ? { phone } : {}) }) }, false);
  accessToken = payload.accessToken;
  return payload.user;
}
export async function loginWithGoogle(credential, nonce) {
  const payload = await apiRequest("/auth/google", { method: "POST", body: JSON.stringify({ credential, nonce }) }, false);
  accessToken = payload.accessToken;
  return payload.user;
}
export async function updateMyProfile(values) {
  const payload = await apiRequest("/auth/profile", { method: "PATCH", body: JSON.stringify(values) });
  return payload.user;
}
export async function logout() {
  try { await apiRequest("/auth/logout", { method: "POST" }, false); } finally { accessToken = ""; }
}
export function clearAccessToken() { accessToken = ""; }
export const placeCodOrder = (payload, idempotencyKey) => apiRequest("/orders", { method: "POST", headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}, body: JSON.stringify(payload) });
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
export const createStaffUser = (payload) => apiRequest("/staff/users", { method: "POST", body: JSON.stringify(payload) });
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
export const getCustomerConversation = () => apiRequest("/customer/chat");
export const sendCustomerChatMessage = (body) => apiRequest("/customer/chat/messages", { method: "POST", body: JSON.stringify({ body }) });
export const getCatalogProducts = () => apiRequest("/products", {}, false);
export const getCatalogCategories = () => apiRequest("/categories", {}, false);
