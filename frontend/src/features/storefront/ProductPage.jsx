import { Fragment, useEffect, useState } from "react";
import ProductCard from "../../shared/components/ProductCard.jsx";
import { formatPrice, getPrimaryProductMenuCategory, getProduct, getProductMenuCategoryLabels, getProductPrice, getProductVariant, getProducts, getStorefrontContent, getVariants } from "../../shared/services/storefront.js";

const content = getStorefrontContent().product;

function formatVariantLabel(str) {
  if (!str) return "";
  const trimmed = str.trim();
  const lower = trimmed.toLowerCase();
  let res = lower.charAt(0).toUpperCase() + lower.slice(1);
  res = res.replace(/\(([a-z0-9]+)\)/gi, (_, code) => `(${code.toUpperCase()})`);
  return res;
}

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
  const specifications = product.specifications || {};

  // Extract multi-attribute definitions
  const attributes = (() => {
    let types = specifications.variantTypes;
    if (!Array.isArray(types) || types.length === 0) {
      if (specifications.variantType) {
        types = [specifications.variantType];
      } else {
        const hasSlash = variants.some((v) => (v.name || "").includes("/"));
        if (hasSlash) {
          types = ["COLOR", "DIOPTER"];
        } else if (variants.some((v) => v.swatch && v.swatch.trim())) {
          types = ["COLOR"];
        } else if (variants.some((v) => (v.name || "").toLowerCase().includes("diop") || (v.name || "").toLowerCase().includes("độ") || /^[0-9+.-]+$/.test((v.name || "").trim()))) {
          types = ["DIOPTER"];
        } else {
          types = variants.length > 0 ? ["VERSION"] : [];
        }
      }
    }

    const attrOptions = specifications.attributeOptions || {};

    let colors = [];
    if (attrOptions.color && Array.isArray(attrOptions.color) && attrOptions.color.length) {
      colors = attrOptions.color;
    } else if (types.includes("COLOR")) {
      const map = new Map();
      variants.forEach((v) => {
        const parts = (v.name || "").split("/");
        const colorPart = parts[0]?.trim() || v.name?.trim() || "";
        if (colorPart && !map.has(colorPart)) {
          map.set(colorPart, {
            name: colorPart,
            swatch: v.swatch || "#000000",
            image: v.image || product.image || "",
          });
        }
      });
      colors = Array.from(map.values());
    }

    let diopters = [];
    if (attrOptions.diopter && Array.isArray(attrOptions.diopter) && attrOptions.diopter.length) {
      diopters = attrOptions.diopter;
    } else if (types.includes("DIOPTER")) {
      const map = new Map();
      variants.forEach((v) => {
        const parts = (v.name || "").split("/");
        const diopterPart = parts.length > 1 ? parts[1]?.trim() : (types.length === 1 ? parts[0]?.trim() : "");
        if (diopterPart && !map.has(diopterPart)) {
          map.set(diopterPart, { name: diopterPart });
        }
      });
      diopters = Array.from(map.values());
    }

    let versions = [];
    if (attrOptions.version && Array.isArray(attrOptions.version) && attrOptions.version.length) {
      versions = attrOptions.version;
    } else if (types.includes("VERSION")) {
      const map = new Map();
      variants.forEach((v) => {
        const parts = (v.name || "").split("/");
        const verPart = parts[0]?.trim() || "";
        if (verPart && !map.has(verPart)) {
          map.set(verPart, { name: verPart });
        }
      });
      versions = Array.from(map.values());
    }

    let sizes = [];
    if (attrOptions.size && Array.isArray(attrOptions.size) && attrOptions.size.length) {
      sizes = attrOptions.size;
    } else if (types.includes("SIZE")) {
      const map = new Map();
      variants.forEach((v) => {
        const parts = (v.name || "").split("/");
        const sizePart = parts.length > 1 ? parts[1]?.trim() : (types.length === 1 ? parts[0]?.trim() : "");
        if (sizePart && !map.has(sizePart)) {
          map.set(sizePart, { name: sizePart });
        }
      });
      sizes = Array.from(map.values());
    }

    return { types, colors, diopters, versions, sizes };
  })();

  const [selectedColor, setSelectedColor] = useState(attributes.colors[0]?.name || "");
  const [selectedDiopter, setSelectedDiopter] = useState(attributes.diopters[0]?.name || "");
  const [selectedVersion, setSelectedVersion] = useState(attributes.versions[0]?.name || "");
  const [selectedSize, setSelectedSize] = useState(attributes.sizes[0]?.name || "");

  // Sync state if initial attributes change
  useEffect(() => {
    if (attributes.colors.length && !attributes.colors.some((c) => c.name === selectedColor)) {
      setSelectedColor(attributes.colors[0]?.name || "");
    }
    if (attributes.diopters.length && !attributes.diopters.some((d) => d.name === selectedDiopter)) {
      setSelectedDiopter(attributes.diopters[0]?.name || "");
    }
    if (attributes.versions.length && !attributes.versions.some((v) => v.name === selectedVersion)) {
      setSelectedVersion(attributes.versions[0]?.name || "");
    }
    if (attributes.sizes.length && !attributes.sizes.some((s) => s.name === selectedSize)) {
      setSelectedSize(attributes.sizes[0]?.name || "");
    }
  }, [product?.slug]);

  // Find matching variant
  const currentVariant = (() => {
    if (!variants || variants.length === 0) return null;
    const hasColors = attributes.colors.length > 0;
    const hasDiopters = attributes.diopters.length > 0;
    const hasVersions = attributes.versions.length > 0;
    const hasSizes = attributes.sizes.length > 0;

    // Multi-attribute combinations: both attributes MUST match
    if (hasColors && hasDiopters) {
      if (!selectedColor || !selectedDiopter) return null;
      const found = variants.find((v) => {
        const name = (v.name || "").toLowerCase();
        return name.includes(selectedColor.toLowerCase()) && name.includes(selectedDiopter.toLowerCase());
      });
      return found || null;
    }
    if (hasColors && hasVersions) {
      if (!selectedColor || !selectedVersion) return null;
      const found = variants.find((v) => {
        const name = (v.name || "").toLowerCase();
        return name.includes(selectedColor.toLowerCase()) && name.includes(selectedVersion.toLowerCase());
      });
      return found || null;
    }
    if (hasColors && hasSizes) {
      if (!selectedColor || !selectedSize) return null;
      const found = variants.find((v) => {
        const name = (v.name || "").toLowerCase();
        return name.includes(selectedColor.toLowerCase()) && name.includes(selectedSize.toLowerCase());
      });
      return found || null;
    }

    // Single-attribute cases: the selected attribute MUST match
    if (hasColors) {
      if (!selectedColor) return null;
      const found = variants.find((v) => (v.name || "").toLowerCase().includes(selectedColor.toLowerCase()));
      return found || null;
    }
    if (hasDiopters) {
      if (!selectedDiopter) return null;
      const found = variants.find((v) => (v.name || "").toLowerCase().includes(selectedDiopter.toLowerCase()));
      return found || null;
    }
    if (hasVersions) {
      if (!selectedVersion) return null;
      const found = variants.find((v) => (v.name || "").toLowerCase().includes(selectedVersion.toLowerCase()));
      return found || null;
    }
    if (hasSizes) {
      if (!selectedSize) return null;
      const found = variants.find((v) => (v.name || "").toLowerCase().includes(selectedSize.toLowerCase()));
      return found || null;
    }

    if (selectedVariant) {
      return variants.find((v) => v.sku === selectedVariant) || null;
    }
    return variants[0] || null;
  })();

  const isAvailable = Boolean(currentVariant);
  const currentSku = currentVariant?.sku || product.sku;
  const currentPrice = currentVariant?.price ?? product.price ?? 0;
  const currentStock = currentVariant ? Number(currentVariant.stockOnHand ?? 0) : 0;
  const isOutOfStock = !isAvailable || currentStock <= 0;

  const baseGallery = Array.isArray(product.gallery) && product.gallery.length
    ? product.gallery
    : [product.image, product.front].filter(Boolean);

  const activeVariantImage =
    currentVariant?.image ||
    variants.find((v) => {
      const n = (v.name || "").toLowerCase();
      return selectedColor && n.includes(selectedColor.toLowerCase()) && v.image;
    })?.image ||
    attributes.colors.find((c) => (c.name || "").toLowerCase() === (selectedColor || "").toLowerCase())?.image;

  const primaryImage = activeVariantImage || baseGallery[0] || product.image;
  const gallery = [primaryImage, ...baseGallery.filter((img) => img && img !== primaryImage)];

  const handleSelectColor = (colorName) => {
    setSelectedColor(colorName);
    const matched = variants.find((v) => {
      const n = (v.name || "").toLowerCase();
      const matchColor = n.includes(colorName.toLowerCase());
      const matchDiopter = !selectedDiopter || n.includes(selectedDiopter.toLowerCase());
      const matchVersion = !selectedVersion || n.includes(selectedVersion.toLowerCase());
      const matchSize = !selectedSize || n.includes(selectedSize.toLowerCase());
      return matchColor && matchDiopter && matchVersion && matchSize;
    }) || variants.find((v) => (v.name || "").toLowerCase().includes(colorName.toLowerCase()));
    if (matched?.sku && setSelectedVariant) {
      setSelectedVariant(matched.sku);
    }
  };

  const handleSelectDiopter = (diopterName) => {
    setSelectedDiopter(diopterName);
    const matched = variants.find((v) => {
      const n = (v.name || "").toLowerCase();
      const matchColor = !selectedColor || n.includes(selectedColor.toLowerCase());
      const matchDiopter = n.includes(diopterName.toLowerCase());
      const matchVersion = !selectedVersion || n.includes(selectedVersion.toLowerCase());
      const matchSize = !selectedSize || n.includes(selectedSize.toLowerCase());
      return matchColor && matchDiopter && matchVersion && matchSize;
    }) || variants.find((v) => (v.name || "").toLowerCase().includes(diopterName.toLowerCase()));
    if (matched?.sku && setSelectedVariant) {
      setSelectedVariant(matched.sku);
    }
  };

  const handleSelectVersion = (versionName) => {
    setSelectedVersion(versionName);
    const matched = variants.find((v) => {
      const n = (v.name || "").toLowerCase();
      const matchColor = !selectedColor || n.includes(selectedColor.toLowerCase());
      const matchDiopter = !selectedDiopter || n.includes(selectedDiopter.toLowerCase());
      const matchVersion = n.includes(versionName.toLowerCase());
      const matchSize = !selectedSize || n.includes(selectedSize.toLowerCase());
      return matchColor && matchDiopter && matchVersion && matchSize;
    }) || variants.find((v) => (v.name || "").toLowerCase().includes(versionName.toLowerCase()));
    if (matched?.sku && setSelectedVariant) {
      setSelectedVariant(matched.sku);
    }
  };

  const handleSelectSize = (sizeName) => {
    setSelectedSize(sizeName);
    const matched = variants.find((v) => {
      const n = (v.name || "").toLowerCase();
      const matchColor = !selectedColor || n.includes(selectedColor.toLowerCase());
      const matchDiopter = !selectedDiopter || n.includes(selectedDiopter.toLowerCase());
      const matchVersion = !selectedVersion || n.includes(selectedVersion.toLowerCase());
      const matchSize = n.includes(sizeName.toLowerCase());
      return matchColor && matchDiopter && matchVersion && matchSize;
    }) || variants.find((v) => (v.name || "").toLowerCase().includes(sizeName.toLowerCase()));
    if (matched?.sku && setSelectedVariant) {
      setSelectedVariant(matched.sku);
    }
  };
  const similar = getProducts().filter((item) => item.slug !== product.slug).slice(0, 4);
  const customDetailLines = Array.isArray(specifications.customDetails)
    ? specifications.customDetails.filter(Boolean)
    : typeof specifications.customDetails === "string"
      ? specifications.customDetails.split("\n").map((l) => l.trim()).filter(Boolean)
      : typeof specifications.detailsText === "string"
        ? specifications.detailsText.split("\n").map((l) => l.trim()).filter(Boolean)
        : [];

  const productDetails = [
    ["Danh mục", getProductMenuCategoryLabels(product).join(" · ")],
    ["Chất liệu gọng", specifications.frameMaterial],
    ["Chất liệu tròng", specifications.lensMaterial],
    ["Loại tròng", specifications.lensType],
  ].filter(([, value]) => value);

  const details = [
    [
      "details",
      content.detailsTitle,
      <div className="space-y-2 text-xs leading-6 text-black">
        {customDetailLines.length > 0 ? (
          <div className="space-y-1 text-xs leading-6 text-neutral-900">
            {customDetailLines.map((line, idx) => {
              if (!line) return <div key={idx} className="h-2" />;
              return (
                <p key={idx} className={idx === 0 ? "mb-2 font-medium text-black" : "text-neutral-800"}>
                  {line}
                </p>
              );
            })}
          </div>
        ) : productDetails.length ? (
          productDetails.map(([label, value]) => (
            <p key={label}>
              {label} · {value}
            </p>
          ))
        ) : (
          <p>Thông tin sản phẩm sẽ được cập nhật.</p>
        )}
      </div>,
    ],
    [
      "shipping",
      content.shippingTitle,
      <div className="space-y-2 text-xs leading-6 text-black">
        <p>{content.shippingDescription}</p>
        <p>{content.returnDescription}</p>
        <p>{content.taxDescription}</p>
      </div>,
    ],
  ];

  return <main className="px-5 pb-16 pt-[100px] md:px-[4.2vw] md:pt-[112px]">
    <div className="mb-4 flex flex-wrap items-center gap-2 text-[9px] uppercase tracking-[.08em] text-black"><a href="/">Trang chủ</a><span>/</span><a href="/store">Cửa hàng</a><span>/</span><span>{product.name}</span></div>
    <div className="grid gap-7 lg:grid-cols-[1.55fr_.7fr] lg:gap-[5.5vw]">
      <section className="grid grid-cols-2 gap-1.5">{gallery.map((image, index) => <button key={image} className={`relative aspect-[.82] overflow-hidden bg-[#f2f3f5] ${gallery.length === 1 ? "col-span-2" : ""} ${index > 1 ? "hidden md:block" : ""}`} onClick={() => onZoom(image)} aria-label="Phóng to hình sản phẩm"><img className="h-full w-full object-cover" src={image} alt={`${product.name} · góc nhìn ${index + 1}`} /></button>)}</section>
      <aside className="lg:sticky lg:top-[100px] lg:self-start">
        <h1 className="font-display text-4xl md:text-[42px]">{product.name}</h1>
        <p className="mt-4 text-xs uppercase tracking-[.08em]">{getPrimaryProductMenuCategory(product)}</p>
        <div className="mt-4 flex items-center gap-3">
          <p className="text-lg tabular-nums">{formatPrice(currentPrice)}</p>
          {isOutOfStock && (
            <span className="rounded-full bg-neutral-900 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[.06em] text-white">
              Hết hàng
            </span>
          )}
        </div>

        {/* Matrix of Variant Attributes: Màu sắc, Độ cận, Phiên bản, Kích thước */}
        <div className="storefront-variant-matrix">
          {attributes.colors.length > 0 && (
            <div className="storefront-variant-row">
              <span className="storefront-variant-label">Màu sắc</span>
              <div className="storefront-variant-options">
                {attributes.colors.map((c) => {
                  const isSelected = selectedColor === c.name;
                  const isComboAvailable = !attributes.diopters.length || variants.some((v) => {
                    const n = (v.name || "").toLowerCase();
                    return n.includes(c.name.toLowerCase()) && (!selectedDiopter || n.includes(selectedDiopter.toLowerCase()));
                  });
                  return (
                    <button
                      key={c.name}
                      type="button"
                      className={`storefront-variant-pill ${isSelected ? "is-selected" : ""} ${!isComboAvailable ? "is-disabled" : ""}`}
                      onClick={() => handleSelectColor(c.name)}
                      aria-pressed={isSelected}
                      title={!isComboAvailable ? "Tổ hợp này hiện không có sẵn" : undefined}
                    >
                      <span
                        className="storefront-swatch-dot"
                        style={{ backgroundColor: c.swatch || "#000000" }}
                      />
                      <span className="storefront-variant-pill-title">{formatVariantLabel(c.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {attributes.versions.length > 0 && !attributes.colors.length && (
            <div className="storefront-variant-row">
              <span className="storefront-variant-label">Phiên bản</span>
              <div className="storefront-variant-options">
                {attributes.versions.map((ver) => {
                  const isSelected = selectedVersion === ver.name;
                  const isComboAvailable = variants.some((v) => (v.name || "").toLowerCase().includes(ver.name.toLowerCase()));
                  return (
                    <button
                      key={ver.name}
                      type="button"
                      className={`storefront-variant-pill ${isSelected ? "is-selected" : ""} ${!isComboAvailable ? "is-disabled" : ""}`}
                      onClick={() => handleSelectVersion(ver.name)}
                      aria-pressed={isSelected}
                      title={!isComboAvailable ? "Tổ hợp này hiện không có sẵn" : undefined}
                    >
                      <span className="storefront-variant-pill-title">{formatVariantLabel(ver.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {attributes.diopters.length > 0 && (
            <div className="storefront-variant-row">
              <span className="storefront-variant-label">Độ cận</span>
              <div className="storefront-variant-options">
                {attributes.diopters.map((d) => {
                  const isSelected = selectedDiopter === d.name;
                  const isComboAvailable = !attributes.colors.length || variants.some((v) => {
                    const n = (v.name || "").toLowerCase();
                    return (!selectedColor || n.includes(selectedColor.toLowerCase())) && n.includes(d.name.toLowerCase());
                  });
                  return (
                    <button
                      key={d.name}
                      type="button"
                      className={`storefront-variant-pill ${isSelected ? "is-selected" : ""} ${!isComboAvailable ? "is-disabled" : ""}`}
                      onClick={() => handleSelectDiopter(d.name)}
                      aria-pressed={isSelected}
                      title={!isComboAvailable ? "Tổ hợp này hiện không có sẵn" : undefined}
                    >
                      <span className="storefront-variant-pill-title">{formatVariantLabel(d.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {attributes.versions.length > 0 && attributes.colors.length > 0 && (
            <div className="storefront-variant-row">
              <span className="storefront-variant-label">Phiên bản</span>
              <div className="storefront-variant-options">
                {attributes.versions.map((ver) => {
                  const isSelected = selectedVersion === ver.name;
                  const isComboAvailable = variants.some((v) => {
                    const n = (v.name || "").toLowerCase();
                    return (!selectedColor || n.includes(selectedColor.toLowerCase())) && n.includes(ver.name.toLowerCase());
                  });
                  return (
                    <button
                      key={ver.name}
                      type="button"
                      className={`storefront-variant-pill ${isSelected ? "is-selected" : ""} ${!isComboAvailable ? "is-disabled" : ""}`}
                      onClick={() => handleSelectVersion(ver.name)}
                      aria-pressed={isSelected}
                      title={!isComboAvailable ? "Tổ hợp này hiện không có sẵn" : undefined}
                    >
                      <span className="storefront-variant-pill-title">{formatVariantLabel(ver.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {attributes.sizes.length > 0 && (
            <div className="storefront-variant-row">
              <span className="storefront-variant-label">Kích thước</span>
              <div className="storefront-variant-options">
                {attributes.sizes.map((s) => {
                  const isSelected = selectedSize === s.name;
                  const isComboAvailable = variants.some((v) => {
                    const n = (v.name || "").toLowerCase();
                    return (!selectedColor || n.includes(selectedColor.toLowerCase())) && n.includes(s.name.toLowerCase());
                  });
                  return (
                    <button
                      key={s.name}
                      type="button"
                      className={`storefront-variant-pill ${isSelected ? "is-selected" : ""} ${!isComboAvailable ? "is-disabled" : ""}`}
                      onClick={() => handleSelectSize(s.name)}
                      aria-pressed={isSelected}
                      title={!isComboAvailable ? "Tổ hợp này hiện không có sẵn" : undefined}
                    >
                      <span className="storefront-variant-pill-title">{formatVariantLabel(s.name)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {!isAvailable ? (
          <button
            type="button"
            disabled
            className="mt-1 flex min-h-[54px] w-full cursor-not-allowed items-center justify-between rounded-full bg-neutral-200 px-6 text-xs font-semibold text-neutral-500"
          >
            <span>Tổ hợp này hiện không có sẵn</span>
            <span className="tabular-nums font-normal">{formatPrice(currentPrice)}</span>
          </button>
        ) : isOutOfStock ? (
          <button
            type="button"
            disabled
            className="mt-1 flex min-h-[54px] w-full cursor-not-allowed items-center justify-between rounded-full bg-neutral-200 px-6 text-xs font-semibold text-neutral-500"
          >
            <span>Hết hàng</span>
            <span className="tabular-nums font-normal">{formatPrice(currentPrice)}</span>
          </button>
        ) : (
          <button
            type="button"
            className="mt-1 flex min-h-[54px] w-full items-center justify-between rounded-full bg-black px-6 text-xs text-white transition hover:bg-neutral-800"
            onClick={() => onAdd(product, currentSku, 1)}
          >
            <span>Thêm vào giỏ</span>
            <span>{formatPrice(currentPrice)}</span>
          </button>
        )}
        <p className="mt-4 text-center text-[9px] uppercase tracking-[.07em] text-black">{content.shippingNote}</p>
        <a className="mt-4 flex min-h-9 items-center justify-between py-1 text-[10px] uppercase tracking-[.05em]" href="/stores">{content.storeLocator}</a>
        <div className="mt-1 space-y-1">{details.map(([id, title, content]) => <section key={id}><button className="flex min-h-[42px] w-full items-center justify-between py-1 text-left text-[14px] tracking-[.08em]" onClick={() => setOpenSection(openSection === id ? "" : id)}>{title}<span className="text-base">{openSection === id ? "−" : "+"}</span></button>{openSection === id && <div className="pb-3 pt-1.5">{content}</div>}</section>)}</div>
        <p className="mt-7 text-[9px] uppercase tracking-[.08em] text-black">SKU · {currentSku}</p>
      </aside>
    </div>
    <section className="mt-20 md:mt-28" aria-labelledby="product-description-title">
      <div className="product-description-gallery">
        {gallery.map((image, index) => <figure key={`${image}-${index}`} className="product-description-gallery-item aspect-[.82] snap-start overflow-hidden bg-[#f1f2f2]"><img className="h-full w-full object-cover" loading="lazy" src={image} alt={`${product.name} · hình ${index + 1}`} /></figure>)}
      </div>
      <div className="mt-6 max-w-4xl md:mt-8">
        <h2 id="product-description-title" className="text-sm font-medium tracking-[.06em]">Mô tả</h2>
        {product.description && <p className="mt-2 whitespace-pre-line text-xs leading-6 text-neutral-800 md:mt-3 md:text-sm md:leading-7">{product.description}</p>}
        <a className="mt-4 inline-block border-b border-black pb-1 text-[10px] uppercase tracking-[.06em]" href={`/store?subCategory=${product.category?.at(-1) || "kinh-can"}`}>Khám phá thêm</a>
      </div>
    </section>
    <section className="pt-20 md:pt-28"><div className="mb-6 flex items-end justify-between"><h2 className="text-xl">{content.recommendationTitle}</h2><a className="pill-button text-[10px] uppercase" href="/store">{content.allProductsLabel}</a></div><div className="grid grid-cols-2 gap-x-2 gap-y-8 md:grid-cols-4 md:gap-x-3">{similar.map((item, index) => <ProductCard key={item.slug} product={item} index={index} onAdd={onAdd} onWishlist={onWishlist} wished={wishlist.includes(item.slug)} />)}</div></section>
  </main>;
}
