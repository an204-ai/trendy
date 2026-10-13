export function validateName(value, label = "Họ và tên", min = 2, max = 120) {
  const v = (value || "").trim();
  if (!v) return `Vui lòng nhập ${label.toLowerCase()}`;
  if (v.length < min) return `${label} phải có ít nhất ${min} ký tự`;
  if (v.length > max) return `${label} không được vượt quá ${max} ký tự`;
  return "";
}

export function validateEmail(value, required = true) {
  const v = (value || "").trim();
  if (!v) return required ? "Vui lòng nhập địa chỉ email" : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Email không đúng định dạng (ví dụ: name@example.com)";
  if (v.length > 254) return "Email không được vượt quá 254 ký tự";
  return "";
}

export function validatePhone(value, required = true) {
  const v = (value || "").trim();
  if (!v) return required ? "Vui lòng nhập số điện thoại" : "";
  const cleaned = v.replace(/[\s.-]/g, "");
  if (!/^(0|\+84)[0-9]{9}$/.test(cleaned)) {
    return "Số điện thoại không hợp lệ (gồm 10 chữ số, ví dụ: 0912345678)";
  }
  return "";
}

export function validatePassword(value, isNew = false) {
  if (!value) return "Vui lòng nhập mật khẩu";
  if (isNew && value.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (value.length > 128) return "Mật khẩu không được vượt quá 128 ký tự";
  return "";
}

export function validateSku(value, label = "Mã SKU", min = 2, max = 80) {
  const v = (value || "").trim();
  if (!v) return `Vui lòng nhập ${label.toLowerCase()}`;
  if (v.length < min) return `${label} phải có ít nhất ${min} ký tự`;
  if (v.length > max) return `${label} không được vượt quá ${max} ký tự`;
  if (/\s/.test(v)) return `${label} không được chứa khoảng trắng`;
  return "";
}

export function validateSlug(value, label = "Đường dẫn tĩnh", min = 2, max = 120) {
  const v = (value || "").trim();
  if (!v) return `Vui lòng nhập ${label.toLowerCase()}`;
  if (v.length < min) return `${label} phải có ít nhất ${min} ký tự`;
  if (v.length > max) return `${label} không được vượt quá ${max} ký tự`;
  if (!/^[a-z0-9-]+$/.test(v)) return `${label} chỉ được chứa chữ thường không dấu, số và dấu gạch ngang (-)`;
  return "";
}

export function validatePrice(value, label = "Giá bán") {
  if (value === "" || value === null || value === undefined) return `Vui lòng nhập ${label.toLowerCase()}`;
  const num = Number(value);
  if (isNaN(num) || num < 0) return `${label} phải là số không âm`;
  return "";
}

export function validateStock(value, label = "Số lượng tồn kho") {
  if (value === "" || value === null || value === undefined) return `Vui lòng nhập ${label.toLowerCase()}`;
  const num = Number(value);
  if (isNaN(num) || num < 0 || !Number.isInteger(num)) return `${label} phải là số nguyên không âm`;
  if (num > 1000000) return `${label} tối đa 1.000.000`;
  return "";
}

export function validateAddress(value, label = "Địa chỉ nhận hàng", min = 5, max = 255) {
  const v = (value || "").trim();
  if (!v) return `Vui lòng nhập ${label.toLowerCase()}`;
  if (v.length < min) return `${label} phải có ít nhất ${min} ký tự`;
  if (v.length > max) return `${label} không được vượt quá ${max} ký tự`;
  return "";
}

export function validateRequired(value, label) {
  const v = (value || "").toString().trim();
  if (!v) return `Vui lòng nhập ${label.toLowerCase()}`;
  return "";
}

export function validateDiscountValue(value, discountType = "PERCENT") {
  if (value === "" || value === null || value === undefined) return "Vui lòng nhập mức giảm giá";
  const num = Number(value);
  if (isNaN(num) || num <= 0) return "Mức giảm giá phải lớn hơn 0";
  if (discountType === "PERCENT" && num > 100) return "Mức giảm theo phần trăm không được vượt quá 100%";
  return "";
}

export function validateDateRange(startsAt, endsAt) {
  if (!startsAt) return "Vui lòng chọn thời gian bắt đầu";
  if (!endsAt) return "Vui lòng chọn thời gian kết thúc";
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (isNaN(start) || isNaN(end)) return "Thời gian không đúng định dạng";
  if (end <= start) return "Thời gian kết thúc phải sau thời gian bắt đầu";
  return "";
}
