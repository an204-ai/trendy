import { useCallback, useEffect, useMemo, useState } from "react";
import SiteFooter from "./shared/components/SiteFooter.jsx";
import SiteHeader from "./shared/components/SiteHeader.jsx";
import Icon from "./shared/components/Icon.jsx";
import { CartPage, CheckoutPage, CompletePage } from "./features/customer/CartPages.jsx";
import HomePage from "./features/storefront/HomePage.jsx";
import InfoPage from "./features/storefront/InfoPage.jsx";
import ProductPage from "./features/storefront/ProductPage.jsx";
import StorePage from "./features/storefront/StorePage.jsx";
import StoresPage from "./features/storefront/StoresPage.jsx";
import { NotFound, StoriesPage, StoryDetailPage } from "./features/storefront/StoriesPage.jsx";
import { getProduct, getProductMenuCategory, getProductVariant, getStorefrontContent, getStory, refreshCatalog } from "./shared/services/storefront.js";
import { AccountAuthPage, CustomerOrderDetailPage, CustomerOrdersPage, CustomerProfilePage, CustomerWishlistPage } from "./features/customer/AccountPages.jsx";
import { AdminOverviewPage } from "./features/admin/AdminOverviewPage.jsx";
import { AdminStaffPage } from "./features/admin/AdminStaffPage.jsx";
import { StaffCustomersPage, StaffLoginPage, StaffOrdersPage } from "./features/staff/StaffPages.jsx";
import { StaffCategoriesPage, StaffProductsPage, StaffPromotionsPage } from "./features/staff/StaffCatalogPages.jsx";
import { StaffChatPage } from "./features/staff/StaffChatPage.jsx";
import CustomerChatWidget from "./features/customer/CustomerChatWidget.jsx";
import { createStaffUser, getMyOrder, getMyOrders, getStaffOrder, getStaffOrders, login, loginStaff, loginWithGoogle, logout, logoutStaff, placeCodOrder, register, restoreSessions, updateMyProfile, updateStaffOrder } from "./shared/services/api.js";
import { updatePageSeo } from "./shared/utils/seo.js";

const loadLocal = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const currentRoute = () => {
  if (window.location.hash.startsWith("#/")) {
    window.history.replaceState(null, "", window.location.hash.slice(1));
  }
  return decodeURIComponent(`${window.location.pathname}${window.location.search}` || "/");
};
const pageTitles = getStorefrontContent().pageTitles;

const normalizeCart = (storedItems) => {
  const normalized = [];
  for (const item of Array.isArray(storedItems) ? storedItems : []) {
    const product = getProduct(item.slug);
    if (!product) continue;
    const variant = product.variants?.find((option) => option.sku === item.sku || option.name === item.variant);
    const line = { slug: product.slug, sku: variant?.sku || product.sku, ...(variant?.name ? { variant: variant.name } : {}), qty: Math.max(1, Number(item.qty) || 1) };
    const existing = normalized.find((entry) => entry.slug === line.slug && entry.sku === line.sku);
    if (existing) existing.qty += line.qty;
    else normalized.push(line);
  }
  return normalized;
};
const sameCartLine = (item, target) => item.slug === target.slug && (item.sku || getProduct(item.slug)?.sku) === (target.sku || getProduct(target.slug)?.sku);

