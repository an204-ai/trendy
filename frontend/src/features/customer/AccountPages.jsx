import { useEffect, useRef, useState } from "react";
import ProductCard from "../../shared/components/ProductCard.jsx";
import { formatPrice, getProducts } from "../../shared/services/storefront.js";
import Icon from "../../shared/components/Icon.jsx";
import OrderProgress from "../../shared/components/OrderProgress.jsx";
import { dateLabel, statusLabels } from "../../shared/orders/orderPresentation.js";
import { validateEmail, validateName, validatePassword, validatePhone } from "../../shared/utils/validation.js";
import { changePassword } from "../../shared/services/api.js";

export function AccountAuthPage({ mode = "login", onSubmit, onGoogle, busy = false, error = "" }) {
  const isRegister = mode === "register";
  const [formData, setFormData] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (name, val) => {
    if (name === "fullName" && isRegister) return validateName(val, "Họ và tên", 2, 120);
    if (name === "email") return validateEmail(val, true);
    if (name === "phone" && isRegister) return validatePhone(val, false);
    if (name === "password") return validatePassword(val, isRegister);
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

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = {
      email: validate("email", formData.email),
      password: validate("password", formData.password),
      ...(isRegister ? {
        fullName: validate("fullName", formData.fullName),
        phone: validate("phone", formData.phone),
      } : {}),
    };
    const invalidKeys = Object.keys(errors).filter((k) => Boolean(errors[k]));
    if (invalidKeys.length > 0) {
      setTouched({ fullName: true, email: true, phone: true, password: true });
      setFieldErrors(errors);
      return;
    }
    onSubmit(formData);
  };

  return <main className="account-page account-page-auth">
    <div className="account-layout account-auth-layout">
      <svg className="account-shape-defs" aria-hidden="true" focusable="false"><defs><clipPath id="account-image-wave" clipPathUnits="objectBoundingBox"><path d="M0 0 H1 C.96 .12 .84 .25 .83 .38 C.82 .5 .98 .53 .98 .65 C.98 .77 .83 .83 .83 .92 C.82 .98 .9 1 1 1 H0 Z" /></clipPath></defs></svg>
      <aside className="account-visual" aria-hidden="true">
        <img className="account-visual-image" src="/images/login-banner.jpg" alt="" />
      </aside>
      <section className="account-form-panel">
        <div className="account-form-heading"><h1 className="font-display">{isRegister ? "Tạo tài khoản" : "Đăng nhập"}</h1></div>
        <GoogleSignInButton onCredential={onGoogle} busy={busy} />
        <div className="account-divider"><span>hoặc tiếp tục với email</span></div>
        <form className="account-form" onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <Field label="HỌ VÀ TÊN *" error={touched.fullName ? fieldErrors.fullName : ""}>
              <input
                name="fullName"
                required
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                onBlur={() => handleBlur("fullName")}
                className={touched.fullName && fieldErrors.fullName ? "is-invalid" : ""}
                autoComplete="name"
                placeholder="Nguyễn Văn A"
              />
            </Field>
          )}
          <Field label="EMAIL *" error={touched.email ? fieldErrors.email : ""}>
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              className={touched.email && fieldErrors.email ? "is-invalid" : ""}
              autoComplete="email"
              placeholder="email@example.com"
            />
          </Field>
          {isRegister && (
            <Field label="SỐ ĐIỆN THOẠI" error={touched.phone ? fieldErrors.phone : ""}>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                onBlur={() => handleBlur("phone")}
                className={touched.phone && fieldErrors.phone ? "is-invalid" : ""}
                autoComplete="tel"
                placeholder="0912345678 (không bắt buộc)"
              />
            </Field>
          )}
          <Field label="MẬT KHẨU *" error={touched.password ? fieldErrors.password : ""}>
            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              className={touched.password && fieldErrors.password ? "is-invalid" : ""}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? "Ít nhất 8 ký tự" : "Nhập mật khẩu"}
            />
          </Field>
          {error && (
            <div role="alert" className="account-error">
              <Icon name="alert" className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <button disabled={busy} className="account-submit account-auth-submit">{busy ? "ĐANG XỬ LÝ…" : isRegister ? "TẠO TÀI KHOẢN" : "ĐĂNG NHẬP"}</button>
        </form>
        <p className="account-switch">{isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"} <a href={isRegister ? "/account/login" : "/account/register"}>{isRegister ? "Đăng nhập" : "Đăng ký ngay"}</a></p>
        <p className="account-legal">Khi tiếp tục, bạn đồng ý với các điều khoản và chính sách bảo mật của Trendy.</p>
      </section>
    </div>
  </main>;
}

function CustomerAccountTabs({ active, onLogout }) {
  const tabs = [
    ["profile", "Hồ sơ", "/account/profile"],
    ["orders", "Đơn hàng", "/account/orders"],
    ["wishlist", "Yêu thích", "/account/wishlist"],
  ];
  return <div className="customer-account-nav">
    <nav aria-label="Tài khoản" className="customer-account-tabs">
      {tabs.map(([id, label, href]) => <a key={id} className={`customer-account-tab ${active === id ? "is-active" : ""}`} href={href} aria-current={active === id ? "page" : undefined}>{label}</a>)}
    </nav>
    <button className="customer-account-logout" onClick={onLogout} title="Đăng xuất">
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span>Đăng xuất</span>
    </button>
  </div>;
}

export function CustomerProfilePage({ user, onSave, onLogout, onAdd, onWishlist, wishlist = [], loadOrders, openOrder, busy = false, error = "" }) {
  const [saved, setSaved] = useState({ fullName: user?.fullName || "", phone: user?.phone || "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => setSaved({ fullName: user?.fullName || "", phone: user?.phone || "" }), [user]);
  useEffect(() => {
    let active = true;
    setOrdersLoading(true);
    loadOrders().then((rows) => { if (active) setOrders(rows); }).catch((reason) => { if (active) setOrdersError(reason.message); }).finally(() => { if (active) setOrdersLoading(false); });
    return () => { active = false; };
  }, [loadOrders]);

  const validate = (name, val) => {
    if (name === "fullName") return validateName(val, "Họ và tên", 2, 120);
    if (name === "phone") return validatePhone(val, false);
    return "";
  };

  const handleChange = (name, val) => {
    setSaved((prev) => ({ ...prev, [name]: val }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validate(name, val);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validate(name, saved[name]);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errors = {
      fullName: validate("fullName", saved.fullName),
      phone: validate("phone", saved.phone),
    };
    if (errors.fullName || errors.phone) {
      setTouched({ fullName: true, phone: true });
      setFieldErrors(errors);
      return;
    }
    onSave(saved);
  };

  const favoriteProducts = getProducts().filter((product) => wishlist.includes(product.slug));
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "bạn";

  return <main className="customer-account-page">
    <CustomerAccountTabs active="profile" onLogout={onLogout} />
    <header className="customer-account-intro"><h1 className="font-display">Xin chào, {firstName}</h1></header>
    <div className="customer-account-sections">
      <section className="customer-account-section">
        <div className="customer-account-section-heading"><h2>ĐƠN HÀNG GẦN ĐÂY</h2><a href="/account/orders">Xem tất cả</a></div>
        {ordersLoading ? <p className="customer-account-message">Đang tải đơn hàng…</p> : ordersError ? <p className="customer-account-message" role="alert">{ordersError}</p> : orders.length ? <div className="customer-recent-orders">{orders.slice(0, 2).map((order) => <OrderCard key={order.id} order={order} onClick={() => openOrder(order.orderCode)} />)}</div> : <p className="customer-account-message">Bạn chưa có lịch sử đơn hàng.</p>}
      </section>
      <section className="customer-account-section">
        <div className="customer-account-section-heading"><h2>SẢN PHẨM YÊU THÍCH</h2><a href="/account/wishlist">Xem tất cả</a></div>
        {favoriteProducts.length ? <div className="customer-wishlist-preview">{favoriteProducts.slice(0, 4).map((product, index) => <ProductCard key={product.slug} product={product} index={index} onAdd={onAdd} onWishlist={onWishlist} wished />)}</div> : <p className="customer-account-message">Danh sách yêu thích của bạn đang trống.</p>}
      </section>
      <section className="customer-account-section">
        <div className="customer-account-section-heading"><h2>THÔNG TIN KHÁCH HÀNG</h2></div>
        <form className="profile-form customer-profile-form" onSubmit={handleSubmit} noValidate>
          <label className={`profile-field ${touched.fullName && fieldErrors.fullName ? "has-error" : ""}`}>
            <span>HỌ VÀ TÊN *</span>
            <input
              name="fullName"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={saved.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              onBlur={() => handleBlur("fullName")}
              className={touched.fullName && fieldErrors.fullName ? "is-invalid" : ""}
            />
            {touched.fullName && fieldErrors.fullName && (
              <span className="profile-field-error">
                <Icon name="alert" className="h-3.5 w-3.5" />
                {fieldErrors.fullName}
              </span>
            )}
          </label>
          <label className="profile-field">
            <span>EMAIL</span>
            <input type="email" value={user?.email || ""} readOnly />
          </label>
          <label className={`profile-field ${touched.phone && fieldErrors.phone ? "has-error" : ""}`}>
            <span>SỐ ĐIỆN THOẠI</span>
            <input
              name="phone"
              type="tel"
              maxLength={32}
              autoComplete="tel"
              placeholder="0912345678"
              value={saved.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              onBlur={() => handleBlur("phone")}
              className={touched.phone && fieldErrors.phone ? "is-invalid" : ""}
            />
            {touched.phone && fieldErrors.phone && (
              <span className="profile-field-error">
                <Icon name="alert" className="h-3.5 w-3.5" />
                {fieldErrors.phone}
              </span>
            )}
          </label>
          {error && (
            <div role="alert" className="account-error">
              <Icon name="alert" className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          <div className="profile-actions"><button className="account-submit account-profile-submit" disabled={busy}>{busy ? "ĐANG LƯU…" : "LƯU THAY ĐỔI"}</button></div>
        </form>
      </section>
      {!user?.isGoogle && (
        <section className="customer-account-section">
          <div className="customer-account-section-heading"><h2>ĐỔI MẬT KHẨU</h2></div>
          <CustomerChangePasswordForm />
        </section>
      )}
    </div>
  </main>;
}

function CustomerChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp");
      return;
    }
    if (currentPassword === newPassword) {
      setError("Mật khẩu mới không được trùng với mật khẩu hiện tại");
      return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword, newPassword }, false);
      setSuccess("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Không thể đổi mật khẩu");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="profile-form customer-profile-form" onSubmit={handleSubmit} noValidate>
      <label className="profile-field">
        <span>MẬT KHẨU HIỆN TẠI *</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Nhập mật khẩu hiện tại"
        />
      </label>
      <label className="profile-field">
        <span>MẬT KHẨU MỚI *</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Ít nhất 8 ký tự"
        />
      </label>
      <label className="profile-field">
        <span>XÁC NHẬN MẬT KHẨU MỚI *</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu mới"
        />
      </label>
      {error && (
        <div role="alert" className="account-error">
          <Icon name="alert" className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div role="status" className="account-notice">
          <Icon name="check" className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}
      <div className="profile-actions">
        <button className="account-submit account-profile-submit" disabled={busy}>
          {busy ? "ĐANG CẬP NHẬT…" : "CẬP NHẬT MẬT KHẨU"}
        </button>
      </div>
    </form>
  );
}

export function CustomerWishlistPage({ wishlist = [], onWishlist, onAdd, onLogout }) {
  const favoriteProducts = getProducts().filter((product) => wishlist.includes(product.slug));
  return <main className="customer-account-page">
    <CustomerAccountTabs active="wishlist" onLogout={onLogout} />
    <header className="customer-account-page-heading"><h1 className="font-display">Sản phẩm yêu thích</h1></header>
    {favoriteProducts.length ? <div className="customer-wishlist-full">{favoriteProducts.map((product, index) => <ProductCard key={product.slug} product={product} index={index} onAdd={onAdd} onWishlist={onWishlist} wished />)}</div> : <div className="customer-wishlist-empty"><p>Danh sách yêu thích của bạn đang trống.</p><a className="pill-button" href="/store">Khám phá sản phẩm</a></div>}
  </main>;
}

function GoogleSignInButton({ onCredential, busy }) {
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const nonceRef = useRef("");
  const [hasGoogleIframe, setHasGoogleIframe] = useState(false);
  callbackRef.current = onCredential;
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (!clientId) return undefined;
    let cancelled = false;
    let resizeTimer = null;

    const render = () => {
      const identity = window.google?.accounts?.id;
      if (cancelled || !identity || !buttonRef.current) return;

      const container = containerRef.current || buttonRef.current.parentElement;
      const clientWidth = container?.clientWidth || 360;
      // Google Identity Services renderButton width parameter is between 200 and 400 px
      const buttonWidth = Math.min(400, Math.max(200, Math.floor(clientWidth)));

      buttonRef.current.replaceChildren();
      if (!nonceRef.current) nonceRef.current = crypto.randomUUID();

      try {
        identity.initialize({
          client_id: clientId,
          nonce: nonceRef.current,
          callback: (response) => callbackRef.current?.({ credential: response.credential, nonce: nonceRef.current }),
        });

        identity.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "pill",
          text: "continue_with",
          logo_alignment: "left",
          locale: "vi",
          width: buttonWidth,
        });

        setTimeout(() => {
          if (!cancelled && buttonRef.current) {
            const hasIframe = Boolean(buttonRef.current.querySelector("iframe"));
            setHasGoogleIframe(hasIframe);
          }
        }, 400);
      } catch (_) {}
    };

    if (window.google?.accounts?.id) {
      render();
    } else {
      let script = document.querySelector("script[data-google-identity]");
      if (!script) {
        script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = "true";
        document.head.appendChild(script);
      }
      script.addEventListener("load", render);
    }

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!cancelled) render();
      }, 100);
    };

    let observer = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      observer = new ResizeObserver(handleResize);
      observer.observe(containerRef.current);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", handleResize);
      if (observer) observer.disconnect();
    };
  }, [clientId]);

  const handleFallbackClick = () => {
    const identity = window.google?.accounts?.id;
    if (identity) {
      try {
        identity.prompt();
        return;
      } catch (_) {}
    }
    callbackRef.current?.({ credential: "", nonce: "" });
  };

  return (
    <div ref={containerRef} className={`google-signin ${busy ? "is-disabled" : ""}`}>
      {!hasGoogleIframe && (
        <button type="button" onClick={handleFallbackClick} disabled={busy}>
          <GoogleMark />
          <span>Tiếp tục với Google</span>
        </button>
      )}
      <div
        ref={buttonRef}
        className="google-signin-button"
        style={{ display: hasGoogleIframe ? "flex" : "none" }}
      />
      {!clientId && <small>Thêm Google Client ID để bật đăng nhập Google.</small>}
    </div>
  );
}

