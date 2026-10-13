import { useState, useRef, useEffect } from "react";
import Icon from "../../shared/components/Icon.jsx";
import { formatPrice, getProduct, getProductPrice, getProductVariant } from "../../shared/services/storefront.js";
import { checkPromotionCode } from "../../shared/services/api.js";
import { validateAddress, validateEmail, validateName, validatePhone } from "../../shared/utils/validation.js";
import { filterProvinces, filterWards } from "../../shared/content/vietnamLocations.js";

function EmptyBag() {
  return <div className="grid min-h-80 place-items-center border-t border-black/10 text-center"><div><Icon name="bag" className="mx-auto h-10 w-10" /><p className="my-5 text-[10px] uppercase tracking-[.1em]">Túi hàng của bạn đang trống</p><a className="rounded-full bg-black px-6 py-3 text-[10px] uppercase tracking-[.08em] text-white" href="/store">Khám phá sản phẩm</a></div></div>;
}

export function CartPage({ cart, onQuantity, onRemove }) {
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + getProductPrice(getProduct(item.slug), item.sku) * item.qty, 0);
  return <main className="px-5 pb-20 pt-[110px] md:px-[4.2vw] md:pt-[125px]">
    <div className="mb-7 flex items-center gap-2 text-[9px] uppercase tracking-[.08em] text-black"><a href="/">Trang chủ</a><span>/</span><span>Túi hàng</span></div>
    <h1 className="font-display mb-8 text-4xl md:text-5xl">TÚI HÀNG <span className="font-sans text-base">({count})</span></h1>
    {!cart.length ? <EmptyBag /> : <div className="grid gap-8 lg:grid-cols-[1.4fr_.6fr] lg:gap-14">
      <section className="border-t border-black/10">{cart.map((item) => {
        const product = getProduct(item.slug);
        const variant = getProductVariant(product, item.sku);
        return <article className="grid grid-cols-[88px_1fr_auto] gap-3 border-b border-black/10 py-4 sm:grid-cols-[140px_1fr_auto_auto] sm:gap-5" key={item.sku || `${item.slug}-${item.variant || product.sku}`}>
          <a className="row-span-2 aspect-[.83] bg-neutral-100 sm:row-span-1" href={`/product/${product.slug}`}><img className="h-full w-full object-contain mix-blend-multiply" src={variant?.image || product.front || product.image} alt={product.name} /></a>
          <div className="min-w-0 self-center"><a href={`/product/${product.slug}`}><h2 className="font-display text-lg md:text-xl">{product.name}</h2></a>{variant?.name && <span className="mt-2 block text-xs text-black">{variant.name}</span>}<span className="mt-1 block text-[10px]">SKU · {item.sku || product.sku}</span><button className="mt-3 block text-[9px] uppercase tracking-[.08em] underline underline-offset-4" onClick={() => onRemove(item)}>Xóa</button></div>
          <div className="flex h-9 items-center self-center rounded-full border border-black/15"><button className="grid h-9 w-9 place-items-center" onClick={() => onQuantity(item, -1)} aria-label="Giảm số lượng">−</button><span className="min-w-5 text-center text-xs tabular-nums">{item.qty}</span><button className="grid h-9 w-9 place-items-center" onClick={() => onQuantity(item, 1)} aria-label="Tăng số lượng">+</button></div>
          <b className="self-start text-xs font-normal tabular-nums sm:self-center">{formatPrice(getProductPrice(product, item.sku) * item.qty)}</b>
        </article>;
      })}<a className="mt-5 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.08em]" href="/store">Tiếp tục mua sắm</a></section>
      <aside className="h-fit border border-black/10 p-5 md:p-6"><p className="mb-6 text-[10px] uppercase tracking-[.12em]">Tóm tắt đơn hàng</p><div className="flex justify-between border-b border-black/10 pb-4 text-xs"><span>Tạm tính</span><b className="font-medium tabular-nums">{formatPrice(total)}</b></div><div className="flex justify-between py-4 text-xs"><span>Giao hàng</span><span>Miễn phí</span></div><div className="flex justify-between border-t border-black/10 pt-4 text-sm"><span>Tổng cộng</span><b className="font-medium tabular-nums">{formatPrice(total)}</b></div><p className="my-4 text-[10px] leading-5 text-black">Thuế và phí nhập khẩu đã được bao gồm trong giá.</p><a className="flex min-h-12 items-center justify-center rounded-full bg-black px-4 text-center text-[10px] uppercase tracking-[.07em] text-white" href="/checkout">Tiến hành thanh toán</a><p className="mt-4 text-center text-[9px] uppercase tracking-[.07em] text-black">Thanh toán bảo mật · Miễn phí giao hàng</p></aside>
    </div>}
  </main>;
}

