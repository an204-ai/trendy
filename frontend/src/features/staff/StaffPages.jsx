import { useEffect, useState } from "react";
import { formatPrice } from "../../shared/services/storefront.js";
import OrderProgress from "../../shared/components/OrderProgress.jsx";
import InternalLayout from "../../shared/components/InternalLayout.jsx";
import { dateLabel, statusLabels } from "../../shared/orders/orderPresentation.js";
import { cancelStaffOrder, createStaffOrder, deleteStaffOrder, getStaffCustomers, getStaffProducts, refundStaffOrder } from "../../shared/services/api.js";

export function StaffLoginPage({ onSubmit, onLogout, busy = false, error = "", user = null }) {
  const hasInternalRole = user && ["STAFF", "ADMIN"].includes(user.role);
  const destination = user?.role === "ADMIN" ? "/admin" : "/staff/orders";
  return <main className="internal-login-page">
    <section className="internal-login-brand"><a className="font-display" href="/">TRENDY</a><span>{user ? user.role === "ADMIN" ? "ADMIN" : "NHÂN VIÊN" : "ADMIN / NHÂN VIÊN"}</span></section>
    <section className="internal-login-content">
      <div className="internal-login-panel">
        <h1 className="font-display">{user ? hasInternalRole ? "Đã đăng nhập" : "Không có quyền truy cập" : "Đăng nhập"}</h1>
        {error && <p className="staff-form-error" role="alert">{error}</p>}
        {user ? <div className="staff-auth-actions">
          {hasInternalRole && <a className="staff-primary-action" href={destination}>Vào khu vực quản lý</a>}
          <button className="staff-secondary-action" onClick={onLogout}>Đăng xuất</button>
        </div> : <form className="staff-login-form" onSubmit={(event) => { event.preventDefault(); onSubmit(Object.fromEntries(new FormData(event.currentTarget))); }}>
          <label className="profile-field"><span>TÊN ĐĂNG NHẬP HOẶC EMAIL</span><input name="email" type="text" required maxLength={254} autoComplete="username" placeholder="admintrendy" /></label>
          <label className="profile-field"><span>MẬT KHẨU</span><input name="password" type="password" required maxLength={128} autoComplete="current-password" /></label>
          <button className="staff-primary-action" disabled={busy}>{busy ? "ĐANG ĐĂNG NHẬP…" : "ĐĂNG NHẬP"}</button>
          <a className="staff-customer-login-link" href="/account/login">Đăng nhập khách hàng</a>
        </form>}
      </div>
    </section>
  </main>;
}

