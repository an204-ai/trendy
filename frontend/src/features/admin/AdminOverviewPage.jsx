import { useEffect, useState } from "react";
import InternalLayout from "../../shared/components/InternalLayout.jsx";
import { dateLabel, statusLabels } from "../../shared/orders/orderPresentation.js";
import { formatPrice } from "../../shared/services/storefront.js";

export function AdminOverviewPage({ user, onLogout, loadOrders }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    loadOrders().then((rows) => { if (active) setOrders(rows); })
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadOrders]);

  const openOrders = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status));
  const deliveredOrders = orders.filter((order) => order.status === "DELIVERED");
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6);

  return <InternalLayout active="overview" isAdmin user={user} onLogout={onLogout}>
    <div className="internal-page-heading"><h1 className="font-display">Tổng quan</h1></div>
    {error && <p className="staff-form-error" role="alert">{error}</p>}
    <section className="admin-overview-stats" aria-label="Tổng quan đơn hàng">
      <article><span>Tất cả đơn hàng</span><strong>{loading ? "…" : orders.length}</strong></article>
      <article><span>Đơn đang xử lý</span><strong>{loading ? "…" : openOrders.length}</strong></article>
      <article><span>Đơn đã giao</span><strong>{loading ? "…" : deliveredOrders.length}</strong></article>
      <article><span>Giá trị đơn đã giao</span><strong>{loading ? "…" : formatPrice(deliveredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0))}</strong></article>
    </section>
    <section className="admin-overview-recent">
      <div className="admin-overview-section-heading"><h2>Đơn hàng gần đây</h2><a href="/staff/orders">Xem đơn hàng</a></div>
      {loading ? <p>Đang tải đơn hàng…</p> : recentOrders.length ? <div className="admin-overview-order-list">
        {recentOrders.map((order) => <article className="admin-overview-order" key={order.id}>
          <span><strong>{order.orderCode}</strong><small>{order.customer?.fullName || order.shipping?.recipientName || "Khách hàng"}</small></span>
          <span className="admin-overview-order-status">{statusLabels[order.status] || order.status}</span>
          <span className="admin-overview-order-date">{dateLabel(order.createdAt)}</span>
          <strong>{formatPrice(order.total)}</strong>
        </article>)}
      </div> : <p className="admin-overview-empty">Chưa có đơn hàng.</p>}
    </section>
  </InternalLayout>;
}