export function CheckoutPage({ cart, onSubmit, user, busy = false, error = "" }) {
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);

  const [formData, setFormData] = useState({
    recipientName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    addressLine: "",
    ward: "",
    province: "",
    note: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, val) => {
    if (name === "recipientName") return validateName(val, "Họ và tên người nhận", 2, 120);
    if (name === "email") return validateEmail(val, true);
    if (name === "phone") return validatePhone(val, true);
    if (name === "addressLine") return validateAddress(val, "Địa chỉ nhận hàng", 5);
    if (name === "province") return validateName(val, "Tỉnh / Thành phố", 2, 120);
    return "";
  };

  const handleFieldChange = (name, val) => {
    setFormData((prev) => ({ ...prev, [name]: val }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, val);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleFieldBlur = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, formData[name]);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSelectProvince = (prov) => {
    const provName = typeof prov === "object" ? prov.province || prov.ward : prov;
    setFormData((prev) => ({
      ...prev,
      province: provName,
      ward: "",
    }));
    setTouched((prev) => ({ ...prev, province: true }));
    setFieldErrors((prev) => ({ ...prev, province: "" }));
  };

  const handleSelectWard = (item) => {
    const wardName = typeof item === "object" ? item.ward : item;
    const provName = typeof item === "object" ? item.province : null;
    setFormData((prev) => ({
      ...prev,
      ward: wardName,
      province: prev.province || provName || prev.province,
    }));
    setTouched((prev) => ({
      ...prev,
      ward: true,
      ...(provName && !prev.province ? { province: true } : {}),
    }));
    if (provName) {
      setFieldErrors((prev) => ({ ...prev, province: "" }));
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + getProductPrice(getProduct(item.slug), item.sku) * item.qty, 0);
  const discountAmount = appliedPromo ? Math.min(appliedPromo.discountAmount, subtotal) : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleApplyPromo = async (event) => {
    event?.preventDefault();
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError("Vui lòng nhập mã khuyến mãi");
      return;
    }
    setPromoBusy(true);
    setPromoError("");
    try {
      const res = await checkPromotionCode(code, subtotal);
      setAppliedPromo(res);
      setPromoError("");
    } catch (err) {
      setPromoError(err.message || "Mã khuyến mãi không hợp lệ");
      setAppliedPromo(null);
    } finally {
      setPromoBusy(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    setPromoError("");
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();
    const errors = {
      recipientName: validateField("recipientName", formData.recipientName),
      email: validateField("email", formData.email),
      phone: validateField("phone", formData.phone),
      addressLine: validateField("addressLine", formData.addressLine),
      province: validateField("province", formData.province),
    };
    const invalidKeys = Object.keys(errors).filter((k) => Boolean(errors[k]));
    if (invalidKeys.length > 0) {
      setTouched({
        recipientName: true,
        email: true,
        phone: true,
        addressLine: true,
        province: true,
      });
      setFieldErrors(errors);
      return;
    }
    const values = { ...formData };
    if (appliedPromo?.code) {
      values.promotionCode = appliedPromo.code;
    }
    onSubmit(values);
  };

  if (!cart.length) return <main className="px-5 pb-20 pt-[115px] md:px-[4.2vw] md:pt-[125px]"><h1 className="font-display text-4xl">THANH TOÁN</h1><div className="mt-7 flex min-h-64 items-center justify-between border-t border-black/10"><span>Túi hàng đang trống.</span><a className="pill-button" href="/store">Tiếp tục mua sắm</a></div></main>;
  if (!user) return <main className="grid min-h-[70vh] place-items-center px-5 pt-24 text-center"><div className="max-w-2xl"><h1 className="font-display text-2xl sm:text-3xl md:text-4xl whitespace-nowrap tracking-wide">ĐĂNG NHẬP ĐỂ ĐẶT HÀNG</h1><a className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-black px-8 text-xs uppercase tracking-[.08em] text-white" href="/account/login?next=%2Fcheckout">Đăng nhập</a><p className="mt-5 text-sm">Chưa có tài khoản? <a className="underline underline-offset-4" href="/account/register?next=%2Fcheckout">Đăng ký</a></p></div></main>;
  return <main className="px-5 pb-20 pt-[110px] md:px-[4.2vw] md:pt-[125px]">
    <div className="mb-7 flex items-center gap-2 text-[9px] uppercase tracking-[.08em] text-black"><a href="/">Trang chủ</a><span>/</span><a href="/cart">Túi hàng</a><span>/</span><span>Thanh toán COD</span></div><h1 className="font-display text-4xl md:text-5xl">THANH TOÁN</h1>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_.75fr] lg:gap-[8vw]">
      <form className="border-t border-black/10" onSubmit={handleFormSubmit} noValidate>
        <section className="border-b border-black/10 py-6">
          <SectionTitle title="THÔNG TIN NHẬN HÀNG" />
          <Field label="HỌ VÀ TÊN *" error={touched.recipientName ? fieldErrors.recipientName : ""}>
            <input
              name="recipientName"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={formData.recipientName}
              onChange={(e) => handleFieldChange("recipientName", e.target.value)}
              onBlur={() => handleFieldBlur("recipientName")}
              className={touched.recipientName && fieldErrors.recipientName ? "is-invalid" : ""}
              placeholder="Nguyễn Văn A"
            />
          </Field>
          <Field label="ĐỊA CHỈ EMAIL *" error={touched.email ? fieldErrors.email : ""}>
            <input
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              value={formData.email}
              onChange={(e) => handleFieldChange("email", e.target.value)}
              onBlur={() => handleFieldBlur("email")}
              className={touched.email && fieldErrors.email ? "is-invalid" : ""}
              placeholder="email@example.com"
            />
          </Field>
          <Field label="SỐ ĐIỆN THOẠI *" error={touched.phone ? fieldErrors.phone : ""}>
            <input
              name="phone"
              type="tel"
              required
              maxLength={32}
              autoComplete="tel"
              value={formData.phone}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              onBlur={() => handleFieldBlur("phone")}
              className={touched.phone && fieldErrors.phone ? "is-invalid" : ""}
              placeholder="0912345678"
            />
          </Field>
        </section>

        <section className="border-b border-black/10 py-6">
          <SectionTitle title="ĐỊA CHỈ GIAO HÀNG" />
          <Field label="ĐỊA CHỈ *" error={touched.addressLine ? fieldErrors.addressLine : ""}>
            <input
              name="addressLine"
              required
              minLength={5}
              maxLength={255}
              autoComplete="street-address"
              value={formData.addressLine}
              onChange={(e) => handleFieldChange("addressLine", e.target.value)}
              onBlur={() => handleFieldBlur("addressLine")}
              className={touched.addressLine && fieldErrors.addressLine ? "is-invalid" : ""}
              placeholder="Số nhà, tên đường"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2 items-start">
            <LocationSuggestInput
              label="TỈNH / THÀNH PHỐ *"
              name="province"
              value={formData.province}
              onChange={(val) => handleFieldChange("province", val)}
              onSelect={handleSelectProvince}
              onBlur={() => handleFieldBlur("province")}
              error={touched.province ? fieldErrors.province : ""}
              placeholder="Chọn hoặc nhập tỉnh / thành phố"
              autoComplete="address-level1"
              required
              getSuggestions={(val) => filterProvinces(val)}
            />
            <LocationSuggestInput
              label="PHƯỜNG / XÃ"
              name="ward"
              value={formData.ward}
              onChange={(val) => handleFieldChange("ward", val)}
              onSelect={handleSelectWard}
              onBlur={() => handleFieldBlur("ward")}
              placeholder={formData.province ? "Chọn hoặc nhập phường / xã" : "Chọn tỉnh / thành phố trước"}
              autoComplete="address-level3"
              getSuggestions={(val) => filterWards(val, formData.province)}
            />
          </div>
          <Field label="GHI CHÚ ĐƠN HÀNG">
            <input
              name="note"
              maxLength={1000}
              value={formData.note}
              onChange={(e) => handleFieldChange("note", e.target.value)}
              placeholder="Không bắt buộc"
            />
          </Field>
        </section>

        <section className="border-b border-black/10 py-6">
          <SectionTitle title="PHƯƠNG THỨC THANH TOÁN" />
          <div className="flex min-h-14 items-center justify-between border border-black/15 px-4 text-sm">
            <label className="flex items-center gap-3">
              <input type="radio" checked readOnly /> Thanh toán khi nhận hàng (COD)
            </label>
            <span className="text-[10px] uppercase tracking-[.08em]">COD</span>
          </div>
          <p className="mt-3 text-xs leading-5 text-black">Bạn thanh toán trực tiếp cho nhân viên giao hàng khi nhận sản phẩm.</p>
        </section>

        {error && (
          <div role="alert" className="account-error mt-5">
            <Icon name="alert" className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        <button disabled={busy} className="mt-5 min-h-12 w-full rounded-full bg-black px-4 text-xs uppercase tracking-[.08em] text-white disabled:opacity-50" type="submit">
          {busy ? "ĐANG TẠO ĐƠN…" : `ĐẶT HÀNG COD · ${formatPrice(finalTotal)}`}
        </button>
      </form>
      <aside className="h-fit border border-black/10 p-5 lg:sticky lg:top-24">
        <p className="mb-5 text-[10px] uppercase tracking-[.12em]">TÓM TẮT ĐƠN HÀNG</p>
        {cart.map((item) => {
          const product = getProduct(item.slug);
          const variant = getProductVariant(product, item.sku);
          return <div key={item.sku || `${item.slug}-${item.variant || product.sku}`} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 py-2 text-xs">
            <div className="relative h-16 bg-white"><img className="h-full w-full object-contain mix-blend-multiply" src={variant?.image || product.front || product.image} alt={product.name} /><span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-neutral-800 text-[9px] text-white">{item.qty}</span></div>
            <p>{product.name}{variant?.name && <small className="mt-1 block text-[10px] text-black">{variant.name}</small>}</p>
            <b className="font-normal tabular-nums">{formatPrice(getProductPrice(product, item.sku) * item.qty)}</b>
          </div>;
        })}
        <div className="mt-5 border-t border-black/10 pt-4">
          <span className="mb-2 block text-[10px] uppercase tracking-[.08em]">MÃ KHUYẾN MÃI</span>
          {appliedPromo ? (
            <div className="flex items-center justify-between rounded-xl border border-black/15 bg-neutral-100 px-3.5 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                <Icon name="tag" className="h-4 w-4 text-black" />
                <span className="font-semibold text-black">{appliedPromo.code}</span>
                <span className="text-[11px] text-neutral-600">(-{formatPrice(discountAmount)})</span>
              </div>
              <button
                type="button"
                onClick={handleRemovePromo}
                className="text-[10px] font-medium uppercase tracking-wider text-red-600 hover:text-red-800"
              >
                Gỡ bỏ
              </button>
            </div>
          ) : (
            <div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoError(""); }}
                  placeholder="Nhập mã giảm giá"
                  className="min-h-10 flex-1 rounded-full border border-black/20 px-4 text-xs uppercase placeholder:normal-case placeholder:text-neutral-400 focus:border-black focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoBusy || !promoCode.trim()}
                  className="min-h-10 rounded-full bg-black px-4 text-[10px] font-medium uppercase tracking-wider text-white transition hover:bg-neutral-800 disabled:opacity-40"
                >
                  {promoBusy ? "…" : "Áp dụng"}
                </button>
              </div>
              {promoError && (
                <div className="account-error mt-2 py-2 text-xs" role="alert">
                  <Icon name="alert" className="h-3.5 w-3.5" />
                  <span>{promoError}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-5 border-t border-black/10 pt-4 text-xs">
          <div className="flex justify-between"><span>Tạm tính</span><b className="font-normal tabular-nums">{formatPrice(subtotal)}</b></div>
          {appliedPromo && discountAmount > 0 && (
            <div className="mt-3 flex justify-between text-neutral-800">
              <span>Mã giảm ({appliedPromo.code})</span>
              <b className="font-normal tabular-nums text-emerald-600">−{formatPrice(discountAmount)}</b>
            </div>
          )}
          <div className="mt-3 flex justify-between"><span>Giao hàng</span><span>Miễn phí</span></div>
          <div className="mt-4 flex justify-between border-t border-black/10 pt-4 text-sm"><span>Tổng cộng</span><b className="font-medium tabular-nums">{formatPrice(finalTotal)}</b></div>
        </div>
      </aside>
    </div>
  </main>;
}

function SectionTitle({ title }) { return <div className="mb-5"><h2 className="text-xs font-medium tracking-[.05em]">{title}</h2></div>; }
function Field({ label, children, error }) {
  return (
    <label className={`mb-4 flex flex-col gap-1.5 text-[9px] tracking-[.07em] ${error ? "has-error" : ""}`}>
      <span className="font-medium text-neutral-800">{label}</span>
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

function LocationSuggestInput({
  label,
  name,
  value,
  onChange,
  onSelect,
  onBlur,
  placeholder,
  required = false,
  error = "",
  getSuggestions,
  autoComplete,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  const suggestions = isOpen ? getSuggestions(value) : [];

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        onSelect(suggestions[highlightedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className={`mb-4 flex flex-col gap-1.5 text-[9px] tracking-[.07em] ${error ? "has-error" : ""}`} ref={containerRef}>
      <span className="font-medium text-neutral-800">{label}</span>
      <div className="relative">
        <input
          name={name}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onClick={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onBlur={() => {
            onBlur?.();
          }}
          onKeyDown={handleKeyDown}
          className={error ? "is-invalid" : ""}
          placeholder={placeholder}
        />
        {isOpen && suggestions.length > 0 && (
          <ul className="address-suggest-dropdown" role="listbox">
            {suggestions.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              const isWardObj = typeof item === "object";
              const mainText = isWardObj ? item.ward : item;
              const subText = isWardObj ? item.province : null;

              return (
                <li
                  key={isWardObj ? `${item.ward}-${item.province || idx}` : item}
                  role="option"
                  aria-selected={isHighlighted}
                  className={`address-suggest-item ${isHighlighted ? "is-highlighted" : ""}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(item);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <Icon name="pin" className="h-3.5 w-3.5 shrink-0" />
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-medium text-black">{mainText}</span>
                    {subText && <span className="ml-2 text-stone-500 font-normal">{subText}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {error && (
        <span className="profile-field-error">
          <Icon name="alert" className="h-3.5 w-3.5" />
          {error}
        </span>
      )}
    </div>
  );
}

export function CompletePage() {
  return <main className="grid min-h-[70vh] place-items-center px-5 pt-20 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-black/15 text-xl">✓</span><h1 className="font-display mt-6 text-4xl md:text-6xl">CẢM ƠN BẠN<br />ĐÃ ĐẶT HÀNG.</h1><p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-black">Đơn hàng đã được ghi nhận. Thông tin xác nhận sẽ sớm được gửi đến bạn.</p><a className="pill-button mt-7" href="/store">Tiếp tục mua sắm</a></div></main>;
}
