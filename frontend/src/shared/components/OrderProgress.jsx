import { orderProgressStages, orderProgressSteps, statusLabels } from "../orders/orderPresentation.js";

export default function OrderProgress({ status }) {
  if (status === "CANCELLED") return <p className="customer-order-cancelled">Đơn hàng đã hủy</p>;
  const currentStage = orderProgressStages[status] ?? 0;
  const fillPercent = `${(currentStage / (orderProgressSteps.length - 1)) * 100}%`;
  return <div className="customer-order-progress" role="group" aria-label={`Tiến trình đơn hàng: ${statusLabels[status] || status}`}>
    <div className="customer-order-progress-track" aria-hidden="true"><span style={{ width: fillPercent }} /></div>
    <ol>{orderProgressSteps.map((step, index) => <li key={step} className={index <= currentStage ? "is-complete" : ""}><span className="customer-order-progress-dot" /><span>{step}</span></li>)}</ol>
  </div>;
}
