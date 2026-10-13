import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "../../shared/services/storefront.js";
import OrderProgress from "../../shared/components/OrderProgress.jsx";
import InternalLayout from "../../shared/components/InternalLayout.jsx";
import Icon from "../../shared/components/Icon.jsx";
import { dateLabel, statusLabels, transactionStatusLabels, transactionTypeLabels } from "../../shared/orders/orderPresentation.js";
import { cancelStaffOrder, createStaffOrder, deleteStaffOrder, getStaffCustomers, getStaffProducts, refundStaffOrder } from "../../shared/services/api.js";

export function StaffLoginPage({ onSubmit, onLogout, busy = false, error = "", user = null }) {
  const hasInternalRole = user && ["STAFF", "ADMIN"].includes(user.role);
  const destination = user?.role === "ADMIN" ? "/admin" : "/staff/orders";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (name, val) => {
    const v = (val || "").trim();
    if (name === "email") {
      if (!v) return "Vui lòng nhập tên đăng nhập hoặc email";
      return "";
    }
    if (name === "password") {
      if (!val) return "Vui lòng nhập mật khẩu";
      return "";
    }
    return "";
  };

  const handleChange = (name, val) => {
    setFormData((prev) => ({ ...prev, [name]: val }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validate(name, val);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validate(name, formData[name]);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errEmail = validate("email", formData.email);
    const errPassword = validate("password", formData.password);
    if (errEmail || errPassword) {
      setTouched({ email: true, password: true });
      setFieldErrors({ email: errEmail, password: errPassword });
      return;
    }
    onSubmit(formData);
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-white text-black lg:grid-cols-[420px_1fr] xl:grid-cols-[480px_1fr]">
      <aside className="relative flex flex-col justify-between overflow-hidden border-b border-white/10 bg-[#0e0e0e] p-8 text-white lg:min-h-screen lg:border-b-0 lg:border-r lg:p-14">
        <div className="flex items-center justify-between">
          <a className="font-display text-3xl tracking-[-.04em] text-white transition-opacity hover:opacity-80" href="/">
            TRENDY
          </a>
        </div>

        <div className="my-auto hidden py-12 lg:block">
          <div className="max-w-sm border-l border-white/20 pl-6">
            <p className="font-display text-2xl font-light leading-relaxed text-neutral-200">
              Chuẩn mực vận hành và bảo mật dữ liệu thương mại điện tử.
            </p>
          </div>
        </div>

        <div className="pt-6 text-[9px] uppercase tracking-[.18em] text-neutral-500">
          HỆ THỐNG QUẢN TRỊ & BẢO MẬT
        </div>
      </aside>

      <section className="flex items-center justify-center p-6 py-12 md:p-12 lg:p-16">
        <div className="w-full max-w-[420px]">
          <h1 className="font-display text-3xl font-medium tracking-tight text-neutral-900 md:text-4xl">
            {user ? (hasInternalRole ? "Đã đăng nhập" : "Không có quyền truy cập") : "Đăng nhập nội bộ"}
          </h1>

          {error && (
            <div role="alert" className="staff-form-error" style={{ marginTop: "20px" }}>
              <Icon name="alert" className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {user ? (
            <div className="mt-8 space-y-3">
              {hasInternalRole && (
                <a
                  className="flex h-12 w-full items-center justify-center rounded-full bg-black text-[11px] font-medium uppercase tracking-[.14em] text-white transition-all hover:bg-neutral-800"
                  href={destination}
                >
                  Vào khu vực quản lý
                </a>
              )}
              <button
                className="flex h-12 w-full items-center justify-center rounded-full border border-black/20 bg-white text-[11px] font-medium uppercase tracking-[.14em] text-black transition-all hover:bg-neutral-100"
                onClick={onLogout}
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            <form
              className="mt-8 space-y-5"
              onSubmit={handleSubmit}
              noValidate
            >
              <div>
                <label className="mb-2 block text-xs font-medium text-black">
                  Tên đăng nhập hoặc Email *
                </label>
                <input
                  name="email"
                  type="text"
                  required
                  maxLength={254}
                  autoComplete="username"
                  placeholder="admin@trendy.local"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={`h-12 w-full rounded-md border border-black/25 bg-white px-3.5 text-xs text-black outline-none transition-all focus:border-black focus:ring-1 focus:ring-black placeholder:text-neutral-400 ${touched.email && fieldErrors.email ? "is-invalid" : ""}`}
                />
                {touched.email && fieldErrors.email && (
                  <span className="profile-field-error">
                    <Icon name="alert" className="h-3.5 w-3.5" />
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-black">
                  Mật khẩu *
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  maxLength={128}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className={`h-12 w-full rounded-md border border-black/25 bg-white px-3.5 text-xs text-black outline-none transition-all focus:border-black focus:ring-1 focus:ring-black placeholder:text-neutral-400 ${touched.password && fieldErrors.password ? "is-invalid" : ""}`}
                />
                {touched.password && fieldErrors.password && (
                  <span className="profile-field-error">
                    <Icon name="alert" className="h-3.5 w-3.5" />
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              <button
                className="mt-2 flex h-12 w-full items-center justify-center rounded-full bg-black text-[11px] font-medium uppercase tracking-[.14em] text-white transition-all hover:bg-neutral-800 disabled:opacity-50"
                disabled={busy}
              >
                {busy ? "Đang xác thực…" : "Đăng nhập hệ thống"}
              </button>

              <div className="pt-4 text-center">
                <a
                  className="text-[11px] text-neutral-400 transition-colors hover:text-black underline underline-offset-4"
                  href="/"
                >
                  Về trang chủ Trendy
                </a>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
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
  const [shipping, setShipping] = useState({ recipientName: "", email: "", phone: "", addressLine: "", ward: "", province: "" });
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

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

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

  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const customerSearchRef = useRef(null);

  const [productSearch, setProductSearch] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showAddProductSearch, setShowAddProductSearch] = useState(false);
  const productSearchRef = useRef(null);
  const productInputRef = useRef(null);

  const skuOptions = useMemo(() => {
    return products.flatMap((product) => {
      const variants = (product.variants || []).filter((variant) => variant.active !== false);
      return variants.length
        ? variants.map((variant) => ({
            sku: variant.sku,
            productName: product.name,
            variantName: variant.name,
            label: `${product.name} · ${variant.name} · ${variant.sku}`,
            stock: variant.stockOnHand,
          }))
        : [{
            sku: product.sku,
            productName: product.name,
            variantName: "",
            label: `${product.name} · ${product.sku}`,
            stock: null,
          }];
    });
  }, [products]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return [];
    const cleanDigits = q.replace(/\D/g, "");
    return customers.filter((c) => {
      const nameMatch = c.fullName?.toLowerCase().includes(q);
      const emailMatch = c.email?.toLowerCase().includes(q);
      const codeMatch = c.customerCode?.toLowerCase().includes(q);
      const phoneDigits = (c.phone || "").replace(/\D/g, "");
      const phoneMatch = cleanDigits && phoneDigits && (phoneDigits.includes(cleanDigits) || phoneDigits.endsWith(cleanDigits));
      return nameMatch || emailMatch || codeMatch || phoneMatch;
    }).slice(0, 10);
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return [];
    return products.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(q);
      const skuMatch = p.sku?.toLowerCase().includes(q);
      const variantSkuMatch = p.variants?.some((v) => v.sku?.toLowerCase().includes(q));
      const variantNameMatch = p.variants?.some((v) => v.name?.toLowerCase().includes(q));
      return nameMatch || skuMatch || variantSkuMatch || variantNameMatch;
    }).slice(0, 10);
  }, [products, productSearch]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (customerSearchRef.current && !customerSearchRef.current.contains(e.target)) {
        setShowCustomerDropdown(false);
      }
      if (productSearchRef.current && !productSearchRef.current.contains(e.target)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const beginCreate = () => {
    setCreateOpen(true);
    setCustomerId("");
    setSelectedCustomer(null);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setShipping({ recipientName: "", email: "", phone: "", addressLine: "", ward: "", province: "" });
    setCreateNote("");
    setOrderLines([]);
    setProductSearch("");
    setShowProductDropdown(false);
    setError("");
    setNotice("");
  };

  const handleSelectCustomer = (cust) => {
    setSelectedCustomer(cust);
    setCustomerId(cust.id);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setShipping((prev) => ({
      ...prev,
      recipientName: cust.fullName || prev.recipientName,
      phone: cust.phone || prev.phone,
      email: cust.email || prev.email,
    }));
  };

  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerId("");
    setCustomerSearch("");
  };

  const handleSelectProduct = (product) => {
    const activeVariants = (product.variants || []).filter((v) => v.active !== false);
    const initialVariant = activeVariants[0] || null;
    const initialSku = initialVariant?.sku || product.sku;
    const initialPrice = initialVariant?.price || product.price;

    setOrderLines((prev) => {
      const existingIdx = prev.findIndex((item) => item.productId === product.id && item.sku === initialSku);
      if (existingIdx >= 0) {
        return prev.map((item, idx) => idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          image: initialVariant?.image || product.image || "/images/placeholder.jpg",
          sku: initialSku,
          variantName: initialVariant?.name || "",
          price: initialPrice,
          quantity: 1,
          variants: activeVariants,
          basePrice: product.price,
        },
      ];
    });
    setProductSearch("");
    setShowProductDropdown(false);
    setError("");
  };

  const updateOrderLineVariant = (index, targetSku) => {
    setOrderLines((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const targetVariant = item.variants?.find((v) => v.sku === targetSku);
        if (!targetVariant) return item;
        return {
          ...item,
          sku: targetVariant.sku,
          variantName: targetVariant.name,
          price: targetVariant.price || item.basePrice,
          image: targetVariant.image || item.image,
        };
      })
    );
  };

  const updateOrderLineQuantity = (index, val) => {
    const qty = Math.max(1, Math.min(20, Number(val) || 1));
    setOrderLines((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: qty } : item))
    );
  };

  const removeOrderLine = (index) => {
    setOrderLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const extractLineAttributes = (line) => {
    const variants = line?.variants || [];
    if (variants.length <= 1) return null;

    const hasSlash = variants.some((v) => (v.name || "").includes("/"));
    if (hasSlash) {
      const colorMap = new Map();
      const subMap = new Map();
      variants.forEach((v) => {
        const parts = (v.name || "").split("/");
        const colorPart = parts[0]?.trim();
        const subPart = parts[1]?.trim();
        if (colorPart && !colorMap.has(colorPart)) {
          colorMap.set(colorPart, { name: colorPart, swatch: v.swatch });
        }
        if (subPart && !subMap.has(subPart)) {
          subMap.set(subPart, { name: subPart });
        }
      });

      const subNames = Array.from(subMap.keys());
      const isDiopter = subNames.some(
        (n) => n.toLowerCase().includes("cận") || n.toLowerCase().includes("độ") || /^[0-9+.-]+$/.test(n)
      );

      return {
        isMulti: true,
        colorLabel: "Màu gọng",
        colors: Array.from(colorMap.values()),
        subLabel: isDiopter ? "Độ cận" : "Phiên bản",
        subAttributes: Array.from(subMap.values()),
      };
    }

    return {
      isMulti: false,
      colorLabel: "Màu gọng",
      variants,
    };
  };

  const orderLinesTotal = useMemo(() => {
    return orderLines.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  }, [orderLines]);

  const submitCreate = async (event) => {
    event.preventDefault();
    if (!orderLines.length) {
      setError("Vui lòng tìm và chọn ít nhất một sản phẩm vào đơn hàng.");
      return;
    }
    if (!shipping.recipientName?.trim() || !shipping.phone?.trim() || !shipping.addressLine?.trim() || !shipping.province?.trim()) {
      setError("Vui lòng điền đầy đủ người nhận, số điện thoại, địa chỉ và tỉnh / thành.");
      return;
    }
    setCreateBusy(true);
    setError("");
    setNotice("");
    try {
      const items = orderLines.map((line) => ({
        sku: line.sku,
        quantity: Number(line.quantity),
      }));
      const created = await createStaffOrder({
        customerId: selectedCustomer?.id || undefined,
        items,
        shipping,
        note: createNote,
      });
      setCreateOpen(false);
      await refresh();
      setNotice(`Đã tạo đơn ${created.orderCode}`);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setCreateBusy(false);
    }
  };

  const beginEditShipping = (order) => {
    const value = order.shipping || {};
    setEditShipping({ orderCode: order.orderCode, recipientName: value.recipientName || "", email: value.email || "", phone: value.phone || "", addressLine: value.addressLine || "", ward: value.ward || "", province: value.province || "", customerNote: order.note || "" });
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

  return <InternalLayout active="orders" isAdmin={isAdmin} user={user} onLogout={onLogout}><div className="staff-console-page">
    <header className="staff-console-heading"><h1 className="font-display">Quản lý đơn hàng</h1><button className="staff-primary-action" onClick={beginCreate}>Tạo đơn hàng</button></header>
    {createOpen && <section className="staff-management-panel">
      <div className="staff-management-panel-head">
        <h2>Tạo đơn COD cho khách hàng</h2>
        <button type="button" className="staff-secondary-action" onClick={() => setCreateOpen(false)}>Đóng</button>
      </div>
      <form className="staff-management-form" onSubmit={submitCreate}>
        {/* Tìm kiếm khách hàng */}
        <div className="staff-management-wide" ref={customerSearchRef}>
          <div className="profile-field staff-autocomplete-field">
            <span>Khách hàng</span>
            {selectedCustomer ? (
              <div className="staff-selected-customer-card">
                <div className="staff-selected-customer-info">
                  <div className="staff-customer-avatar">
                    {(selectedCustomer.fullName || selectedCustomer.email || "K").charAt(0).toUpperCase()}
                  </div>
                  <div className="staff-selected-customer-text">
                    <strong>{selectedCustomer.fullName}</strong>
                    <span>{selectedCustomer.customerCode ? `${selectedCustomer.customerCode} · ` : ""}{selectedCustomer.phone || selectedCustomer.email}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="staff-secondary-action staff-customer-clear-btn"
                  onClick={handleClearCustomer}
                >
                  <Icon name="close" className="h-3.5 w-3.5" />
                  <span>Đổi khách hàng</span>
                </button>
              </div>
            ) : (
              <div className="staff-autocomplete-input-wrap">
                <input
                  type="text"
                  value={customerSearch}
                  placeholder="Nhập số điện thoại, email hoặc họ tên khách hàng để tìm kiếm…"
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                  }}
                  onFocus={() => {
                    if (customerSearch.trim()) setShowCustomerDropdown(true);
                  }}
                />
                {customerSearch && (
                  <button
                    type="button"
                    className="staff-autocomplete-clear"
                    onClick={() => {
                      setCustomerSearch("");
                      setShowCustomerDropdown(false);
                    }}
                    aria-label="Xóa tìm kiếm"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                )}
                {showCustomerDropdown && customerSearch.trim() && (
                  <div className="staff-autocomplete-dropdown">
                    {filteredCustomers.length === 0 ? (
                      <div className="staff-dropdown-empty">Không tìm thấy khách hàng</div>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <div
                          key={cust.id}
                          className="staff-customer-dropdown-item"
                          onClick={() => handleSelectCustomer(cust)}
                        >
                          <div className="staff-customer-avatar">
                            {(cust.fullName || cust.email || "K").charAt(0).toUpperCase()}
                          </div>
                          <div className="staff-customer-item-info">
                            <strong>{cust.fullName}</strong>
                            <span>
                              {cust.phone ? `${cust.phone} · ` : ""}
                              {cust.email ? `${cust.email} · ` : ""}
                              {cust.customerCode || ""}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Thông tin giao hàng */}
        <label className="profile-field">
          <span>Số điện thoại *</span>
          <input
            type="tel"
            value={shipping.phone || ""}
            required
            placeholder="0901234567"
            onChange={(e) => setShipping((cur) => ({ ...cur, phone: e.target.value }))}
          />
        </label>
        <label className="profile-field">
          <span>Email</span>
          <input
            type="email"
            value={shipping.email || ""}
            placeholder="khachhang@example.com"
            onChange={(e) => setShipping((cur) => ({ ...cur, email: e.target.value }))}
          />
        </label>
        <label className="profile-field">
          <span>Người nhận *</span>
          <input
            type="text"
            value={shipping.recipientName || ""}
            required
            placeholder="Họ và tên người nhận"
            onChange={(e) => setShipping((cur) => ({ ...cur, recipientName: e.target.value }))}
          />
        </label>
        <label className="profile-field">
          <span>Địa chỉ *</span>
          <input
            type="text"
            value={shipping.addressLine || ""}
            required
            placeholder="Số nhà, tên đường"
            onChange={(e) => setShipping((cur) => ({ ...cur, addressLine: e.target.value }))}
          />
        </label>
        <label className="profile-field">
          <span>Phường / xã</span>
          <input
            type="text"
            value={shipping.ward || ""}
            placeholder="Phường hoặc xã"
            onChange={(e) => setShipping((cur) => ({ ...cur, ward: e.target.value }))}
          />
        </label>
        <label className="profile-field">
          <span>Tỉnh / thành *</span>
          <input
            type="text"
            value={shipping.province || ""}
            required
            placeholder="Tỉnh hoặc thành phố"
            onChange={(e) => setShipping((cur) => ({ ...cur, province: e.target.value }))}
          />
        </label>

        {/* Sản phẩm trong đơn hàng */}
        {orderLines.length === 0 ? (
          <div className="staff-order-lines-container staff-management-wide" ref={productSearchRef}>
            <div className="staff-order-empty-prompt">
              <span className="staff-order-section-subtitle">Sản phẩm trong đơn hàng</span>
              <div className="staff-autocomplete-input-wrap">
                <input
                  ref={productInputRef}
                  type="text"
                  value={productSearch}
                  placeholder="Tìm kiếm theo tên sản phẩm hoặc mã SKU…"
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => {
                    if (productSearch.trim()) setShowProductDropdown(true);
                  }}
                />
                {productSearch && (
                  <button
                    type="button"
                    className="staff-autocomplete-clear"
                    onClick={() => {
                      setProductSearch("");
                      setShowProductDropdown(false);
                    }}
                    aria-label="Xóa tìm kiếm"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                )}
                {showProductDropdown && productSearch.trim() && (
                  <div className="staff-autocomplete-dropdown staff-product-dropdown-menu">
                    {filteredProducts.length === 0 ? (
                      <div className="staff-dropdown-empty">Không tìm thấy sản phẩm phù hợp</div>
                    ) : (
                      filteredProducts.map((prod) => {
                        const totalStock = prod.variants?.length
                          ? prod.variants.reduce((sum, v) => sum + (v.stockOnHand ?? 0), 0)
                          : null;
                        return (
                          <div
                            key={prod.id}
                            className="staff-product-dropdown-item"
                            onClick={() => handleSelectProduct(prod)}
                          >
                            <img
                              src={prod.image || "/images/placeholder.jpg"}
                              alt={prod.name}
                              className="staff-product-dropdown-thumb"
                            />
                            <div className="staff-product-dropdown-info">
                              <strong>{prod.name}</strong>
                              <span>
                                {prod.sku}
                                {prod.variants?.length ? ` · ${prod.variants.length} biến thể` : ""}
                              </span>
                            </div>
                            <div className="staff-product-dropdown-meta">
                              <strong>{formatPrice(prod.price)}</strong>
                              <span className="staff-product-dropdown-stock">
                                {totalStock !== null ? `Tồn: ${totalStock}` : "Còn hàng"}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="staff-order-lines-container staff-management-wide">
            <div className="staff-order-lines-header">
              <span>Sản phẩm</span>
              <span>Biến thể / SKU</span>
              <span>Đơn giá</span>
              <span>Số lượng</span>
              <span>Thành tiền</span>
              <span></span>
            </div>
            <div className="staff-order-lines-list">
              {orderLines.map((line, idx) => (
                <div key={`${line.productId}-${line.sku}-${idx}`} className="staff-order-line-row">
                  <div className="staff-order-line-prod">
                    <img src={line.image || "/images/placeholder.jpg"} alt={line.productName} className="staff-order-line-thumb" />
                    <strong>{line.productName}</strong>
                  </div>
                  <div className="staff-order-line-variant-col">
                    {(() => {
                      const attrData = extractLineAttributes(line);
                      if (!attrData) {
                        return (
                          <div className="staff-order-variant-single">
                            <span className="staff-order-variant-sku-tag">SKU: {line.sku}</span>
                          </div>
                        );
                      }

                      if (attrData.isMulti) {
                        const currentV = line.variants.find((v) => v.sku === line.sku);
                        const parts = (currentV?.name || "").split("/");
                        const activeColor = parts[0]?.trim() || attrData.colors[0]?.name;
                        const activeSub = parts[1]?.trim() || attrData.subAttributes[0]?.name;

                        return (
                          <div className="staff-order-variant-pill-wrapper">
                            {attrData.colors.length > 0 && (
                              <div className="staff-order-variant-group">
                                <span className="staff-order-variant-label">{attrData.colorLabel}</span>
                                <div className="staff-order-variant-pill-list">
                                  {attrData.colors.map((c) => {
                                    const isSelected = activeColor === c.name;
                                    return (
                                      <button
                                        key={c.name}
                                        type="button"
                                        className={`staff-order-variant-chip ${isSelected ? "is-selected" : ""}`}
                                        onClick={() => {
                                          const matched = line.variants.find((v) => {
                                            const p = (v.name || "").split("/");
                                            return p[0]?.trim() === c.name && (!activeSub || p[1]?.trim() === activeSub);
                                          }) || line.variants.find((v) => (v.name || "").includes(c.name));
                                          if (matched) updateOrderLineVariant(idx, matched.sku);
                                        }}
                                      >
                                        <span className="staff-order-variant-chip-circle" />
                                        <span>{c.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            {attrData.subAttributes.length > 0 && (
                              <div className="staff-order-variant-group">
                                <span className="staff-order-variant-label">{attrData.subLabel}</span>
                                <div className="staff-order-variant-pill-list">
                                  {attrData.subAttributes.map((s) => {
                                    const isSelected = activeSub === s.name;
                                    return (
                                      <button
                                        key={s.name}
                                        type="button"
                                        className={`staff-order-variant-chip staff-order-variant-text-chip ${isSelected ? "is-selected" : ""}`}
                                        onClick={() => {
                                          const matched = line.variants.find((v) => {
                                            const p = (v.name || "").split("/");
                                            return (!activeColor || p[0]?.trim() === activeColor) && p[1]?.trim() === s.name;
                                          }) || line.variants.find((v) => (v.name || "").includes(s.name));
                                          if (matched) updateOrderLineVariant(idx, matched.sku);
                                        }}
                                      >
                                        <span>{s.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            <span className="staff-order-variant-sku-tag">SKU: {line.sku}</span>
                          </div>
                        );
                      }

                      return (
                        <div className="staff-order-variant-pill-wrapper">
                          <div className="staff-order-variant-group">
                            <span className="staff-order-variant-label">{attrData.colorLabel}</span>
                            <div className="staff-order-variant-pill-list">
                              {line.variants.map((v) => {
                                const isSelected = line.sku === v.sku;
                                return (
                                  <button
                                    key={v.sku}
                                    type="button"
                                    className={`staff-order-variant-chip ${isSelected ? "is-selected" : ""}`}
                                    onClick={() => updateOrderLineVariant(idx, v.sku)}
                                    title={`${v.name} (${v.sku})${v.stockOnHand !== null ? ` · Tồn: ${v.stockOnHand}` : ""}`}
                                  >
                                    <span className="staff-order-variant-chip-circle" />
                                    <span>{v.name || v.sku}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <span className="staff-order-variant-sku-tag">SKU: {line.sku}</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="staff-order-line-price-col">
                    <span>{formatPrice(line.price)}</span>
                  </div>
                  <div className="staff-order-line-qty-col">
                    <div className="staff-order-qty-stepper">
                      <button
                        type="button"
                        className="staff-order-qty-btn"
                        onClick={() => updateOrderLineQuantity(idx, line.quantity - 1)}
                        disabled={line.quantity <= 1}
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <span className="staff-order-qty-val">{line.quantity}</span>
                      <button
                        type="button"
                        className="staff-order-qty-btn"
                        onClick={() => updateOrderLineQuantity(idx, line.quantity + 1)}
                        disabled={line.quantity >= 20}
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="staff-order-line-total-col">
                    <strong>{formatPrice(line.price * line.quantity)}</strong>
                  </div>
                  <div className="staff-order-line-action-col">
                    <button
                      type="button"
                      className="staff-order-line-remove-btn"
                      onClick={() => removeOrderLine(idx)}
                      title="Xóa sản phẩm"
                      aria-label="Xóa sản phẩm"
                    >
                      <Icon name="close" className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Nút Chọn thêm sản phẩm / Tìm kiếm mở rộng */}
            {showAddProductSearch ? (
              <div className="staff-order-inline-search-wrap" ref={productSearchRef}>
                <div className="staff-autocomplete-input-wrap">
                  <input
                    ref={productInputRef}
                    type="text"
                    value={productSearch}
                    placeholder="Tìm kiếm theo tên sản phẩm hoặc mã SKU…"
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowProductDropdown(true);
                    }}
                    onFocus={() => {
                      if (productSearch.trim()) setShowProductDropdown(true);
                    }}
                  />
                  <button
                    type="button"
                    className="staff-autocomplete-clear"
                    onClick={() => {
                      setProductSearch("");
                      setShowProductDropdown(false);
                      setShowAddProductSearch(false);
                    }}
                    aria-label="Đóng tìm kiếm"
                  >
                    <Icon name="close" className="h-4 w-4" />
                  </button>
                  {showProductDropdown && productSearch.trim() && (
                    <div className="staff-autocomplete-dropdown staff-product-dropdown-menu">
                      {filteredProducts.length === 0 ? (
                        <div className="staff-dropdown-empty">Không tìm thấy sản phẩm phù hợp</div>
                      ) : (
                        filteredProducts.map((prod) => {
                          const totalStock = prod.variants?.length
                            ? prod.variants.reduce((sum, v) => sum + (v.stockOnHand ?? 0), 0)
                            : null;
                          return (
                            <div
                              key={prod.id}
                              className="staff-product-dropdown-item"
                              onClick={() => {
                                handleSelectProduct(prod);
                                setShowAddProductSearch(false);
                              }}
                            >
                              <img
                                src={prod.image || "/images/placeholder.jpg"}
                                alt={prod.name}
                                className="staff-product-dropdown-thumb"
                              />
                              <div className="staff-product-dropdown-info">
                                <strong>{prod.name}</strong>
                                <span>
                                  {prod.sku}
                                  {prod.variants?.length ? ` · ${prod.variants.length} biến thể` : ""}
                                </span>
                              </div>
                              <div className="staff-product-dropdown-meta">
                                <strong>{formatPrice(prod.price)}</strong>
                                <span className="staff-product-dropdown-stock">
                                  {totalStock !== null ? `Tồn: ${totalStock}` : "Còn hàng"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="staff-order-add-prod-btn"
                onClick={() => {
                  setShowAddProductSearch(true);
                  setTimeout(() => productInputRef.current?.focus(), 50);
                }}
              >
                <Icon name="plus" className="h-4 w-4" />
                <span>Chọn thêm sản phẩm</span>
              </button>
            )}

            <div className="staff-order-total-bar">
              <span>Tổng thanh toán</span>
              <strong>{formatPrice(orderLinesTotal)}</strong>
            </div>
          </div>
        )}

        <label className="profile-field staff-management-wide">
          <span>Ghi chú đơn hàng</span>
          <textarea
            rows="2"
            value={createNote}
            onChange={(event) => setCreateNote(event.target.value)}
            maxLength="1000"
            placeholder="Ghi chú giao hàng nếu có…"
          />
        </label>

        {error && (
          <div className="staff-form-error staff-management-wide" role="alert">
            <Icon name="alert" className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="staff-management-form-actions staff-management-wide">
          <button className="staff-primary-action" disabled={createBusy || !orderLines.length}>
            {createBusy ? "Đang tạo…" : "Tạo đơn COD"}
          </button>
          <button type="button" className="staff-secondary-action" onClick={() => setCreateOpen(false)}>
            Hủy
          </button>
        </div>
      </form>
    </section>}
    <form className="staff-order-toolbar" onSubmit={(event) => { event.preventDefault(); setAppliedCode(searchCode.trim()); }}>
      <label className="staff-order-search"><input aria-label="Tìm theo mã đơn" type="search" value={searchCode} onChange={(event) => setSearchCode(event.target.value)} placeholder="Nhập mã đơn hàng" /></label>
      <button className="staff-primary-action">Tìm đơn</button>
      {(searchCode || appliedCode) && <button type="button" className="staff-secondary-action" onClick={() => { setSearchCode(""); setAppliedCode(""); }}>Xóa tìm kiếm</button>}
      <div className="staff-order-status-filter-group">
        <label className="staff-order-status-filter" htmlFor="staff-order-status">Trạng thái</label>
        <select id="staff-order-status" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tất cả đơn hàng</option>
          {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
    </form>
    {error && (
      <div className="staff-form-error" role="alert">
        <Icon name="alert" className="h-5 w-5 shrink-0" />
        <span>{error}</span>
      </div>
    )}
    {notice && (
      <div className="staff-form-notice" role="status">
        <Icon name="check" className="h-5 w-5 shrink-0" />
        <span>{notice}</span>
      </div>
    )}
    <div className="staff-order-list">{loading ? <p>Đang tải đơn hàng…</p> : orders.length ? orders.map((order) => <article className="staff-order-card" key={order.id}>
      <div className="staff-order-card-head"><div><h2>{order.orderCode}</h2><span className="staff-order-status">{statusLabels[order.status] || order.status}</span></div><strong>{formatPrice(order.total)}</strong></div>
      <div className="staff-order-meta"><span>{order.customer?.fullName || order.shipping?.recipientName}</span><span>{dateLabel(order.createdAt)}</span><span>COD · {order.paymentStatus === "COLLECTED" ? "Đã thu" : "Chưa thu"}</span></div>
      <div className="staff-order-items">
        {order.items.map((item, idx) => (
          <div className="staff-order-item-line" key={`${item.sku || idx}`}>
            <span>{item.productName}{item.variantName ? ` · ${item.variantName}` : ""}</span>
            <span className="staff-order-item-qty">× {item.quantity}</span>
          </div>
        ))}
      </div>
      <OrderProgress status={order.status} />
      <div className="staff-order-actions">
        <button className="staff-secondary-action" onClick={() => toggleDetails(order.orderCode)}>{openCode === order.orderCode ? "Ẩn chi tiết" : "Chi tiết đơn hàng"}</button>
        {!["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.status) && <button className="staff-secondary-action" onClick={() => cancelOrder(order)} disabled={busyCode === order.orderCode}>Hủy đơn</button>}
        {order.status === "DELIVERED" && order.paymentStatus === "COLLECTED" && <button className="staff-secondary-action" onClick={() => refundOrder(order)} disabled={busyCode === order.orderCode}>Ghi nhận hoàn tiền</button>}
        {["DELIVERED", "CANCELLED"].includes(order.status) && <button className="staff-secondary-action" onClick={() => archiveOrder(order)} disabled={busyCode === order.orderCode}>Xóa đơn</button>}
        {nextStatuses[order.status] && shipmentCode !== order.orderCode && <button className="staff-primary-action" disabled={busyCode === order.orderCode} onClick={() => advance(order)}>{busyCode === order.orderCode ? "Đang lưu…" : nextLabels[order.status]}</button>}
      </div>
      {shipmentCode === order.orderCode && <form className="staff-shipment-form" onSubmit={(event) => { event.preventDefault(); advance(order, { carrier, trackingNumber }); }}>
        <label className="profile-field"><span>Đơn vị vận chuyển</span><input value={carrier} onChange={(event) => setCarrier(event.target.value)} required maxLength={100} /></label>
        <label className="profile-field"><span>Mã vận đơn</span><input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} required maxLength={100} /></label>
        <button className="staff-primary-action" disabled={busyCode === order.orderCode}>{busyCode === order.orderCode ? "Đang lưu…" : "Xác nhận gửi đơn"}</button>
        <button className="staff-secondary-action" type="button" onClick={() => setShipmentCode("")}>Hủy</button>
      </form>}
      {openCode === order.orderCode && (detailLoading ? <p className="staff-order-detail">Đang tải chi tiết…</p> : detail && <div className="staff-order-expanded">
        <div className="staff-order-actions"><button className="staff-secondary-action" onClick={() => beginEditShipping(detail)}>Sửa thông tin giao hàng</button></div>
        {editShipping?.orderCode === order.orderCode && <form className="staff-management-form staff-order-edit-form" onSubmit={saveShipping}>
          {["recipientName", "email", "phone", "addressLine", "ward", "province", "customerNote"].map((key) => <label className="profile-field" key={key}><span>{{ recipientName: "Người nhận", email: "Email", phone: "Số điện thoại", addressLine: "Địa chỉ", ward: "Phường / xã", province: "Tỉnh / thành", customerNote: "Ghi chú" }[key]}</span>{key === "customerNote" ? <textarea rows="2" value={editShipping[key]} onChange={(event) => setEditShipping((current) => ({ ...current, [key]: event.target.value }))} /> : <input type={key === "email" ? "email" : "text"} required={["recipientName", "email", "phone", "addressLine", "province"].includes(key)} value={editShipping[key]} onChange={(event) => setEditShipping((current) => ({ ...current, [key]: event.target.value }))} />}</label>)}
          <fieldset className="staff-order-line-edit staff-management-wide"><legend>Sản phẩm trong đơn</legend>
            {editLines.map((item) => <div className="staff-order-edit-line" key={item.sku}><span>{item.productName} · {item.sku}</span><label>Số lượng<input type="number" min="1" max="20" value={item.quantity} onChange={(event) => setEditLines((lines) => lines.map((line) => line.sku === item.sku ? { ...line, quantity: event.target.value } : line))} /></label><button type="button" className="staff-secondary-action" disabled={editLines.length < 2} onClick={() => setEditLines((lines) => lines.filter((line) => line.sku !== item.sku))}>Bỏ sản phẩm</button></div>)}
            <div className="staff-order-line-builder"><label className="profile-field"><span>Thêm sản phẩm</span><select value={editSelectedSku} onChange={(event) => setEditSelectedSku(event.target.value)}><option value="">Chọn SKU</option>{skuOptions.map((option) => <option key={option.sku} value={option.sku}>{option.label}</option>)}</select></label><button type="button" className="staff-secondary-action" onClick={() => { if (!editSelectedSku) return; const option = skuOptions.find((item) => item.sku === editSelectedSku); setEditLines((lines) => { const existing = lines.find((line) => line.sku === editSelectedSku); return existing ? lines.map((line) => line.sku === editSelectedSku ? { ...line, quantity: Number(line.quantity) + 1 } : line) : [...lines, { sku: editSelectedSku, productName: option?.label || editSelectedSku, quantity: 1 }]; }); }}>Thêm sản phẩm</button></div>
          </fieldset>
          <div className="staff-management-form-actions staff-management-wide"><button className="staff-primary-action" disabled={editBusy}>{editBusy ? "Đang lưu…" : "Lưu thông tin"}</button><button type="button" className="staff-secondary-action" onClick={() => setEditShipping(null)}>Hủy</button></div>
        </form>}
        <StaffOrderDetails order={detail} />
      </div>)}
    </article>) : <p>Chưa có đơn hàng phù hợp.</p>}</div>
  </div></InternalLayout>;
}

function StaffOrderDetails({ order }) {
  const shipping = order.shipping || {};
  const address = [shipping.addressLine, shipping.ward, shipping.district, shipping.province].filter(Boolean).join(", ");

  return (
    <div className="staff-order-detail-card">
      {/* Thông tin giao hàng và Danh sách sản phẩm */}
      <div className="staff-order-detail-grid">
        <div className="staff-order-detail-col">
          <h3 className="staff-order-detail-title">Giao hàng</h3>
          <p className="staff-order-info-text">
            <strong>{shipping.recipientName || "Chưa có tên người nhận"}</strong>
          </p>
          {shipping.phone && <p className="staff-order-info-text">{shipping.phone}</p>}
          {address && <p className="staff-order-info-text">{address}</p>}
          {order.trackingNumber && (
            <p className="staff-order-info-text" style={{ color: "#555" }}>
              {order.carrier ? `${order.carrier} · ` : ""}Mã vận đơn: {order.trackingNumber}
            </p>
          )}
          {order.note && (
            <p className="staff-order-info-text" style={{ color: "#777", fontStyle: "italic", marginTop: "4px" }}>
              Ghi chú: {order.note}
            </p>
          )}
        </div>

        <div className="staff-order-detail-col">
          <h3 className="staff-order-detail-title">Sản phẩm</h3>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {order.items?.map((item) => (
              <div className="staff-order-item-row" key={`${item.sku}-${item.variantName || ""}`}>
                <div>
                  <strong style={{ display: "block" }}>
                    {item.productName}{item.variantName ? ` · ${item.variantName}` : ""}
                  </strong>
                  <span style={{ fontSize: "12px", color: "#666" }}>
                    {item.sku} · Số lượng: {item.quantity}
                  </span>
                </div>
                <span style={{ fontWeight: 500, whiteSpace: "nowrap" }}>
                  {formatPrice(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="staff-order-total-summary">
            <span>Tổng thanh toán COD</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="staff-order-detail-divider" />

      {/* Lịch sử trạng thái và Lịch sử giao dịch */}
      <div className="staff-order-detail-grid">
        <div className="staff-order-detail-col">
          <h3 className="staff-order-detail-title">Lịch sử trạng thái</h3>
          <div className="staff-order-timeline">
            {order.history?.length ? (
              order.history.map((entry, index) => (
                <div className="staff-order-timeline-step" key={`${entry.toStatus}-${index}`}>
                  <div className="staff-order-timeline-dot" />
                  <div className="staff-order-timeline-content">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "13px", color: "#111" }}>
                        {statusLabels[entry.toStatus] || entry.toStatus}
                      </strong>
                      <span style={{ color: "#777", fontSize: "11px" }}>
                        {dateLabel(entry.createdAt)}
                      </span>
                    </div>
                    {entry.note && (
                      <p style={{ margin: "2px 0 0", color: "#555", fontSize: "12px" }}>
                        {entry.note}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, color: "#777", fontSize: "12px" }}>Chưa có lịch sử trạng thái.</p>
            )}
          </div>
        </div>

        <div className="staff-order-detail-col">
          <h3 className="staff-order-detail-title">Lịch sử giao dịch</h3>
          <div className="staff-order-tx-list">
            {order.transactions?.length ? (
              order.transactions.map((entry) => {
                const statusKey = entry.status?.toUpperCase();
                const typeText = transactionTypeLabels[entry.type] || entry.type;
                const statusText = transactionStatusLabels[statusKey] || entry.status;
                return (
                  <div className="staff-order-tx-item" key={entry.id}>
                    <div className="staff-order-tx-top">
                      <div className="staff-order-tx-badges">
                        <span className="staff-tx-type-tag">{typeText}</span>
                        <span className={`staff-tx-status-tag is-${statusKey?.toLowerCase()}`}>
                          {statusText}
                        </span>
                      </div>
                      <strong style={{ fontSize: "13px", color: "#111" }}>
                        {formatPrice(entry.amount)}
                      </strong>
                    </div>
                    <div className="staff-order-tx-bottom">
                      <span>{dateLabel(entry.createdAt)}</span>
                      {entry.note && <span>{entry.note}</span>}
                      {entry.reference && <span>Mã: {entry.reference}</span>}
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ margin: 0, color: "#777", fontSize: "12px" }}>Chưa có giao dịch.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function StaffCustomersPage({ onLogout, isAdmin = false, user }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getStaffCustomers()
      .then((data) => {
        if (active) setCustomers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setError(err.message || "Không thể tải danh sách khách hàng");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const query = search.trim().toLowerCase();
  const filtered = customers.filter((c) => {
    if (!query) return true;
    return (
      (c.customerCode || "").toLowerCase().includes(query) ||
      (c.fullName || "").toLowerCase().includes(query) ||
      (c.email || "").toLowerCase().includes(query) ||
      (c.phone || "").toLowerCase().includes(query) ||
      (c.id || "").toLowerCase().includes(query)
    );
  });

  return (
    <InternalLayout active="customers" isAdmin={isAdmin} user={user} onLogout={onLogout}>
      <header className="internal-page-heading">
        <h1 className="font-display">Khách hàng</h1>
      </header>

      {error && (
        <div className="staff-form-error" role="alert" style={{ margin: "16px 0" }}>
          <Icon name="alert" className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="staff-management-toolbar" style={{ margin: "20px 0 16px" }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm khách hàng theo mã định danh, họ tên, email, số điện thoại…"
        />
      </div>

      {loading ? (
        <p style={{ padding: "32px 0", color: "#666" }}>Đang tải danh sách khách hàng…</p>
      ) : filtered.length === 0 ? (
        <p style={{ padding: "32px 0", color: "#666" }}>Không tìm thấy khách hàng phù hợp.</p>
      ) : (
        <div className="staff-table-scroll">
          <table className="staff-data-table">
            <thead>
              <tr>
                <th>Họ và tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Mã định danh</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="staff-data-row">
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          background: "#111",
                          color: "#fff",
                          display: "grid",
                          placeItems: "center",
                          fontSize: "13px",
                          fontWeight: "600",
                          flexShrink: 0,
                        }}
                      >
                        {(c.fullName || c.email || "K").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ fontSize: "14px", fontWeight: "600", color: "#111", margin: 0 }}>
                          {c.fullName || "Khách hàng"}
                        </strong>
                        <span style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>
                          Tài khoản thành viên
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: "13px", color: "#333" }}>{c.email || "--"}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: "13px", color: "#555" }}>
                      {c.phone || "Chưa thiết lập"}
                    </span>
                  </td>
                  <td>
                    <code
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: "#f4f4f5",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        color: "#18181b",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {c.customerCode || c.id}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </InternalLayout>
  );
}