export default function App() {
  const [route, setRoute] = useState(currentRoute);
  const [cart, setCart] = useState(() => normalizeCart(loadLocal("gm-cart", [])));
  const [wishlist, setWishlist] = useState(() => loadLocal("gm-wishlist", []));
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [zoomImage, setZoomImage] = useState("");
  const [customerUser, setCustomerUser] = useState(null);
  const [staffUser, setStaffUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [catalogVersion, setCatalogVersion] = useState(0);
  const routePath = route.split("?")[0] || "/";
  const isInternalRoute = routePath === "/admin" || routePath.startsWith("/admin/") || routePath === "/staff" || routePath.startsWith("/staff/");
  const query = useMemo(() => new URLSearchParams(route.split("?")[1] || ""), [route]);
  const cartCount = cart.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const navigate = useCallback((path) => {
    if (currentRoute() === path) return;
    window.history.pushState(null, "", path);
    setRoute(path);
    setSelectedVariant("");
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let active = true;
    restoreSessions()
      .then(({ customer, staff }) => {
        if (active) {
          setCustomerUser(customer);
          setStaffUser(staff);
        }
      })
      .catch(() => {
        if (active) {
          setCustomerUser(null);
          setStaffUser(null);
        }
      })
      .finally(() => {
        if (active) setAuthReady(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const syncCatalog = () => {
      refreshCatalog().then(() => { if (active) setCatalogVersion((version) => version + 1); }).catch(() => {});
    };
    syncCatalog();
    const handleStorage = (event) => {
      if (event.key === "trendy_catalog_ts") syncCatalog();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") syncCatalog();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", syncCatalog);
    window.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", syncCatalog);
      window.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const handleCatalogChanged = useCallback(async () => {
    await refreshCatalog();
    setCatalogVersion((version) => version + 1);
    try { localStorage.setItem("trendy_catalog_ts", Date.now().toString()); } catch {}
  }, []);

  useEffect(() => {
    const updateRoute = () => {
      setRoute(currentRoute());
      setSelectedVariant("");
      setTimeout(() => window.scrollTo(0, 0), 0);
    };
    const handleInternalLink = (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest?.("a[href]");
      if (!anchor || anchor.target || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin || destination.hash) return;
      event.preventDefault();
      const nextRoute = `${destination.pathname}${destination.search}`;
      if (nextRoute === currentRoute()) return;
      window.history.pushState(null, "", nextRoute);
      updateRoute();
    };
    window.addEventListener("popstate", updateRoute);
    document.addEventListener("click", handleInternalLink);
    return () => {
      window.removeEventListener("popstate", updateRoute);
      document.removeEventListener("click", handleInternalLink);
    };
  }, []);

  useEffect(() => { localStorage.setItem("gm-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("gm-wishlist", JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const close = (event) => { if (event.key === "Escape") setZoomImage(""); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  useEffect(() => {
    let title = pageTitles.home;
    let description = "Khám phá các thiết kế kính cận, kính thời trang và tròng kính cao cấp tại Mắt Kính Trendy. Trải nghiệm không gian đo mắt chuyên sâu tại TP. Hồ Chí Minh.";
    let image = "/images/og-banner.jpg";
    let type = "website";
    let jsonLd = null;

    if (routePath === "/") {
      title = "Trang chủ";
    } else if (routePath === "/store") {
      const subCat = getProductMenuCategory(query.get("subCategory"));
      const catKey = query.get("category");
      title = subCat?.label || subCat?.title || pageTitles.store[catKey] || pageTitles.store.All;
      description = catKey === "kinh-can"
        ? "Bộ sưu tập kính cận cao cấp, gọng acetate và kim loại thanh lịch tại Mắt Kính Trendy."
        : catKey === "kinh-thoi-trang"
          ? "Bộ sưu tập kính thời trang, kính râm chống tia UV với sắc độ đặc trưng."
          : "Khám phá toàn bộ các mẫu kính cận và kính thời trang cao cấp tại Mắt Kính Trendy.";
    } else if (routePath === "/stores") {
      title = pageTitles.stores;
      description = "Ghé thăm cửa hàng Mắt Kính Trendy tại 37 Nguyễn Gia Trí, Bình Thạnh, TP. Hồ Chí Minh để trải nghiệm đo mắt chuyên sâu và thử kính trực tiếp.";
      image = "/images/storefront-trendy.jpg";
    } else if (routePath === "/stories") {
      title = pageTitles.stories;
      description = "Khám phá câu chuyện về chất liệu, sắc màu và nghệ thuật chế tác kính mắt thủ công tại Mắt Kính Trendy.";
      image = "/images/stories/materials-hero.jpg";
    } else if (routePath.startsWith("/stories/")) {
      const story = getStory(routePath.split("/")[2]);
      title = story?.title || pageTitles.stories;
      description = story?.intro || "Chất liệu và nghệ thuật chế tác tại Mắt Kính Trendy.";
      image = story?.hero || story?.cardImage || "/images/og-banner.jpg";
      type = "article";
    } else if (routePath.startsWith("/product/")) {
      const product = getProduct(routePath.split("/")[2]);
      if (product) {
        title = product.name;
        description = (product.description || "").split("\n")[0] || `${product.name} — Thiết kế kính mắt cao cấp tại Mắt Kính Trendy.`;
        image = product.front || product.image || (product.images && product.images[0]?.url) || "/images/og-banner.jpg";
        type = "product";
        jsonLd = {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          image: image.startsWith("http") ? image : `https://trendyeye.vn${image.startsWith("/") ? "" : "/"}${image}`,
          description: product.description || product.name,
          sku: product.sku,
          brand: {
            "@type": "Brand",
            name: "Gentle Monster",
          },
          offers: {
            "@type": "Offer",
            url: `https://trendyeye.vn/product/${product.slug}`,
            priceCurrency: "VND",
            price: product.price,
            availability: "https://schema.org/InStock",
            itemCondition: "https://schema.org/NewCondition",
          },
        };
      } else {
        title = pageTitles.product;
      }
    } else if (routePath === "/cart") {
      title = pageTitles.cart;
      description = "Túi hàng của bạn tại Mắt Kính Trendy.";
    } else if (routePath === "/checkout") {
      title = pageTitles.checkout;
      description = "Thanh toán an toàn đơn hàng kính mắt tại Mắt Kính Trendy.";
    } else if (routePath === "/legal") {
      title = pageTitles.legal;
      description = "Thông tin pháp lý và điều khoản mua sắm tại Mắt Kính Trendy.";
    } else if (routePath === "/privacy") {
      title = pageTitles.privacy;
      description = "Chính sách bảo mật thông tin khách hàng tại Mắt Kính Trendy.";
    } else if (routePath === "/order-complete") {
      title = pageTitles.complete;
    } else if (routePath.startsWith("/account")) {
      title = routePath.includes("register") ? "Đăng ký" : routePath.includes("login") ? "Đăng nhập" : routePath.includes("wishlist") ? "Yêu thích" : routePath.includes("profile") ? "Hồ sơ" : "Đơn hàng";
    } else if (routePath === "/admin") {
      title = "Tổng quan";
    } else if (routePath === "/admin/staff") {
      title = "Nhân viên";
    } else if (routePath.startsWith("/staff")) {
      title = routePath === "/staff/login" ? "Đăng nhập nội bộ" : ({ "/staff/orders": "Đơn hàng", "/staff/products": "Sản phẩm", "/staff/categories": "Danh mục", "/staff/promotions": "Khuyến mãi", "/staff/customers": "Khách hàng", "/staff/chat": "Chăm sóc khách hàng" }[routePath] || "Khu vực nội bộ");
    }

    updatePageSeo({
      title,
      description,
      image,
      url: route,
      type,
      jsonLd,
    });
  }, [routePath, query, catalogVersion]);

  const addToCart = (product, variantSku, quantity = 1) => {
    const selectedVariant = getProductVariant(product, variantSku);
    const targetLine = { slug: product.slug, sku: selectedVariant?.sku || product.sku, ...(selectedVariant?.name ? { variant: selectedVariant.name } : {}) };
    const addQty = Math.max(1, Number(quantity) || 1);
    setCart((items) => {
      const existing = items.find((item) => sameCartLine(item, targetLine));
      return existing
        ? items.map((item) => item === existing ? { ...item, qty: item.qty + addQty } : item)
        : [...items, { ...targetLine, qty: addQty }];
    });
    setToast(`${product.name} đã được thêm vào túi hàng`);
  };

  const changeQuantity = (target, delta) => setCart((items) => items
    .map((item) => sameCartLine(item, target) ? { ...item, qty: item.qty + delta } : item)
    .filter((item) => item.qty > 0));

  const removeFromCart = (target) => setCart((items) => items.filter((item) => !sameCartLine(item, target)));

  const toggleWishlist = (slug) => {
    const hasItem = wishlist.includes(slug);
    setWishlist((items) => hasItem ? items.filter((item) => item !== slug) : [...items, slug]);
    setToast(hasItem ? "Đã bỏ sản phẩm khỏi mục yêu thích" : "Đã lưu vào mục yêu thích");
  };

  const submitAuth = async (values) => {
    setAuthBusy(true); setAuthError("");
    try {
      const user = routePath.endsWith("register")
        ? await register({ email: values.email, password: values.password, fullName: values.fullName, phone: values.phone })
        : await login(values.email, values.password);
      setCustomerUser(user);
      const next = query.get("next");
      navigate(next?.startsWith("/") ? next : "/account/profile");
    } catch (error) { setAuthError(error.message); }
    finally { setAuthBusy(false); }
  };

  const submitStaffAuth = async (values) => {
    setAuthBusy(true); setAuthError("");
    try {
      const user = await loginStaff(values.email, values.password);
      setStaffUser(user);
      navigate(user.role === "ADMIN" ? "/admin" : "/staff/orders");
    } catch (error) { setAuthError(error.message); }
    finally { setAuthBusy(false); }
  };

  const submitGoogleAuth = async ({ credential, nonce } = {}) => {
    if (!credential) {
      setAuthError(import.meta.env.VITE_GOOGLE_CLIENT_ID ? "Không nhận được thông tin xác thực từ Google. Vui lòng thử lại." : "Đăng nhập Google chưa được cấu hình. Hãy thêm Google Client ID vào VITE_GOOGLE_CLIENT_ID và GOOGLE_CLIENT_ID.");
      return;
    }
    setAuthBusy(true); setAuthError("");
    try {
      const user = await loginWithGoogle(credential, nonce);
      setCustomerUser(user);
      const next = query.get("next");
      navigate(next?.startsWith("/") ? next : "/account/profile");
    } catch (error) { setAuthError(error.message); }
    finally { setAuthBusy(false); }
  };

  const saveProfile = async (values) => {
    setAuthBusy(true); setAuthError("");
    try {
      const user = await updateMyProfile(values);
      setCustomerUser(user);
      setToast("Hồ sơ của bạn đã được cập nhật");
    } catch (error) { setAuthError(error.message); }
    finally { setAuthBusy(false); }
  };

  const submitOrder = async (values) => {
    if (!customerUser) { navigate("/account/login?next=%2Fcheckout"); return; }
    setCheckoutBusy(true); setCheckoutError("");
    try {
      const order = await placeCodOrder({
        items: cart.map((item) => ({ sku: item.sku || getProduct(item.slug)?.sku, quantity: item.qty })),
        shipping: { recipientName: values.recipientName, email: values.email, phone: values.phone, addressLine: values.addressLine, ward: values.ward, district: values.district || undefined, province: values.province },
        note: values.note,
        promotionCode: values.promotionCode || undefined,
      }, crypto.randomUUID());
      setCart([]);
      navigate(`/account/orders/${encodeURIComponent(order.orderCode)}`);
    } catch (error) { setCheckoutError(error.message); }
    finally { setCheckoutBusy(false); }
  };

  const signOutCustomer = async () => {
    try { await logout(); } catch {}
    setCustomerUser(null);
    setToast("Đã đăng xuất tài khoản");
    navigate("/account/login");
  };

  const signOutStaff = async () => {
    try { await logoutStaff(); } catch {}
    setStaffUser(null);
    setToast("Đã đăng xuất nội bộ");
    navigate("/staff/login");
  };

  let page;
  if (routePath === "/") page = <HomePage key={`home-${catalogVersion}`} catalogVersion={catalogVersion} onWishlist={toggleWishlist} wishlist={wishlist} />;
  else if (routePath === "/store") page = <StorePage key={`store-${catalogVersion}`} catalogVersion={catalogVersion} category={query.get("category") || "All"} subCategory={query.get("subCategory")} onAdd={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />;
  else if (routePath === "/stores") page = <StoresPage />;
  else if (routePath === "/stories") page = <StoriesPage />;
  else if (routePath.startsWith("/stories/")) page = <StoryDetailPage key={`story-${routePath}-${catalogVersion}`} slug={routePath.split("/")[2]} onAdd={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} />;
  else if (routePath.startsWith("/product/")) page = <ProductPage slug={routePath.split("/")[2]} onAdd={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} selectedVariant={selectedVariant} setSelectedVariant={setSelectedVariant} onZoom={setZoomImage} />;
  else if (routePath === "/cart") page = <CartPage cart={cart} onQuantity={changeQuantity} onRemove={removeFromCart} />;
  else if (routePath === "/checkout") page = authReady ? <CheckoutPage cart={cart} user={customerUser} onSubmit={submitOrder} busy={checkoutBusy} error={checkoutError} /> : <main className="grid min-h-[70vh] place-items-center pt-24 text-sm">Đang kiểm tra phiên đăng nhập…</main>;
  else if (routePath === "/account/login" || routePath === "/account/register") page = <AccountAuthPage mode={routePath.endsWith("register") ? "register" : "login"} onSubmit={submitAuth} onGoogle={submitGoogleAuth} busy={authBusy} error={authError} />;
  else if (routePath === "/account/profile") page = !authReady ? <AuthLoadingPage /> : customerUser ? <CustomerProfilePage user={customerUser} onSave={saveProfile} onLogout={signOutCustomer} onAdd={addToCart} onWishlist={toggleWishlist} wishlist={wishlist} loadOrders={getMyOrders} openOrder={(code) => navigate(`/account/orders/${encodeURIComponent(code)}`)} busy={authBusy} error={authError} /> : <AccountAuthPage mode="login" onSubmit={submitAuth} onGoogle={submitGoogleAuth} busy={authBusy} error={authError} />;
  else if (routePath === "/account/orders") page = !authReady ? <AuthLoadingPage /> : customerUser ? <CustomerOrdersPage user={customerUser} onLogout={signOutCustomer} loadOrders={getMyOrders} openOrder={(code) => navigate(`/account/orders/${encodeURIComponent(code)}`)} /> : <AccountAuthPage mode="login" onSubmit={submitAuth} onGoogle={submitGoogleAuth} busy={authBusy} error={""} />;
  else if (routePath === "/account/wishlist") page = !authReady ? <AuthLoadingPage /> : customerUser ? <CustomerWishlistPage wishlist={wishlist} onWishlist={toggleWishlist} onAdd={addToCart} onLogout={signOutCustomer} /> : <AccountAuthPage mode="login" onSubmit={submitAuth} onGoogle={submitGoogleAuth} busy={authBusy} error={""} />;
  else if (routePath.startsWith("/account/orders/")) page = !authReady ? <AuthLoadingPage /> : customerUser ? <CustomerOrderDetailPage orderCode={decodeURIComponent(routePath.split("/")[3] || "")} loadOrder={getMyOrder} onLogout={signOutCustomer} /> : <AccountAuthPage mode="login" onSubmit={submitAuth} onGoogle={submitGoogleAuth} busy={authBusy} error={""} />;
  else if (routePath === "/staff/login") page = !authReady ? <AuthLoadingPage /> : <StaffLoginPage onSubmit={submitStaffAuth} onLogout={signOutStaff} busy={authBusy} error={authError} user={staffUser} />;
  else if (routePath === "/staff/orders") page = !authReady ? <AuthLoadingPage /> : staffUser && ["STAFF", "ADMIN"].includes(staffUser.role) ? <StaffOrdersPage loadOrders={getStaffOrders} loadOrder={getStaffOrder} saveOrder={updateStaffOrder} onLogout={signOutStaff} isAdmin={staffUser.role === "ADMIN"} user={staffUser} /> : <StaffLoginPage onSubmit={submitStaffAuth} onLogout={signOutStaff} busy={authBusy} error={staffUser ? "Tài khoản này không có quyền vào khu vực nội bộ." : authError} user={staffUser} />;
  else if (["/staff/products", "/staff/categories", "/staff/promotions", "/staff/chat", "/staff/customers"].includes(routePath)) {
    const internalUser = staffUser && ["STAFF", "ADMIN"].includes(staffUser.role) ? staffUser : null;
    const internalProps = { user: internalUser, onLogout: signOutStaff, isAdmin: internalUser?.role === "ADMIN" };
    page = !authReady ? <AuthLoadingPage /> : internalUser
      ? routePath === "/staff/products" ? <StaffProductsPage {...internalProps} onCatalogChanged={handleCatalogChanged} />
        : routePath === "/staff/categories" ? <StaffCategoriesPage {...internalProps} onCatalogChanged={handleCatalogChanged} />
          : routePath === "/staff/promotions" ? <StaffPromotionsPage {...internalProps} />
            : routePath === "/staff/customers" ? <StaffCustomersPage {...internalProps} />
              : <StaffChatPage {...internalProps} />
      : <StaffLoginPage onSubmit={submitStaffAuth} onLogout={signOutStaff} busy={authBusy} error={staffUser ? "Tài khoản này không có quyền vào khu vực nội bộ." : authError} user={staffUser} />;
  }
  else if (routePath === "/admin") page = !authReady ? <AuthLoadingPage /> : staffUser?.role === "ADMIN" ? <AdminOverviewPage user={staffUser} onLogout={signOutStaff} loadOrders={getStaffOrders} /> : <StaffLoginPage onSubmit={submitStaffAuth} onLogout={signOutStaff} busy={authBusy} error={staffUser ? "Chỉ tài khoản admin được vào khu vực này." : "Đăng nhập bằng tài khoản admin để tiếp tục."} user={staffUser} />;
  else if (routePath === "/admin/staff") page = !authReady ? <AuthLoadingPage /> : staffUser?.role === "ADMIN" ? <AdminStaffPage user={staffUser} onLogout={signOutStaff} onCreateStaff={async (values) => (await createStaffUser(values)).user} /> : <StaffLoginPage onSubmit={submitStaffAuth} onLogout={signOutStaff} busy={authBusy} error={staffUser ? "Chỉ tài khoản admin được tạo nhân viên." : "Đăng nhập bằng tài khoản admin để tiếp tục."} user={staffUser} />;
  else if (routePath === "/order-complete") page = <CompletePage />;
  else if (routePath === "/legal" || routePath === "/privacy") page = <InfoPage initialTab={routePath === "/privacy" ? "privacy" : "legal"} />;
  else page = <NotFound />;

  const showStoreChrome = !isInternalRoute;

  return <>
    {showStoreChrome && <SiteHeader route={routePath} cartCount={cartCount} search={search} setSearch={setSearch} onAccount={() => navigate(customerUser ? "/account/profile" : "/account/login")} />}
    {page}
    {showStoreChrome && <CustomerChatWidget user={customerUser} />}
    {showStoreChrome && <SiteFooter onSubscribe={() => setToast("Cảm ơn bạn đã đăng ký nhận tin")} />}
    {toast && <div className="toast" role="status">{toast}</div>}
    {zoomImage && <div className="zoom-modal" role="dialog" aria-modal="true" onClick={() => setZoomImage("")}><button className="absolute right-5 top-5 text-white" aria-label="Đóng hình"><Icon name="close" className="h-7 w-7" /></button><img src={zoomImage} alt="Hình sản phẩm được phóng to" /></div>}
  </>;
}

function AuthLoadingPage() { return <main className="grid min-h-[70vh] place-items-center pt-24 text-sm">Đang kiểm tra phiên đăng nhập…</main>; }
