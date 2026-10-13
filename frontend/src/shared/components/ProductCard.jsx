import Icon from "./Icon.jsx";
import { formatPrice, getPrimaryProductMenuCategory } from "../services/storefront.js";

export default function ProductCard({ product, index = 0, onAdd, onWishlist, wished }) {
  const hasCutout = Boolean(product.front);
  const image = product.front || product.image;

  const totalStock = product.variants && product.variants.length > 0
    ? product.variants.reduce((sum, v) => sum + (Number(v.stockOnHand) || 0), 0)
    : (Number(product.stockOnHand) || 0);
  const isOutOfStock = totalStock <= 0;

  return (
    <article className="product-card group min-w-0 overflow-hidden rounded-lg border border-black/[0.07] bg-white/55 p-2 transition-shadow hover:shadow-[0_10px_32px_rgba(0,0,0,0.07)] sm:p-2.5" style={{ animationDelay: `${(index % 4) * 45}ms` }}>
      <div className="product-image-wrap relative aspect-square overflow-hidden rounded-md">
        <a className="absolute inset-0 flex items-center justify-center" href={`/product/${product.slug}`} aria-label={`Xem ${product.name}`}>
          <img className={`product-photo ${hasCutout ? "product-photo-cutout" : "product-photo-lookbook"}`} loading="lazy" src={image} alt={product.name} />
        </a>
        {isOutOfStock && (
          <span className="absolute left-2.5 top-2.5 z-10 inline-flex items-center rounded-full bg-black/80 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.06em] text-white backdrop-blur-sm">
            Hết hàng
          </span>
        )}
        <button className="absolute right-2.5 top-2.5 z-10 grid h-9 w-9 place-items-center rounded-full border border-black/[0.04] bg-white/85 text-black shadow-sm transition hover:bg-white" onClick={() => onWishlist(product.slug)} aria-label={wished ? "Bỏ khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}>
          <Icon name="heart" className={`h-[18px] w-[18px] ${wished ? "fill-black" : ""}`} />
        </button>
        {isOutOfStock ? (
          <button
            type="button"
            disabled
            className="product-add-button is-disabled absolute bottom-2 right-2 z-10 inline-flex min-h-8 cursor-not-allowed items-center rounded-full bg-neutral-200 px-2.5 text-[9px] font-semibold uppercase tracking-[.02em] text-neutral-500 shadow-sm md:bottom-2.5 md:right-2.5 md:min-h-9 md:px-3 md:text-[10px]"
            title="Sản phẩm tạm hết hàng"
          >
            <span>Hết hàng</span>
          </button>
        ) : (
          <button className="product-add-button absolute bottom-2 right-2 z-10 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-black/90 px-2.5 text-[9px] font-medium tracking-[.01em] text-white shadow-sm transition hover:bg-black md:bottom-2.5 md:right-2.5 md:min-h-9 md:gap-2 md:px-3.5 md:text-[10px] md:tracking-[.025em]" onClick={() => onAdd(product, product.variants?.[0]?.sku)} aria-label={`Thêm ${product.name} vào giỏ`}>
            <span className="md:hidden">Thêm</span><span className="hidden md:inline">Thêm vào giỏ</span><Icon name="plus" className="h-3 w-3 md:h-3.5 md:w-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-col items-start gap-1 px-1.5 pt-3 text-xs sm:flex-row sm:items-baseline sm:justify-between sm:gap-2 md:pt-3.5 md:text-[13px]">
        <a className="line-clamp-2 min-w-0" href={`/product/${product.slug}`}>{product.name}</a>
        <span className="tabular-nums text-[11px] sm:shrink-0 sm:text-xs md:text-[13px]">{formatPrice(product.price)}</span>
      </div>
      <div className="mt-1 px-1.5 pb-2 text-[10px] text-black">{getPrimaryProductMenuCategory(product)}</div>
    </article>
  );
}