function GoogleMark() { return <svg aria-hidden="true" viewBox="0 0 48 48" className="h-[18px] w-[18px]"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.1c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.3A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.8 27.8a12 12 0 0 1 0-7.6v-5.3H5.9a20 20 0 0 0 0 18.2l6.9-5.3Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.9 14.9l6.9 5.3C14.4 15.5 18.8 12 24 12Z"/></svg>; }

export function CustomerOrdersPage({ user, onLogout, loadOrders, openOrder }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; loadOrders().then((rows) => { if (active) setOrders(rows); }).catch((reason) => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [loadOrders]);
  return <main className="customer-account-page">
    <CustomerAccountTabs active="orders" onLogout={onLogout} />
    <header className="customer-account-page-heading"><h1 className="font-display">Đơn hàng của tôi</h1></header>
    <div className="customer-order-list">{loading ? <p className="customer-account-message">Đang tải đơn hàng…</p> : error ? <p role="alert" className="customer-account-message">{error}</p> : orders.length === 0 ? <div className="customer-account-message"><p>Bạn chưa có lịch sử đơn hàng.</p><a className="mt-4 inline-block text-xs uppercase underline underline-offset-4" href="/store">Khám phá sản phẩm</a></div> : orders.map((order) => <OrderCard key={order.id} order={order} onClick={() => openOrder(order.orderCode)} />)}</div>
  </main>;
}

export function CustomerOrderDetailPage({ orderCode, loadOrder, onLogout }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; loadOrder(orderCode).then((value) => { if (active) setOrder(value); }).catch((reason) => { if (active) setError(reason.message); }); return () => { active = false; }; }, [loadOrder, orderCode]);
  return <main className="customer-account-page"><CustomerAccountTabs active="orders" onLogout={onLogout} /><div className="customer-order-detail">
    <a className="text-xs uppercase tracking-[.08em] underline underline-offset-4" href="/account/orders">Tất cả đơn hàng</a>
    <h1 className="font-display mt-5 text-4xl md:text-6xl">THEO DÕI ĐƠN</h1>
    {error && <p role="alert" className="mt-6 text-sm text-red-700">{error}</p>}
    {!order && !error ? <p className="mt-8 text-sm">Đang tải thông tin…</p> : order && <><div className="customer-order-detail-summary"><span>Mã đơn · {order.orderCode}</span><span>{statusLabels[order.status] || order.status}</span></div><OrderProgress status={order.status} />
      <div className="mt-9 grid gap-8 md:grid-cols-[1.2fr_.8fr]"><section><h2 className="text-xs uppercase tracking-[.08em]">Sản phẩm</h2><div className="mt-3 grid gap-3">{order.items.map((item) => <div key={`${item.sku}-${item.variantName}`} className="flex justify-between gap-4 py-3 text-sm"><span>{item.productName}{item.variantName && <small className="mt-1 block text-xs text-black">{item.variantName}</small>}<small className="mt-1 block text-[10px] text-black">SKU · {item.sku} · SL {item.quantity}</small></span><span>{formatPrice(item.lineTotal)}</span></div>)}</div><div className="mt-5 space-y-2 border-t border-black/10 pt-4 text-sm"><div className="flex justify-between text-neutral-600"><span>Tạm tính</span><span>{formatPrice(order.subtotal)}</span></div>{order.discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Khuyến mãi {order.promotionCode ? `(${order.promotionCode})` : ""}</span><span>−{formatPrice(order.discountAmount)}</span></div>}<div className="flex justify-between pt-1 font-medium text-black"><span>Thanh toán COD</span><strong>{formatPrice(order.total)}</strong></div></div></section>
        <section><h2 className="text-xs uppercase tracking-[.08em]">Giao hàng</h2><p className="mt-4 text-sm leading-6">{order.shipping.recipientName}<br />{order.shipping.phone}<br />{order.shipping.addressLine}{order.shipping.ward ? `, ${order.shipping.ward}` : ""}{order.shipping.district ? `, ${order.shipping.district}` : ""}<br />{order.shipping.province}</p>{order.trackingNumber ? <p className="mt-5 text-sm">{order.carrier || "Vận chuyển"} · Mã vận đơn <strong>{order.trackingNumber}</strong></p> : <p className="mt-5 text-xs text-black">Mã vận đơn sẽ hiển thị sau khi đơn được gửi đi.</p>}</section>
      </div><section className="mt-10"><h2 className="text-xs uppercase tracking-[.08em]">Lịch sử đơn hàng</h2><ol className="mt-4 space-y-3">{order.history.map((item, index) => <li key={`${item.toStatus}-${index}`} className="flex gap-4 text-sm"><span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-black" /><span>{statusLabels[item.toStatus] || item.toStatus}<small className="mt-1 block text-xs text-black">{dateLabel(item.createdAt)}{item.note ? ` · ${item.note}` : ""}</small></span></li>)}</ol></section></>}
  </div></main>;
}

function OrderCard({ order, onClick }) {
  return <article className="customer-order-card">
    <button onClick={onClick} aria-label={`Xem đơn hàng ${order.orderCode}`} className="customer-order-summary">
      <span><b className="text-sm font-medium">{order.orderCode}</b><small className="mt-1 block text-xs text-black">{dateLabel(order.createdAt)} · {order.items.length} sản phẩm</small></span>
      <span className="text-xs">{statusLabels[order.status] || order.status}</span>
      <strong className="text-sm font-normal tabular-nums">{formatPrice(order.total)}</strong>
    </button>
    <OrderProgress status={order.status} />
  </article>;
}

function Field({ label, children, error }) {
  return (
    <label className={`account-field ${error ? "has-error" : ""}`}>
      <span>{label}</span>
      {children}
      {error && (
        <span className="profile-field-error">
          <Icon name="alert" className="h-3.5 w-3.5" />
          {error}
        </span>
      )}
    </label>
  );
}
