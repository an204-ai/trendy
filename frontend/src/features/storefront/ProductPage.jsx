import { Fragment, useEffect, useState } from "react";
import ProductCard from "../../shared/components/ProductCard.jsx";
import { formatPrice, getPrimaryProductMenuCategory, getProduct, getProductMenuCategoryLabels, getProductPrice, getProductVariant, getProducts, getStorefrontContent, getVariants } from "../../shared/services/storefront.js";

const content = getStorefrontContent().product;

export default function ProductPage({ slug, onAdd, onWishlist, wishlist, selectedVariant, setSelectedVariant, onZoom }) {
  const product = getProduct(slug);
  const [openSection, setOpenSection] = useState("details");
  useEffect(() => {
    if (!product) return;
    try {
      const previous = JSON.parse(localStorage.getItem("gm-recently-viewed") || "[]");
      const history = Array.isArray(previous) ? previous : [];
      localStorage.setItem("gm-recently-viewed", JSON.stringify([slug, ...history.filter((item) => item !== slug)].slice(0, 5)));
    } catch {
      localStorage.setItem("gm-recently-viewed", JSON.stringify([slug]));
    }
  }, [slug, product]);
  if (!product) return <main className="grid min-h-[70vh] place-items-center pt-24"><a className="pill-button" href="/store">Quay lại cửa hàng</a></main>;
  const variants = getVariants(product);
  const selectedSku = getProductVariant(product, selectedVariant || variants[0]?.sku)?.sku || product.sku;
  const selectedProductVariant = getProductVariant(product, selectedSku);
  const price = getProductPrice(product, selectedSku);
  const baseGallery = product.gallery || (product.front ? [product.image, product.front] : [product.image]);
  const gallery = selectedProductVariant?.gallery || (selectedProductVariant?.image ? [selectedProductVariant.image, ...baseGallery.slice(1)] : baseGallery);
  const similar = getProducts().filter((item) => item.slug !== product.slug).slice(0, 4);
  const specifications = product.specifications || {};
  const dimensionRows = [
    ["Độ rộng tròng", specifications.dimensions?.lensWidth],
    ["Cầu kính", specifications.dimensions?.bridgeWidth],
    ["Ngang gọng", specifications.dimensions?.frameWidth],
    ["Càng kính", specifications.dimensions?.templeLength],
  ].filter(([, value]) => value != null && value !== "");
  const productDetails = [
    ["Danh mục", getProductMenuCategoryLabels(product).join(" · ")],
    ["Chất liệu gọng", specifications.frameMaterial],
    ["Chất liệu tròng", specifications.lensMaterial],
    ["Loại tròng", specifications.lensType],
  ].filter(([, value]) => value);
  const details = [
    ["details", content.detailsTitle, <div className="space-y-2 text-xs leading-6 text-black">{productDetails.length ? productDetails.map(([label, value]) => <p key={label}>{label} · {value}</p>) : <p>Thông tin sản phẩm sẽ được cập nhật.</p>}</div>],
    ["size", content.sizingTitle, dimensionRows.length ? <div className="grid grid-cols-2 gap-y-3 text-[10px] uppercase tracking-[.08em] text-black">{dimensionRows.map(([label, value]) => <Fragment key={label}><span>{label}</span><b className="text-right font-normal text-black">{value} mm</b></Fragment>)}</div> : <p className="text-xs leading-6 text-black">Kích thước sản phẩm sẽ được cập nhật.</p>],
    ["shipping", content.shippingTitle, <div className="space-y-2 text-xs leading-6 text-black"><p>{content.shippingDescription}</p><p>{content.returnDescription}</p><p>{content.taxDescription}</p></div>],
  ];
  return <main className="px-5 pb-16 pt-[100px] md:px-[4.2vw] md:pt-[112px]">
    <div className="mb-4 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[.08em] text-black"><a href="/">Trang chủ</a><span>/</span><a href="/store">Cửa hàng</a><span>/</span><span>{product.name}</span></div>
    <div className="grid gap-7 lg:grid-cols-[1.55fr_.7fr] lg:gap-[5.5vw]">
      <section className="grid grid-cols-2 gap-1.5">{gallery.map((image, index) => <button key={image} className={`relative aspect-[.82] overflow-hidden bg-[#f2f3f5] ${gallery.length === 1 ? "col-span-2" : ""} ${index > 1 ? "hidden md:block" : ""}`} onClick={() => onZoom(image)} aria-label="Phóng to hình sản phẩm"><img className="h-full w-full object-cover transition duration-500 hover:scale-[1.025]" src={image} alt={`${product.name} · góc nhìn ${index + 1}`} /></button>)}</section>
      <aside className="lg:sticky lg:top-[100px] lg:self-start">
        <h1 className="font-display text-4xl md:text-[42px]">{product.name}</h1>
        <p className="mt-4 text-xs uppercase tracking-[.08em]">{getPrimaryProductMenuCategory(product)}</p>
        <p className="mt-4 text-lg tabular-nums">{formatPrice(price)}</p>
        {variants.length > 0 && <div className="my-7 py-2">
          <div className="flex items-baseline justify-between gap-4"><span className="text-[10px] uppercase tracking-[.08em]">Chọn biến thể</span><span className="text-xs">{selectedProductVariant?.name}</span></div>
          <div className="mt-4 flex flex-wrap items-center gap-4">{variants.map((option) => <button key={option.sku} className="swatch" style={{ "--swatch": option.swatch || "#b9bcbd" }} aria-label={option.name || option.sku} title={option.name || option.sku} aria-pressed={selectedSku === option.sku} onClick={() => setSelectedVariant(option.sku)} />)}</div>
        </div>}
        <button className="mt-1 flex min-h-[54px] w-full items-center justify-between rounded-full bg-black px-6 text-xs tracking-[.06em] text-white transition hover:bg-neutral-700" onClick={() => onAdd(product, selectedProductVariant?.sku)}><span>{content.addToCart}</span><span>{formatPrice(price)}</span></button>
        <p className="mt-4 text-center text-[9px] uppercase tracking-[.07em] text-black">{content.shippingNote}</p>
        <a className="mt-6 flex min-h-12 items-center justify-between py-2 text-[10px] uppercase tracking-[.05em]" href="/stores">{content.storeLocator}</a>
        <div className="mt-7 space-y-1">{details.map(([id, title, content]) => <section key={id}><button className="flex min-h-[46px] w-full items-center justify-between py-1.5 text-left text-[14px] tracking-[.08em]" onClick={() => setOpenSection(openSection === id ? "" : id)}>{title}<span className="text-base">{openSection === id ? "−" : "+"}</span></button>{openSection === id && <div className="pb-3 pt-1.5">{content}</div>}</section>)}</div>
        <p className="mt-7 text-[9px] uppercase tracking-[.08em] text-black">SKU · {selectedSku}</p>
      </aside>
    </div>
    <section className="mt-20 md:mt-28" aria-labelledby="product-description-title">
      <div className="product-description-gallery">
        {gallery.map((image, index) => <figure key={`${image}-${index}`} className="product-description-gallery-item aspect-[.82] snap-start overflow-hidden bg-[#f1f2f2]"><img className="h-full w-full object-cover" loading="lazy" src={image} alt={`${product.name} · hình ${index + 1}`} /></figure>)}
      </div>
      <div className="mt-6 max-w-4xl md:mt-8">
        <h2 id="product-description-title" className="text-sm uppercase tracking-[.06em]">MÔ TẢ</h2>
        {product.description && <p className="mt-2 text-xs leading-6 md:mt-3 md:text-sm md:leading-6">{product.description}</p>}
        <a className="mt-4 inline-block border-b border-black pb-1 text-[10px] uppercase tracking-[.06em]" href={`/store?subCategory=${product.category?.at(-1) || "kinh-can"}`}>Khám phá thêm</a>
      </div>
    </section>
    <section className="pt-20 md:pt-28"><div className="mb-6 flex items-end justify-between"><h2 className="text-xl">{content.recommendationTitle}</h2><a className="pill-button text-[10px] uppercase" href="/store">{content.allProductsLabel}</a></div><div className="grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-4 md:gap-x-3">{similar.map((item, index) => <ProductCard key={item.slug} product={item} index={index} onAdd={onAdd} onWishlist={onWishlist} wished={wishlist.includes(item.slug)} />)}</div></section>
  </main>;
}
