export const statusLabels = {
  RECEIVED: "Đã tiếp nhận", PENDING_CONFIRMATION: "Chờ xác nhận", CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị", SHIPPED: "Đang giao", DELIVERED: "Đã giao", CANCELLED: "Đã hủy",
};
export const orderProgressSteps = ["Đã tiếp nhận", "Xác nhận", "Đang chuẩn bị", "Đang giao", "Đã giao"];
export const orderProgressStages = { RECEIVED: 0, PENDING_CONFIRMATION: 0, CONFIRMED: 1, PREPARING: 2, SHIPPED: 3, DELIVERED: 4 };
export const dateLabel = (date) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
