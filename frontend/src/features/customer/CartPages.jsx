import Icon from "../../shared/components/Icon.jsx";
import { formatPrice, getProduct, getProductPrice, getProductVariant } from "../../shared/services/storefront.js";

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
  const total = cart.reduce((sum, item) => sum + getProductPrice(getProduct(item.slug), item.sku) * item.qty, 0);
  if (!cart.length) return <main className="px-5 pb-20 pt-[115px] md:px-[4.2vw] md:pt-[125px]"><h1 className="font-display text-4xl">THANH TOÁN</h1><div className="mt-7 flex min-h-64 items-center justify-between border-t border-black/10"><span>Túi hàng đang trống.</span><a className="pill-button" href="/store">Tiếp tục mua sắm</a></div></main>;
  if (!user) return <main className="grid min-h-[70vh] place-items-center px-5 pt-24 text-center"><div className="max-w-lg"><h1 className="font-display text-4xl md:text-5xl">ĐĂNG NHẬP ĐỂ ĐẶT HÀNG</h1><p className="mt-4 text-sm leading-6 text-black">Đơn COD được gắn với tài khoản để bạn có thể theo dõi trạng thái giao hàng.</p><a className="mt-7 inline-flex min-h-12 items-center justify-center rounded-full bg-black px-8 text-xs uppercase tracking-[.08em] text-white" href="/account/login?next=%2Fcheckout">Đăng nhập</a><p className="mt-4 text-sm">Chưa có tài khoản? <a className="underline underline-offset-4" href="/account/register?next=%2Fcheckout">Đăng ký</a></p></div></main>;
  return <main className="px-5 pb-20 pt-[110px] md:px-[4.2vw] md:pt-[125px]">
    <div className="mb-7 flex items-center gap-2 text-[9px] uppercase tracking-[.08em] text-black"><a href="/">Trang chủ</a><span>/</span><a href="/cart">Túi hàng</a><span>/</span><span>Thanh toán COD</span></div><h1 className="font-display text-4xl md:text-5xl">THANH TOÁN</h1>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_.75fr] lg:gap-[8vw]">
      <form className="border-t border-black/10" onSubmit={(event) => { event.preventDefault(); onSubmit(Object.fromEntries(new FormData(event.currentTarget))); }}>
        <section className="border-b border-black/10 py-6"><SectionTitle title="THÔNG TIN NHẬN HÀNG" /><Field label="HỌ VÀ TÊN"><input name="recipientName" required minLength={2} maxLength={120} autoComplete="name" defaultValue={user.fullName || ""} /></Field><Field label="ĐỊA CHỈ EMAIL"><input name="email" type="email" required maxLength={254} autoComplete="email" defaultValue={user.email || ""} /></Field><Field label="SỐ ĐIỆN THOẠI"><input name="phone" type="tel" required minLength={8} maxLength={32} autoComplete="tel" defaultValue={user.phone || ""} /></Field></section>
        <section className="border-b border-black/10 py-6"><SectionTitle title="ĐỊA CHỈ GIAO HÀNG" /><Field label="ĐỊA CHỈ"><input name="addressLine" required minLength={5} maxLength={255} autoComplete="street-address" placeholder="Số nhà, tên đường" /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="PHƯỜNG / XÃ"><input name="ward" maxLength={120} autoComplete="address-level3" /></Field><Field label="QUẬN / HUYỆN"><input name="district" maxLength={120} autoComplete="address-level2" /></Field></div><Field label="TỈNH / THÀNH PHỐ"><input name="province" required minLength={2} maxLength={120} autoComplete="address-level1" /></Field><Field label="GHI CHÚ ĐƠN HÀNG"><input name="note" maxLength={1000} placeholder="Không bắt buộc" /></Field></section>
        <section className="border-b border-black/10 py-6"><SectionTitle title="PHƯƠNG THỨC THANH TOÁN" /><div className="flex min-h-14 items-center justify-between border border-black/15 px-4 text-sm"><label className="flex items-center gap-3"><input type="radio" checked readOnly /> Thanh toán khi nhận hàng (COD)</label><span className="text-[10px] uppercase tracking-[.08em]">COD</span></div><p className="mt-3 text-xs leading-5 text-black">Bạn thanh toán trực tiếp cho nhân viên giao hàng khi nhận sản phẩm.</p></section>
        {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
        <button disabled={busy} className="mt-5 min-h-12 w-full rounded-full bg-black px-4 text-xs uppercase tracking-[.08em] text-white disabled:opacity-50" type="submit">{busy ? "ĐANG TẠO ĐƠN…" : `ĐẶT HÀNG COD · ${formatPrice(total)}`}</button>
      </form>
      <aside className="h-fit border border-black/10 p-5 lg:sticky lg:top-24"><p className="mb-5 text-[10px] uppercase tracking-[.12em]">Đơn hàng · {cart.reduce((sum, item) => sum + item.qty, 0)} sản phẩm</p>{cart.map((item) => { const product = getProduct(item.slug); const variant = getProductVariant(product, item.sku); return <div key={item.sku || `${item.slug}-${item.variant || product.sku}`} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 py-2 text-xs"><div className="relative h-16 bg-white"><img className="h-full w-full object-contain mix-blend-multiply" src={variant?.image || product.front || product.image} alt={product.name} /><span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-neutral-800 text-[9px] text-white">{item.qty}</span></div><p>{product.name}{variant?.name && <small className="mt-1 block text-[10px] text-black">{variant.name}</small>}</p><b className="font-normal tabular-nums">{formatPrice(getProductPrice(product, item.sku) * item.qty)}</b></div>; })}<div className="mt-5 border-t border-black/10 pt-4 text-xs"><div className="flex justify-between"><span>Tạm tính</span><b className="font-normal tabular-nums">{formatPrice(total)}</b></div><div className="mt-3 flex justify-between"><span>Giao hàng</span><span>Miễn phí</span></div><div className="mt-4 flex justify-between border-t border-black/10 pt-4 text-sm"><span>Tổng cộng</span><b className="font-medium tabular-nums">{formatPrice(total)}</b></div></div></aside>
    </div>
  </main>;
}

function SectionTitle({ title }) { return <div className="mb-5"><h2 className="text-xs font-medium tracking-[.05em]">{title}</h2></div>; }
function Field({ label, children }) { return <label className="mb-4 flex flex-col gap-2 text-[9px] tracking-[.07em]">{label}{children.type === "input" ? <span className="contents">{children}</span> : children}</label>; }

export function CompletePage() {
  return <main className="grid min-h-[70vh] place-items-center px-5 pt-20 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-black/15 text-xl">✓</span><h1 className="font-display mt-6 text-4xl md:text-6xl">CẢM ƠN BẠN<br />ĐÃ ĐẶT HÀNG.</h1><p className="mx-auto mt-5 max-w-sm text-sm leading-6 text-black">Đơn hàng đã được ghi nhận. Thông tin xác nhận sẽ sớm được gửi đến bạn.</p><a className="pill-button mt-7" href="/store">Tiếp tục mua sắm</a></div></main>;
}