export function StaffOrdersPage({ loadOrders, loadOrder, saveOrder, onLogout, isAdmin = false, user }) {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [busyCode, setBusyCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [openCode, setOpenCode] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [shipmentCode, setShipmentCode] = useState("");
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [shipping, setShipping] = useState({ recipientName: "", email: "", phone: "", addressLine: "", ward: "", district: "", province: "" });
  const [createNote, setCreateNote] = useState("");
  const [selectedSku, setSelectedSku] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [orderLines, setOrderLines] = useState([]);
  const [editShipping, setEditShipping] = useState(null);
  const [editLines, setEditLines] = useState([]);
  const [editSelectedSku, setEditSelectedSku] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const nextStatuses = { RECEIVED: "PENDING_CONFIRMATION", PENDING_CONFIRMATION: "CONFIRMED", CONFIRMED: "PREPARING", PREPARING: "SHIPPED", SHIPPED: "DELIVERED" };
  const nextLabels = { RECEIVED: "Tiếp nhận đơn", PENDING_CONFIRMATION: "Xác nhận đơn", CONFIRMED: "Bắt đầu chuẩn bị", PREPARING: "Nhập vận đơn", SHIPPED: "Xác nhận đã giao" };
  const refresh = async () => setOrders(await loadOrders(status, appliedCode));

  useEffect(() => {
    let active = true;
    Promise.all([getStaffCustomers(), getStaffProducts()]).then(([people, catalog]) => {
      if (active) { setCustomers(people); setProducts(catalog); }
    }).catch((reason) => { if (active) setError(reason.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    loadOrders(status, appliedCode).then((rows) => { if (active) setOrders(rows); }).catch((reason) => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loadOrders, status, appliedCode]);

  const toggleDetails = async (orderCode) => {
    if (openCode === orderCode) { setOpenCode(""); setDetail(null); return; }
    setOpenCode(orderCode); setDetail(null); setDetailLoading(true); setError("");
    try { setDetail(await loadOrder(orderCode)); } catch (reason) { setError(reason.message); }
    finally { setDetailLoading(false); }
  };

  const advance = async (order, shipment = null) => {
    const nextStatus = nextStatuses[order.status];
    if (!nextStatus) return;
    if (nextStatus === "SHIPPED" && !shipment) {
      setShipmentCode(order.orderCode); setCarrier(order.carrier || ""); setTrackingNumber(order.trackingNumber || ""); return;
    }
    const paymentCollected = nextStatus === "DELIVERED";
    setBusyCode(order.orderCode); setError(""); setNotice("");
    try {
      await saveOrder(order.orderCode, { status: nextStatus, ...(shipment ? shipment : {}), ...(paymentCollected ? { paymentCollected: true } : {}) });
      setShipmentCode(""); setOpenCode(""); setDetail(null);
      await refresh(); setNotice(`Đã cập nhật đơn ${order.orderCode}`);
    } catch (reason) { setError(reason.message); }
    finally { setBusyCode(""); }
  };

  const skuOptions = products.flatMap((product) => {
    const variants = (product.variants || []).filter((variant) => variant.active !== false);
    return variants.length
      ? variants.map((variant) => ({ sku: variant.sku, label: `${product.name} · ${variant.name} · ${variant.sku}`, stock: variant.stockOnHand }))
      : [{ sku: product.sku, label: `${product.name} · ${product.sku}`, stock: null }];
  });
  const beginCreate = () => {
    setCreateOpen(true); setCustomerId(""); setShipping({ recipientName: "", email: "", phone: "", addressLine: "", ward: "", district: "", province: "" });
    setCreateNote(""); setOrderLines([]); setSelectedSku(skuOptions[0]?.sku || ""); setError(""); setNotice("");
  };
  const addOrderLine = () => {
    if (!selectedSku) return;
    setOrderLines((lines) => {
      const existing = lines.find((line) => line.sku === selectedSku);
      return existing ? lines.map((line) => line.sku === selectedSku ? { ...line, quantity: line.quantity + Number(quantity) } : line) : [...lines, { sku: selectedSku, quantity: Number(quantity) }];
    });
  };
  const submitCreate = async (event) => {
    event.preventDefault();
    if (!customerId || !orderLines.length) { setError("Chọn khách hàng và ít nhất một sản phẩm trước khi tạo đơn."); return; }
    setCreateBusy(true); setError(""); setNotice("");
    try {
      const created = await createStaffOrder({ customerId, items: orderLines, shipping, note: createNote });
      setCreateOpen(false); await refresh(); setNotice(`Đã tạo đơn ${created.orderCode}`);
    } catch (reason) { setError(reason.message); }
    finally { setCreateBusy(false); }
  };
  const chooseCustomer = (id) => {
    setCustomerId(id);
    const customer = customers.find((item) => item.id === id);
    setShipping((current) => ({ ...current, recipientName: customer?.fullName || "", email: customer?.email || "", phone: customer?.phone || "" }));
  };
  const beginEditShipping = (order) => {
    const value = order.shipping || {};
    setEditShipping({ orderCode: order.orderCode, recipientName: value.recipientName || "", email: value.email || "", phone: value.phone || "", addressLine: value.addressLine || "", ward: value.ward || "", district: value.district || "", province: value.province || "", customerNote: order.note || "" });
    setEditLines((order.items || []).map((item) => ({ ...item })));
    setEditSelectedSku(skuOptions[0]?.sku || "");
  };
  const saveShipping = async (event) => {
    event.preventDefault();
    if (!editShipping) return;
    setEditBusy(true); setError("");
    const { orderCode, ...payload } = editShipping;
    payload.items = editLines.map((item) => ({ sku: item.sku, quantity: Number(item.quantity) }));
    try {
      await saveOrder(orderCode, payload);
      setDetail(await loadOrder(orderCode)); setEditShipping(null); await refresh(); setNotice(`Đã lưu thông tin đơn ${orderCode}`);
    } catch (reason) { setError(reason.message); }
    finally { setEditBusy(false); }
  };
  const cancelOrder = async (order) => {
    const note = window.prompt(`Lý do hủy đơn ${order.orderCode}`, "");
    if (note === null) return;
    setBusyCode(order.orderCode); setError("");
    try { await cancelStaffOrder(order.orderCode, note); await refresh(); setNotice(`Đã hủy đơn ${order.orderCode} và hoàn lại tồn kho`); }
    catch (reason) { setError(reason.message); }
    finally { setBusyCode(""); }
  };
  const refundOrder = async (order) => {
    const reference = window.prompt(`Mã giao dịch hoàn tiền cho ${order.orderCode}`, "");
    if (reference === null) return;
    setBusyCode(order.orderCode); setError("");
    try { await refundStaffOrder(order.orderCode, { reference }); await refresh(); setNotice(`Đã ghi nhận hoàn tiền đơn ${order.orderCode}`); }
    catch (reason) { setError(reason.message); }
    finally { setBusyCode(""); }
  };
  const archiveOrder = async (order) => {
    if (!window.confirm(`Đưa đơn ${order.orderCode} vào thùng rác? Lịch sử vẫn được lưu.`)) return;
    setBusyCode(order.orderCode); setError("");
    try { await deleteStaffOrder(order.orderCode); setOpenCode(""); setDetail(null); await refresh(); setNotice(`Đã lưu trữ đơn ${order.orderCode}`); }
    catch (reason) { setError(reason.message); }
    finally { setBusyCode(""); }
  };

  const input = (label, key, required = false, type = "text") => <label className="profile-field" key={key}><span>{label}</span><input type={type} value={shipping[key] || ""} required={required} onChange={(event) => setShipping((current) => ({ ...current, [key]: event.target.value }))} /></label>;

  return <InternalLayout active="orders" isAdmin={isAdmin} user={user} onLogout={onLogout}><div className="staff-console-page">
    <header className="staff-console-heading"><h1 className="font-display">Quản lý đơn hàng</h1><button className="staff-primary-action" onClick={beginCreate}>TẠO ĐƠN HÀNG</button></header>
    {createOpen && <section className="staff-management-panel"><div className="staff-management-panel-head"><h2>Tạo đơn COD cho khách hàng</h2><button className="staff-secondary-action" onClick={() => setCreateOpen(false)}>Đóng</button></div>
      <form className="staff-management-form" onSubmit={submitCreate}>
        <label className="profile-field staff-management-wide"><span>KHÁCH HÀNG</span><select value={customerId} onChange={(event) => chooseCustomer(event.target.value)} required><option value="">Chọn tài khoản khách hàng</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.fullName} · {customer.email}</option>)}</select></label>
        {input("NGƯỜI NHẬN", "recipientName", true)}{input("EMAIL", "email", true, "email")}{input("SỐ ĐIỆN THOẠI", "phone", true, "tel")}{input("ĐỊA CHỈ", "addressLine", true)}{input("PHƯỜNG / XÃ", "ward")}{input("QUẬN / HUYỆN", "district")}{input("TỈNH / THÀNH", "province", true)}
        <div className="staff-order-line-builder staff-management-wide"><label className="profile-field"><span>SẢN PHẨM / SKU</span><select value={selectedSku} onChange={(event) => setSelectedSku(event.target.value)}><option value="">Chọn sản phẩm</option>{skuOptions.map((option) => <option key={option.sku} value={option.sku}>{option.label}{option.stock !== null ? ` · Tồn ${option.stock}` : ""}</option>)}</select></label><label className="profile-field"><span>SỐ LƯỢNG</span><input type="number" min="1" max="20" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><button type="button" className="staff-secondary-action" onClick={addOrderLine}>THÊM SẢN PHẨM</button></div>
        {orderLines.length > 0 && <div className="staff-order-lines staff-management-wide">{orderLines.map((line) => <div key={line.sku}><span>{skuOptions.find((option) => option.sku === line.sku)?.label || line.sku}</span><strong>Số lượng {line.quantity}</strong><button type="button" className="staff-secondary-action" onClick={() => setOrderLines((rows) => rows.filter((row) => row.sku !== line.sku))}>Bỏ</button></div>)}</div>}
        <label className="profile-field staff-management-wide"><span>GHI CHÚ ĐƠN HÀNG</span><textarea rows="2" value={createNote} onChange={(event) => setCreateNote(event.target.value)} maxLength="1000" /></label>
        {error && <p className="staff-form-error staff-management-wide" role="alert">{error}</p>}
        <div className="staff-management-form-actions staff-management-wide"><button className="staff-primary-action" disabled={createBusy || !customers.length || !skuOptions.length}>{createBusy ? "ĐANG TẠO…" : "TẠO ĐƠN COD"}</button><button type="button" className="staff-secondary-action" onClick={() => setCreateOpen(false)}>Hủy</button></div>
      </form>
    </section>}
    <form className="staff-order-toolbar" onSubmit={(event) => { event.preventDefault(); setAppliedCode(searchCode.trim()); }}>
      <label className="staff-order-search"><input aria-label="Tìm theo mã đơn" type="search" value={searchCode} onChange={(event) => setSearchCode(event.target.value)} placeholder="Nhập mã đơn hàng" /></label>
      <button className="staff-primary-action">Tìm đơn</button>
      {(searchCode || appliedCode) && <button type="button" className="staff-secondary-action" onClick={() => { setSearchCode(""); setAppliedCode(""); }}>Xóa tìm kiếm</button>}
      <label className="staff-order-status-filter" htmlFor="staff-order-status">Trạng thái</label><select id="staff-order-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Tất cả đơn hàng</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
    </form>
    {error && <p className="staff-form-error" role="alert">{error}</p>}
    {notice && <p className="staff-form-notice" role="status">{notice}</p>}
    <div className="staff-order-list">{loading ? <p>Đang tải đơn hàng…</p> : orders.length ? orders.map((order) => <article className="staff-order-card" key={order.id}>
      <div className="staff-order-card-head"><div><h2>{order.orderCode}</h2><span className="staff-order-status">{statusLabels[order.status] || order.status}</span></div><strong>{formatPrice(order.total)}</strong></div>
      <div className="staff-order-meta"><span>{order.customer?.fullName || order.shipping?.recipientName}</span><span>{dateLabel(order.createdAt)}</span><span>COD · {order.paymentStatus === "COLLECTED" ? "Đã thu" : "Chưa thu"}</span></div>
      <p className="staff-order-items">{order.items.map((item) => `${item.productName}${item.variantName ? ` · ${item.variantName}` : ""} × ${item.quantity}`).join("; ")}</p>
      <OrderProgress status={order.status} />
      <div className="staff-order-actions">
        <button className="staff-secondary-action" onClick={() => toggleDetails(order.orderCode)}>{openCode === order.orderCode ? "Ẩn chi tiết" : "Chi tiết đơn hàng"}</button>
        {!["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status) && <button className="staff-secondary-action" onClick={() => cancelOrder(order)} disabled={busyCode === order.orderCode}>Hủy đơn</button>}
        {order.status === "DELIVERED" && order.paymentStatus === "COLLECTED" && <button className="staff-secondary-action" onClick={() => refundOrder(order)} disabled={busyCode === order.orderCode}>Ghi nhận hoàn tiền</button>}
        {["DELIVERED", "CANCELLED"].includes(order.status) && <button className="staff-secondary-action" onClick={() => archiveOrder(order)} disabled={busyCode === order.orderCode}>Xóa đơn</button>}
        {nextStatuses[order.status] && shipmentCode !== order.orderCode && <button className="staff-primary-action" disabled={busyCode === order.orderCode} onClick={() => advance(order)}>{busyCode === order.orderCode ? "ĐANG LƯU…" : nextLabels[order.status]}</button>}
      </div>
      {shipmentCode === order.orderCode && <form className="staff-shipment-form" onSubmit={(event) => { event.preventDefault(); advance(order, { carrier, trackingNumber }); }}>
        <label className="profile-field"><span>ĐƠN VỊ VẬN CHUYỂN</span><input value={carrier} onChange={(event) => setCarrier(event.target.value)} required maxLength={100} /></label>
        <label className="profile-field"><span>MÃ VẬN ĐƠN</span><input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} required maxLength={100} /></label>
        <button className="staff-primary-action" disabled={busyCode === order.orderCode}>{busyCode === order.orderCode ? "ĐANG LƯU…" : "XÁC NHẬN GỬI ĐƠN"}</button>
        <button className="staff-secondary-action" type="button" onClick={() => setShipmentCode("")}>Hủy</button>
      </form>}
      {openCode === order.orderCode && (detailLoading ? <p className="staff-order-detail">Đang tải chi tiết…</p> : detail && <div className="staff-order-expanded">
        <div className="staff-order-actions"><button className="staff-secondary-action" onClick={() => beginEditShipping(detail)}>Sửa thông tin giao hàng</button></div>
        {editShipping?.orderCode === order.orderCode && <form className="staff-management-form staff-order-edit-form" onSubmit={saveShipping}>
          {["recipientName", "email", "phone", "addressLine", "ward", "district", "province", "customerNote"].map((key) => <label className="profile-field" key={key}><span>{{ recipientName: "NGƯỜI NHẬN", email: "EMAIL", phone: "SỐ ĐIỆN THOẠI", addressLine: "ĐỊA CHỈ", ward: "PHƯỜNG / XÃ", district: "QUẬN / HUYỆN", province: "TỈNH / THÀNH", customerNote: "GHI CHÚ" }[key]}</span>{key === "customerNote" ? <textarea rows="2" value={editShipping[key]} onChange={(event) => setEditShipping((current) => ({ ...current, [key]: event.target.value }))} /> : <input type={key === "email" ? "email" : "text"} required={["recipientName", "email", "phone", "addressLine", "province"].includes(key)} value={editShipping[key]} onChange={(event) => setEditShipping((current) => ({ ...current, [key]: event.target.value }))} />}</label>)}
          <fieldset className="staff-order-line-edit staff-management-wide"><legend>SẢN PHẨM TRONG ĐƠN</legend>
            {editLines.map((item) => <div className="staff-order-edit-line" key={item.sku}><span>{item.productName} · {item.sku}</span><label>Số lượng<input type="number" min="1" max="20" value={item.quantity} onChange={(event) => setEditLines((lines) => lines.map((line) => line.sku === item.sku ? { ...line, quantity: event.target.value } : line))} /></label><button type="button" className="staff-secondary-action" disabled={editLines.length < 2} onClick={() => setEditLines((lines) => lines.filter((line) => line.sku !== item.sku))}>Bỏ sản phẩm</button></div>)}
            <div className="staff-order-line-builder"><label className="profile-field"><span>THÊM SẢN PHẨM</span><select value={editSelectedSku} onChange={(event) => setEditSelectedSku(event.target.value)}><option value="">Chọn SKU</option>{skuOptions.map((option) => <option key={option.sku} value={option.sku}>{option.label}</option>)}</select></label><button type="button" className="staff-secondary-action" onClick={() => { if (!editSelectedSku) return; const option = skuOptions.find((item) => item.sku === editSelectedSku); setEditLines((lines) => { const existing = lines.find((line) => line.sku === editSelectedSku); return existing ? lines.map((line) => line.sku === editSelectedSku ? { ...line, quantity: Number(line.quantity) + 1 } : line) : [...lines, { sku: editSelectedSku, productName: option?.label || editSelectedSku, quantity: 1 }]; }); }}>THÊM SKU</button></div>
          </fieldset>
          <div className="staff-management-form-actions staff-management-wide"><button className="staff-primary-action" disabled={editBusy}>{editBusy ? "ĐANG LƯU…" : "LƯU THÔNG TIN"}</button><button type="button" className="staff-secondary-action" onClick={() => setEditShipping(null)}>Hủy</button></div>
        </form>}
        <StaffOrderDetails order={detail} />
      </div>)}
    </article>) : <p>Chưa có đơn hàng phù hợp.</p>}</div>
  </div></InternalLayout>;
}

function StaffOrderDetails({ order }) {
  const shipping = order.shipping || {};
  const address = [shipping.addressLine, shipping.ward, shipping.district, shipping.province].filter(Boolean).join(", ");
  return <div className="staff-order-detail">
    <section><h3>Giao hàng</h3><p>{shipping.recipientName}</p><p>{shipping.phone}</p><p>{address}</p>{order.trackingNumber && <p>{order.carrier} · {order.trackingNumber}</p>}</section>
    <section><h3>Sản phẩm</h3>{order.items.map((item) => <p key={`${item.sku}-${item.variantName}`}>{item.productName}{item.variantName ? ` · ${item.variantName}` : ""} · {item.sku} · SL {item.quantity} · {formatPrice(item.lineTotal)}</p>)}<p className="staff-order-total">Tổng COD · {formatPrice(order.total)}</p></section>
    {order.note && <section><h3>Ghi chú</h3><p>{order.note}</p></section>}
    <section><h3>Lịch sử trạng thái</h3>{order.history.map((entry, index) => <p key={`${entry.toStatus}-${index}`}>{statusLabels[entry.toStatus] || entry.toStatus} · {dateLabel(entry.createdAt)}{entry.note ? ` · ${entry.note}` : ""}</p>)}</section>
    <section><h3>Lịch sử giao dịch</h3>{order.transactions?.length ? order.transactions.map((entry) => <p key={entry.id}>{entry.type} · {entry.status} · {formatPrice(entry.amount)} · {dateLabel(entry.createdAt)}{entry.reference ? ` · ${entry.reference}` : ""}{entry.note ? ` · ${entry.note}` : ""}</p>) : <p>Chưa có giao dịch.</p>}</section>
  </div>;
}
