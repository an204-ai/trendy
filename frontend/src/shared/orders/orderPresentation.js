export const statusLabels = {
  RECEIVED: "Đã tiếp nhận", PENDING_CONFIRMATION: "Chờ xác nhận", CONFIRMED: "Đã xác nhận",
  PREPARING: "Đang chuẩn bị", SHIPPED: "Đang giao", DELIVERED: "Đã giao", CANCELLED: "Đã hủy",
};
export const transactionTypeLabels = {
  COD_DUE: "Cần thu COD",
  COD_COLLECTION: "Đã thu COD",
  COD_CANCELLED: "Hủy thu COD",
  COD_REFUND: "Hoàn tiền COD",
  REFUND: "Hoàn tiền",
  PAYMENT: "Thanh toán",
};
export const transactionStatusLabels = {
  PENDING: "Đang chờ",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  FAILED: "Thất bại",
};
export const orderProgressSteps = ["Đã tiếp nhận", "Xác nhận", "Đang chuẩn bị", "Đang giao", "Đã giao"];
export const orderProgressStages = { RECEIVED: 0, PENDING_CONFIRMATION: 0, CONFIRMED: 1, PREPARING: 2, SHIPPED: 3, DELIVERED: 4 };
export const dateLabel = (date) => new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));

