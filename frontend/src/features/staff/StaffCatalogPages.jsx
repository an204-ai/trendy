import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import InternalLayout from "../../shared/components/InternalLayout.jsx";
import Icon from "../../shared/components/Icon.jsx";
import { formatPrice } from "../../shared/services/storefront.js";
import {
  createStaffCategory, createStaffProduct, createStaffPromotion, deleteStaffCategory, deleteStaffProduct, deleteStaffPromotion,
  getStaffCategories, getStaffProducts, getStaffPromotions, updateProductStock, updateStaffCategory, updateStaffProduct, updateStaffPromotion,
} from "../../shared/services/api.js";

const slugify = (value) => value.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const STAFF_PAGE_SIZE = 10;

const PRESET_COLORS = [
  { hex: "#000000", name: "Đen bóng" },
  { hex: "#1F2937", name: "Đen nhám" },
  { hex: "#4B5563", name: "Xám chì" },
  { hex: "#9CA3AF", name: "Xám khói" },
  { hex: "#FFFFFF", name: "Trắng" },

  { hex: "#451A03", name: "Đồi mồi" },
  { hex: "#78350F", name: "Nâu Havana" },
  { hex: "#92400E", name: "Nâu cafe" },
  { hex: "#B45309", name: "Hổ phách" },
  { hex: "#D97706", name: "Vàng gold" },

  { hex: "#1E3A8A", name: "Xanh navy" },
  { hex: "#2563EB", name: "Xanh dương" },
  { hex: "#0284C7", name: "Xanh biển" },
  { hex: "#14B8A6", name: "Xanh ngọc" },
  { hex: "#047857", name: "Xanh lục" },

  { hex: "#365314", name: "Xanh rêu" },
  { hex: "#881337", name: "Đỏ rượu" },
  { hex: "#DC2626", name: "Đỏ ruby" },
  { hex: "#DB2777", name: "Hồng pastel" },
  { hex: "#7C3AED", name: "Tím thạch anh" },
];

const compressAndReadFile = (file) => {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

function StaffPagination({ page, pageCount, onChange }) {
  if (pageCount < 2) return null;
  return <nav className="staff-pagination" aria-label="Phân trang danh sách">
    <button className="staff-secondary-action" disabled={page === 1} onClick={() => onChange(page - 1)}>Trang trước</button>
    <button className="staff-secondary-action" disabled={page === pageCount} onClick={() => onChange(page + 1)}>Trang sau</button>
  </nav>;
}

export function formatMoneyInput(value) {
  if (value === undefined || value === null || value === "") return "";
  const clean = String(value).replace(/\D/g, "");
  if (!clean) return "";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function MoneyInput({
  value,
  onChange,
  placeholder = "0",
  required = false,
  className = "",
  style = {},
  disabled = false,
  id,
  name,
  ...props
}) {
  const displayValue = formatMoneyInput(value);

  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      onChange("");
    } else {
      onChange(Number(raw));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      id={id}
      name={name}
      className={className}
      style={style}
      disabled={disabled}
      required={required}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleInputChange}
      {...props}
    />
  );
}

function ColorPalettePicker({ value, onChange, onSelectColor }) {
  const currentColor = PRESET_COLORS.find((c) => c.hex.toLowerCase() === (value || "").toLowerCase());
  return (
    <div className="staff-color-picker-wrapper">
      <button
        type="button"
        className="staff-color-swatch-trigger"
        style={{ backgroundColor: value || "#111111" }}
        title={currentColor ? currentColor.name : "Chọn màu"}
      />
      <div className="staff-color-popover">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            className={`staff-color-dot ${value?.toLowerCase() === c.hex.toLowerCase() ? "is-selected" : ""}`}
            style={{ backgroundColor: c.hex }}
            title={c.name}
            onClick={() => {
              onChange(c.hex);
              if (onSelectColor) onSelectColor(c);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function SingleImageUploader({ label, value, onChange, required = false }) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressAndReadFile(file);
    if (dataUrl) onChange(dataUrl);
    e.target.value = "";
  };

  return (
    <div className="staff-uploader-card">
      <div className="staff-uploader-head">
        <span className="staff-field-card-title">{label}</span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {value ? (
        <div className="staff-uploader-preview">
          <img src={value} alt="" />
          <div className="staff-uploader-preview-actions">
            <button type="button" className="staff-secondary-action" onClick={() => fileInputRef.current?.click()}>
              Đổi ảnh
            </button>
            {!required && (
              <button type="button" className="staff-secondary-action" onClick={() => onChange("")} title="Xóa ảnh">
                <Icon name="close" className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button type="button" className="staff-uploader-empty-drop" onClick={() => fileInputRef.current?.click()}>
          <Icon name="plus" className="h-5 w-5" />
          <span>Tải ảnh từ máy</span>
        </button>
      )}
    </div>
  );
}

function GalleryUploader({ images, onAdd, onRemove }) {
  const fileInputRef = useRef(null);

  const handleFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const dataUrl = await compressAndReadFile(file);
      if (dataUrl) onAdd(dataUrl);
    }
    e.target.value = "";
  };

  return (
    <div className="staff-uploader-card">
      <div className="staff-uploader-head">
        <span className="staff-field-label" style={{ margin: 0 }}>HÌNH ẢNH TRONG TRANG CHI TIẾT</span>
        <button type="button" className="staff-secondary-action" onClick={() => fileInputRef.current?.click()}>
          <Icon name="plus" className="h-4 w-4" /> Thêm ảnh
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFilesChange}
        />
      </div>
      <div className="staff-gallery-grid">
        {images.map((url, idx) => (
          <div key={idx} className="staff-gallery-thumb">
            <img src={url} alt="" />
            <button
              type="button"
              className="staff-gallery-thumb-remove"
              onClick={() => onRemove(idx)}
              title="Xóa ảnh"
            >
              <Icon name="close" className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function VariantImageUploader({ value, onChange }) {
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressAndReadFile(file);
    if (dataUrl) onChange(dataUrl);
    e.target.value = "";
  };

  return (
    <div className="staff-variant-img-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {value ? (
        <div className="staff-variant-thumb-box">
          <img src={value} alt="" />
          <button
            type="button"
            className="staff-variant-thumb-clear"
            onClick={() => onChange("")}
            title="Xóa ảnh"
          >
            <Icon name="close" className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="staff-variant-thumb-empty"
          onClick={() => fileInputRef.current?.click()}
          title="Tải ảnh biến thể"
        >
          <Icon name="plus" className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function buildCategoryTree(categories) {
  const categoryMap = new Map();
  (categories || []).forEach((cat) => {
    if (!cat?.id) return;
    if (!categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, {
        id: cat.id,
        title: cat.title,
        label: cat.label || cat.title,
        parentId: cat.parentId || null,
        sortOrder: cat.sortOrder ?? 0,
        active: cat.active !== false,
        children: [],
      });
    }
    if (Array.isArray(cat.children)) {
      cat.children.forEach((child) => {
        if (!child?.id) return;
        if (!categoryMap.has(child.id)) {
          categoryMap.set(child.id, {
            id: child.id,
            title: child.title,
            label: child.label || child.title,
            parentId: child.parentId || cat.id,
            sortOrder: child.sortOrder ?? 0,
            active: child.active !== false,
            children: [],
          });
        }
      });
    }
  });

  const rootParents = [];
  const childrenMap = new Map();

  categoryMap.forEach((item) => {
    if (!item.parentId) {
      rootParents.push(item);
    } else {
      if (!childrenMap.has(item.parentId)) {
        childrenMap.set(item.parentId, []);
      }
      childrenMap.get(item.parentId).push(item);
    }
  });

  return rootParents.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "vi")).map((parent) => ({
    ...parent,
    children: (childrenMap.get(parent.id) || []).sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "vi")),
  }));
}

function StaffProductEditor({ form, categories, onSave, onCancel, busy, error }) {
  const [activeTab, setActiveTab] = useState("info");
  const [name, setName] = useState(form.name || "");
  const [code, setCode] = useState(form.code || form.sku || "");
  const [slug, setSlug] = useState(form.slug || "");
  const [baseSku, setBaseSku] = useState(form.sku || form.code || "");
  const [price, setPrice] = useState(form.price !== undefined ? form.price : "");
  const [image, setImage] = useState(form.image || "");
  const [front, setFront] = useState(form.front || "");
  const [description, setDescription] = useState(form.description || "");
  const [categoryIds, setCategoryIds] = useState(form.category || []);
  const [active, setActive] = useState(form.active !== false);

  const [galleryImages, setGalleryImages] = useState(() => (form.images || []).map((img) => img.url || img));

  const [isMultiVariant, setIsMultiVariant] = useState(() => {
    if (!form.variants || form.variants.length <= 1) {
      if (form.variants?.[0]?.name && form.variants[0].name !== "Mặc định") return true;
      return false;
    }
    return true;
  });

  const [singleStock, setSingleStock] = useState(() => form.variants?.[0]?.stockOnHand ?? "0");

  const [variants, setVariants] = useState(() => {
    if (form.variants && form.variants.length) {
      return form.variants.map((v) => ({
        sku: v.sku || "",
        name: v.name || "",
        swatch: v.swatch || "#000000",
        price: v.price ?? "",
        stockOnHand: v.stockOnHand ?? "0",
        image: v.image || "",
      }));
    }
    return [{ sku: form.sku ? `${form.sku}-01` : "", name: "Đen", swatch: "#000000", price: "", stockOnHand: "10", image: "" }];
  });

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const handleNameChange = (val) => {
    setName(val);
    if (!form.id && !slug) {
      setSlug(slugify(val));
    }
  };

  const handleSkuChange = (val) => {
    setBaseSku(val);
    setCode(val);
  };

  const addGalleryImage = (dataUrl) => {
    if (!dataUrl) return;
    setGalleryImages((curr) => [...curr, dataUrl]);
  };

  const removeGalleryImage = (idx) => {
    setGalleryImages((curr) => curr.filter((_, i) => i !== idx));
  };

  const addVariant = () => {
    const nextIdx = variants.length + 1;
    const defaultSku = baseSku.trim() ? `${baseSku.trim()}-${String(nextIdx).padStart(2, "0")}` : "";
    setVariants((curr) => [
      ...curr,
      {
        sku: defaultSku,
        name: `Biến thể mới`,
        swatch: "#000000",
        price: "",
        stockOnHand: "0",
        image: "",
      },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length <= 1) return;
    setVariants((curr) => curr.filter((_, i) => i !== index));
  };

  const updateVariant = (index, field, value) => {
    setVariants((curr) => curr.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const toggleCategory = (id) => {
    setCategoryIds((curr) => curr.includes(id) ? curr.filter((item) => item !== id) : [...curr, id]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const effectiveSku = baseSku.trim() || (isMultiVariant ? variants[0]?.sku.trim() : "");
    const effectiveCode = code.trim() || effectiveSku;
    let effectiveVariants = [];
    if (!isMultiVariant) {
      effectiveVariants = [{
        sku: effectiveSku,
        name: "Mặc định",
        stockOnHand: singleStock !== "" ? Number(singleStock) : 0,
        price: price !== "" ? Number(price) : undefined,
      }];
    } else {
      effectiveVariants = variants
        .filter((v) => v.sku.trim())
        .map((v) => ({
          sku: v.sku.trim(),
          name: v.name.trim() || "Mặc định",
          swatch: v.swatch.trim() || undefined,
          price: v.price !== "" ? Number(v.price) : undefined,
          stockOnHand: v.stockOnHand !== "" ? Number(v.stockOnHand) : 0,
          image: v.image.trim() || undefined,
        }));
      if (!effectiveVariants.length) {
        effectiveVariants = [{
          sku: effectiveSku,
          name: "Mặc định",
          stockOnHand: 0,
        }];
      }
    }

    onSave({
      code: effectiveCode,
      slug: slug.trim() || slugify(name),
      name: name.trim(),
      sku: effectiveSku,
      price: Number(price) || 0,
      active,
      image: image.trim(),
      front: image.trim() || undefined,
      description: description.trim() || undefined,
      categoryIds,
      images: galleryImages.filter(Boolean),
      variants: effectiveVariants,
    });
  };

  return (
    <section className="staff-management-panel">
      <nav className="staff-form-tabs" aria-label="Các bước thông tin sản phẩm">
        <button type="button" className={`staff-form-tab-btn ${activeTab === "info" ? "is-active" : ""}`} onClick={() => setActiveTab("info")}>
          Thông tin chung
        </button>
        <button type="button" className={`staff-form-tab-btn ${activeTab === "media" ? "is-active" : ""}`} onClick={() => setActiveTab("media")}>
          Hình ảnh và mô tả
        </button>
        <button type="button" className={`staff-form-tab-btn ${activeTab === "variants" ? "is-active" : ""}`} onClick={() => setActiveTab("variants")}>
          Biến thể và kho hàng
        </button>
      </nav>

      <form onSubmit={handleSubmit}>
        {activeTab === "info" && (
          <div className="staff-form-unified-box">
            <div className="staff-form-grid-2">
              <label className="profile-field" style={{ margin: 0 }}>
                <span>TÊN SẢN PHẨM *</span>
                <input required minLength={2} maxLength={160} value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Gentle Monster Her" />
              </label>
              <label className="profile-field" style={{ margin: 0 }}>
                <span>MÃ SKU *</span>
                <input required maxLength={80} value={baseSku} onChange={(e) => handleSkuChange(e.target.value)} placeholder="TR-0012" />
              </label>
            </div>

            <div className="staff-form-grid-2">
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <label className="profile-field" style={{ flex: 1, margin: 0 }}>
                  <span>ĐƯỜNG DẪN TĨNH *</span>
                  <input required maxLength={120} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="gentle-monster-her" />
                </label>
                <button type="button" className="staff-secondary-action" style={{ minHeight: "44px" }} onClick={() => setSlug(slugify(name))}>
                  Tạo từ tên
                </button>
              </div>
              <label className="profile-field" style={{ margin: 0 }}>
                <span>GIÁ BÁN TIÊU CHUẨN *</span>
                <MoneyInput required value={price} onChange={(val) => setPrice(val)} placeholder="6.800.000" />
              </label>
            </div>

            <div className="staff-form-grid-2">
              <label className="profile-field" style={{ margin: 0 }}>
                <span>TRẠNG THÁI</span>
                <select value={active ? "active" : "inactive"} onChange={(e) => setActive(e.target.value === "active")}>
                  <option value="active">Đang bán</option>
                  <option value="inactive">Ngừng bán</option>
                </select>
              </label>
            </div>

            <div className="staff-category-tree-box">
              <span className="staff-field-label">DANH MỤC SẢN PHẨM</span>
              <div className="staff-category-groups-list">
                {categoryTree.map((parent) => {
                  const isParentSelected = categoryIds.includes(parent.id);
                  return (
                    <div key={parent.id} className="staff-category-parent-block">
                      <div className="staff-category-parent-header">
                        <button
                          type="button"
                          className={`staff-category-chip is-parent ${isParentSelected ? "is-selected" : ""}`}
                          onClick={() => toggleCategory(parent.id)}
                        >
                          {isParentSelected ? "✓" : "+"} {parent.label || parent.title}
                        </button>
                      </div>
                      {parent.children?.length > 0 && (
                        <div className="staff-category-children-list">
                          {parent.children.map((child) => {
                            const isChildSelected = categoryIds.includes(child.id);
                            return (
                              <button
                                key={child.id}
                                type="button"
                                className={`staff-category-chip ${isChildSelected ? "is-selected" : ""}`}
                                onClick={() => toggleCategory(child.id)}
                              >
                                {isChildSelected ? "✓" : "+"} {child.label || child.title}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === "media" && (
          <div className="staff-form-unified-box">
            <SingleImageUploader
              label="HÌNH ĐẠI DIỆN *"
              value={image}
              onChange={setImage}
              required={true}
            />

            <GalleryUploader
              images={galleryImages}
              onAdd={addGalleryImage}
              onRemove={removeGalleryImage}
            />

            <div>
              <label className="profile-field" style={{ margin: 0 }}>
                <span>MÔ TẢ CHI TIẾT SẢN PHẨM</span>
                <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập mô tả sản phẩm, chất liệu gọng kính, thông số kích thước tròng..." />
              </label>
            </div>
          </div>
        )}

        {activeTab === "variants" && (
          <section className="staff-variants-unified-section">
            <div className="staff-variants-toggle-bar">
              <button
                type="button"
                className={`staff-variants-toggle-btn ${!isMultiVariant ? "is-active" : ""}`}
                onClick={() => setIsMultiVariant(false)}
              >
                Sản phẩm đơn
              </button>
              <button
                type="button"
                className={`staff-variants-toggle-btn ${isMultiVariant ? "is-active" : ""}`}
                onClick={() => setIsMultiVariant(true)}
              >
                Nhiều biến thể
              </button>
            </div>

            {!isMultiVariant ? (
              <div className="staff-form-grid-2">
                <label className="profile-field">
                  <span>MÃ SKU SẢN PHẨM *</span>
                  <input required value={baseSku} onChange={(e) => handleSkuChange(e.target.value)} placeholder="GM-HER-01" />
                </label>
                <label className="profile-field">
                  <span>SỐ LƯỢNG TỒN KHO *</span>
                  <input type="number" min={0} required value={singleStock} onChange={(e) => setSingleStock(e.target.value)} placeholder="0" />
                </label>
              </div>
            ) : (
              <>
                <div className="staff-variants-toolbar">
                  <label className="profile-field" style={{ flex: 1, minWidth: "220px", margin: 0 }}>
                    <span>MÃ SKU GỐC *</span>
                    <input required value={baseSku} onChange={(e) => handleSkuChange(e.target.value)} placeholder="GM-HER" />
                  </label>
                  <button type="button" className="staff-primary-action" onClick={addVariant}>
                    <Icon name="plus" className="h-4 w-4" /> Thêm biến thể
                  </button>
                </div>

                <div className="staff-variant-flat-list">
                  {variants.map((v, idx) => (
                    <div key={idx} className="staff-variant-flat-item">
                      <div className="staff-variant-flat-head">
                        <strong>Biến thể: {v.name || "Mới"}</strong>
                        {variants.length > 1 && (
                          <button
                            type="button"
                            className="staff-secondary-action"
                            style={{ minHeight: "32px", padding: "0 10px" }}
                            onClick={() => removeVariant(idx)}
                            title="Xóa biến thể"
                          >
                            <Icon name="close" className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="staff-variant-flat-fields">
                        <label className="profile-field" style={{ margin: 0 }}>
                          <span>TÊN BIẾN THỂ *</span>
                          <input required value={v.name} onChange={(e) => updateVariant(idx, "name", e.target.value)} placeholder="Đen bóng" />
                        </label>
                        <label className="profile-field" style={{ margin: 0 }}>
                          <span>MÃ SKU *</span>
                          <input required value={v.sku} onChange={(e) => updateVariant(idx, "sku", e.target.value)} placeholder="GM-HER-01" />
                        </label>
                        <div style={{ display: "grid", gap: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: ".06em", color: "#333", textTransform: "uppercase" }}>MÀU SẮC</span>
                          <ColorPalettePicker
                            value={v.swatch}
                            onChange={(colorHex) => updateVariant(idx, "swatch", colorHex)}
                            onSelectColor={(colorObj) => {
                              if (!v.name || v.name === "Biến thể mới" || v.name === "Mặc định") {
                                updateVariant(idx, "name", colorObj.name);
                              }
                            }}
                          />
                        </div>
                        <label className="profile-field" style={{ margin: 0 }}>
                          <span>TỒN KHO</span>
                          <input type="number" min={0} value={v.stockOnHand} onChange={(e) => updateVariant(idx, "stockOnHand", e.target.value)} />
                        </label>
                        <label className="profile-field" style={{ margin: 0 }}>
                          <span>GIÁ RIÊNG</span>
                          <MoneyInput value={v.price} onChange={(val) => updateVariant(idx, "price", val)} placeholder="Theo giá gốc" />
                        </label>
                        <div style={{ display: "grid", gap: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: ".06em", color: "#333", textTransform: "uppercase" }}>ẢNH</span>
                          <VariantImageUploader
                            value={v.image}
                            onChange={(imgUrl) => updateVariant(idx, "image", imgUrl)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        )}

        {error && <p className="staff-form-error" style={{ marginTop: "16px" }} role="alert">{error}</p>}

        <div className="staff-management-form-actions" style={{ justifyContent: "space-between", alignItems: "center", marginTop: "24px" }}>
          <div>
            {activeTab !== "info" && (
              <button type="button" className="staff-secondary-action" onClick={() => {
                const tabs = ["info", "media", "variants"];
                const currIdx = tabs.indexOf(activeTab);
                if (currIdx > 0) setActiveTab(tabs[currIdx - 1]);
              }}>
                Quay lại
              </button>
            )}
            {activeTab !== "variants" && (
              <button type="button" className="staff-secondary-action" style={{ marginLeft: "8px" }} onClick={() => {
                const tabs = ["info", "media", "variants"];
                const currIdx = tabs.indexOf(activeTab);
                if (currIdx < tabs.length - 1) setActiveTab(tabs[currIdx + 1]);
              }}>
                Tiếp theo
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" className="staff-secondary-action" onClick={onCancel}>Hủy</button>
            <button type="submit" className="staff-primary-action" disabled={busy}>
              {busy ? "ĐANG LƯU SẢN PHẨM…" : form.id ? "LƯU CẬP NHẬT" : "TẠO SẢN PHẨM"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

export function StaffProductsPage({ user, onLogout, onCatalogChanged }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [stockProductId, setStockProductId] = useState("");
  const [stockDraft, setStockDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [stockBusy, setStockBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = async () => {
    const [items, groups] = await Promise.all([getStaffProducts(), getStaffCategories()]);
    setProducts(items); setCategories(groups);
  };
  useEffect(() => { refresh().catch((reason) => setError(reason.message)); }, []);

  const categoryNames = useMemo(() => new Map(categories.flatMap((category) => [category, ...(category.children || [])]).map((category) => [category.id, category.label || category.title])), [categories]);
  const visibleProducts = useMemo(() => products.filter((product) => `${product.name} ${product.code} ${product.sku}`.toLocaleLowerCase("vi").includes(filter.trim().toLocaleLowerCase("vi"))), [products, filter]);
  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / STAFF_PAGE_SIZE));
  const pageProducts = visibleProducts.slice((page - 1) * STAFF_PAGE_SIZE, page * STAFF_PAGE_SIZE);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const beginCreate = () => { setForm({}); setError(""); setNotice(""); };
  const beginEdit = (product) => { setForm({ ...product }); setError(""); setNotice(""); };

  const handleSaveProduct = async (payload) => {
    setBusy(true); setError(""); setNotice("");
    try {
      if (form.id) await updateStaffProduct(form.id, payload);
      else await createStaffProduct(payload);
      await refresh(); await onCatalogChanged(); setForm(null);
      setNotice(form.id ? "Đã cập nhật sản phẩm thành công" : "Đã tạo sản phẩm mới thành công");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleProductActive = async (product) => {
    const nextActive = !product.active;
    if (!window.confirm(`${nextActive ? "Mở bán lại" : "Ngừng bán"} sản phẩm ${product.name}?`)) return;
    setError(""); setNotice("");
    try {
      await updateStaffProduct(product.id, { active: nextActive });
      await refresh(); await onCatalogChanged();
      setNotice(nextActive ? `Đã mở bán lại ${product.name}` : `Đã ngừng bán ${product.name}`);
    } catch (reason) { setError(reason.message); }
  };
  const removeProduct = async (product) => {
    if (!window.confirm(`Xóa vĩnh viễn sản phẩm “${product.name}”? Sản phẩm sẽ bị gỡ khỏi danh mục và không thể khôi phục.`)) return;
    setError(""); setNotice("");
    try { await deleteStaffProduct(product.id); await refresh(); await onCatalogChanged(); setNotice(`Đã xóa sản phẩm ${product.name}`); }
    catch (reason) { setError(reason.message); }
  };
  const saveStock = async (product, variant) => {
    const key = `${product.id}:${variant.sku}`;
    const value = stockDraft[key] ?? variant.stockOnHand ?? 0;
    setStockBusy(key); setError(""); setNotice("");
    try {
      await updateProductStock(product.id, variant.sku, Number(value));
      await refresh(); await onCatalogChanged?.(); setNotice(`Đã cập nhật tồn kho ${variant.sku}`);
    } catch (reason) { setError(reason.message); }
    finally { setStockBusy(""); }
  };

  if (form) {
    return (
      <InternalLayout active="products" isAdmin={user?.role === "ADMIN"} user={user} onLogout={onLogout}>
        <div className="staff-detail-page-header">
          <button type="button" className="staff-secondary-action staff-back-btn" onClick={() => setForm(null)}>
            ← Quay lại danh sách sản phẩm
          </button>
          <h1 className="staff-page-subheading">
            {form.id ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </h1>
        </div>
        {error && <p className="staff-form-error" role="alert">{error}</p>}
        {notice && <p className="staff-form-notice" role="status">{notice}</p>}
        <StaffProductEditor
          form={form}
          categories={categories}
          onSave={handleSaveProduct}
          onCancel={() => setForm(null)}
          busy={busy}
          error={error}
        />
      </InternalLayout>
    );
  }

  return <InternalLayout active="products" isAdmin={user?.role === "ADMIN"} user={user} onLogout={onLogout}>
    <header className="internal-page-heading"><h1 className="font-display">Sản phẩm</h1></header>
    <div className="staff-management-toolbar">
      <input aria-label="Tìm sản phẩm" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }} placeholder="Tìm theo tên, mã hoặc SKU" />
      <button className="staff-primary-action" onClick={beginCreate}>
        <Icon name="plus" className="h-4 w-4" /> Thêm sản phẩm
      </button>
    </div>
    {error && <p className="staff-form-error" role="alert">{error}</p>}{notice && <p className="staff-form-notice" role="status">{notice}</p>}
    <div className="staff-table-scroll"><table className="staff-data-table"><thead><tr><th>Ảnh</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá bán</th><th>Tồn kho</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
      {pageProducts.map((product) => {
        const variants = product.variants || [];
        const stockTotal = variants.reduce((total, variant) => total + Number(variant.stockOnHand || 0), 0);
        const stockOpen = stockProductId === product.id;
        return <Fragment key={product.id}>
          <tr className="staff-data-row">
            <td><img className="staff-table-product-image" src={product.front || product.image} alt="" /></td>
            <td><strong>{product.name}</strong><span>{product.code} · {product.sku}</span></td>
            <td>{(product.category || []).map((id) => categoryNames.get(id)).filter(Boolean).join(", ") || "Chưa phân loại"}</td>
            <td>{formatPrice(product.price)}</td>
            <td><button className="staff-stock-toggle" aria-expanded={stockOpen} onClick={() => setStockProductId(stockOpen ? "" : product.id)}>Chi tiết tồn kho</button></td>
            <td>{product.active ? "Đang bán" : "Đã ngừng bán"}</td>
            <td><div className="staff-table-actions"><button className="staff-secondary-action" onClick={() => beginEdit(product)}>Sửa</button><button className="staff-secondary-action" onClick={() => toggleProductActive(product)}>{product.active ? "Ngừng bán" : "Mở bán"}</button><button className="staff-secondary-action is-danger" onClick={() => removeProduct(product)}>Xóa</button></div></td>
          </tr>
          {stockOpen && <tr className="staff-data-expanded-row"><td colSpan="7"><div className="staff-stock-list">{variants.length ? variants.map((variant) => { const key = `${product.id}:${variant.sku}`; return <div className="staff-stock-row" key={variant.sku}><span>{variant.name} · {variant.sku}</span><label>Tồn kho<input aria-label={`Tồn kho ${variant.sku}`} type="number" min="0" value={stockDraft[key] ?? variant.stockOnHand ?? ""} onChange={(event) => setStockDraft((current) => ({ ...current, [key]: event.target.value }))} /></label><button className="staff-secondary-action" disabled={stockBusy === key} onClick={() => saveStock(product, variant)}>{stockBusy === key ? "ĐANG LƯU…" : "Lưu tồn kho"}</button></div>; }) : <p>Sản phẩm chưa có SKU để quản lý tồn kho.</p>}</div></td></tr>}
        </Fragment>;
      })}
      {!pageProducts.length && <tr className="staff-data-row"><td colSpan="7">Không tìm thấy sản phẩm.</td></tr>}
    </tbody></table></div>
    <StaffPagination page={page} pageCount={pageCount} onChange={setPage} />
  </InternalLayout>;
}

export function StaffCategoriesPage({ user, onLogout, onCatalogChanged }) {
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [defaultParentId, setDefaultParentId] = useState("");
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const categoryFormRef = useRef(null);

  const refresh = async () => setCategories(await getStaffCategories());
  useEffect(() => { refresh().catch((reason) => setError(reason.message)); }, []);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const rootCategories = useMemo(() => {
    return categoryTree.map((c) => ({ id: c.id, title: c.title, label: c.label || c.title }));
  }, [categoryTree]);
  const filteredTree = useMemo(() => {
    const q = filter.trim().toLocaleLowerCase("vi");
    if (!q) return categoryTree;
    return categoryTree.map((parent) => {
      const parentMatches = `${parent.title} ${parent.label || ""} ${parent.id}`.toLocaleLowerCase("vi").includes(q);
      const matchingChildren = (parent.children || []).filter((child) =>
        `${child.title} ${child.label || ""} ${child.id}`.toLocaleLowerCase("vi").includes(q)
      );
      if (parentMatches || matchingChildren.length > 0) {
        return {
          ...parent,
          children: parentMatches ? parent.children : matchingChildren,
        };
      }
      return null;
    }).filter(Boolean);
  }, [categoryTree, filter]);

  const openCreate = () => {
    setEditing(null);
    setDefaultParentId("");
    setError("");
    setNotice("");
    setFormOpen(true);
  };

  const openAddChild = (parent) => {
    setEditing(null);
    setDefaultParentId(parent.id);
    setError("");
    setNotice("");
    setFormOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setDefaultParentId("");
    setError("");
    setNotice("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setDefaultParentId("");
  };

  useEffect(() => {
    if (!formOpen) return undefined;
    const frame = window.requestAnimationFrame(() => {
      categoryFormRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      categoryFormRef.current?.querySelector('input[name="title"]')?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [formOpen, editing?.id, defaultParentId]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = {
      title: values.title.trim(),
      label: (values.label || values.title).trim(),
      ...(values.parentId ? { parentId: values.parentId } : { parentId: null }),
      sortOrder: Number(values.sortOrder || 0),
      ...(!editing?.id ? { id: values.id?.trim() || slugify(values.title) } : {}),
    };
    try {
      if (editing?.id) await updateStaffCategory(editing.id, payload);
      else await createStaffCategory(payload);
      await refresh();
      await onCatalogChanged();
      closeForm();
      setNotice(editing?.id ? "Đã cập nhật danh mục thành công" : "Đã tạo danh mục mới thành công");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (category) => {
    const nextActive = !category.active;
    if (!window.confirm(`${nextActive ? "Bật lại" : "Ngừng sử dụng"} danh mục ${category.label || category.title}?`)) return;
    setError("");
    setNotice("");
    try {
      await updateStaffCategory(category.id, { active: nextActive });
      await refresh();
      await onCatalogChanged();
      setNotice(nextActive ? "Đã bật lại danh mục" : "Đã ngừng sử dụng danh mục");
    } catch (reason) {
      setError(reason.message);
    }
  };

  const remove = async (category) => {
    const descendants = category.children?.length ? " Danh mục con cũng sẽ bị xóa." : "";
    if (!window.confirm(`Xóa vĩnh viễn danh mục “${category.label || category.title}”? Danh mục sẽ được gỡ khỏi các sản phẩm.${descendants} Không thể khôi phục.`)) return;
    setError("");
    setNotice("");
    try {
      await deleteStaffCategory(category.id);
      await refresh();
      await onCatalogChanged();
      if (editing?.id === category.id || category.children?.some((child) => child.id === editing?.id)) closeForm();
      setNotice(`Đã xóa danh mục ${category.label || category.title}`);
    } catch (reason) {
      setError(reason.message);
    }
  };

  const renderForm = () => (
    <section className="staff-management-panel staff-category-inline-form" ref={categoryFormRef}>
      <div className="staff-management-panel-head">
        <h2>{editing?.id ? "Chỉnh sửa danh mục" : defaultParentId ? "Thêm danh mục con" : "Thêm danh mục mới"}</h2>
        <button type="button" className="staff-secondary-action" onClick={closeForm}>Đóng</button>
      </div>
      {error && <p className="staff-form-error" role="alert">{error}</p>}
      <form key={editing?.id || defaultParentId || "new-category"} className="staff-management-form staff-category-form" onSubmit={submit}>
        {!editing?.id && (
          <label className="profile-field">
            <span>MÃ DANH MỤC · CÓ THỂ ĐỂ TRỐNG</span>
            <input name="id" defaultValue="" placeholder="tu-dong-tao-tu-ten" />
          </label>
        )}
        <label className="profile-field">
          <span>TÊN DANH MỤC *</span>
          <input name="title" required defaultValue={editing?.title || ""} />
        </label>
        <label className="profile-field">
          <span>TÊN HIỂN THỊ</span>
          <input name="label" defaultValue={editing?.label || ""} />
        </label>
        <label className="profile-field">
          <span>CẤP DANH MỤC CHA</span>
          <select name="parentId" defaultValue={editing?.parentId ?? defaultParentId ?? ""}>
            <option value="">Danh mục gốc</option>
            {rootCategories.filter((item) => item.id !== editing?.id).map((item) => (
              <option key={item.id} value={item.id}>Con của: {item.label || item.title}</option>
            ))}
          </select>
        </label>
        <label className="profile-field">
          <span>THỨ TỰ HIỂN THỊ</span>
          <input type="number" name="sortOrder" min="0" defaultValue={editing?.sortOrder ?? 0} />
        </label>
        <div className="staff-management-form-actions staff-management-wide">
          <button className="staff-primary-action" disabled={busy}>
            {busy ? "ĐANG LƯU…" : editing?.id ? "LƯU DANH MỤC" : "THÊM DANH MỤC"}
          </button>
          <button type="button" className="staff-secondary-action" onClick={closeForm}>Hủy</button>
        </div>
      </form>
    </section>
  );

  return (
    <InternalLayout active="categories" isAdmin={user?.role === "ADMIN"} user={user} onLogout={onLogout}>
      <header className="internal-page-heading">
        <h1 className="font-display">Danh mục sản phẩm</h1>
      </header>

      <div className="staff-management-toolbar staff-category-toolbar">
        <input
          aria-label="Tìm danh mục"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Tìm kiếm danh mục"
        />
        <button type="button" className="staff-primary-action" onClick={openCreate}>
          <Icon name="plus" className="h-4 w-4" /> Thêm danh mục
        </button>
      </div>

      {error && !formOpen && <p className="staff-form-error" role="alert">{error}</p>}
      {notice && <p className="staff-form-notice" role="status">{notice}</p>}
      {formOpen && !editing?.id && !defaultParentId && renderForm()}

      <div className="staff-category-management-list">
        {filteredTree.map((parent) => (
          <section className="staff-category-group" key={parent.id} aria-label={`Danh mục ${parent.label || parent.title}`}>
            <div className="staff-category-group-head">
              <div className="staff-category-main-info">
                <div className="staff-category-title-line">
                  <h2>{parent.label || parent.title}</h2>
                  <span className={`staff-category-status ${parent.active ? "is-active" : "is-inactive"}`}>
                    {parent.active ? "Đang hoạt động" : "Đã ngừng"}
                  </span>
                </div>
              </div>
              <div className="staff-category-actions">
                <button type="button" className="staff-category-text-action" disabled={!parent.active} onClick={() => openAddChild(parent)}>
                  <Icon name="plus" className="h-4 w-4" /> Thêm danh mục con
                </button>
                <button type="button" className="staff-category-text-action" onClick={() => openEdit(parent)}>
                  Sửa
                </button>
                <button type="button" className="staff-category-text-action is-muted" onClick={() => toggleActive(parent)}>
                  {parent.active ? "Ngừng dùng" : "Bật lại"}
                </button>
                <button type="button" className="staff-category-text-action is-danger" onClick={() => remove(parent)}>Xóa</button>
              </div>
            </div>

            {formOpen && !editing?.id && defaultParentId === parent.id && renderForm()}
            {formOpen && editing?.id === parent.id && renderForm()}

            {parent.children?.length > 0 && (
              <ul className="staff-category-children">
                {parent.children.map((child) => {
                  const childActive = parent.active && child.active;
                  return (
                    <li key={child.id}>
                      <div className="staff-category-child">
                        <div className="staff-category-child-info">
                          <span className="staff-category-child-label">{child.label || child.title}</span>
                        </div>
                        <span className={`staff-category-status ${childActive ? "is-active" : "is-inactive"}`}>
                          {!parent.active && child.active ? "Ẩn theo danh mục cha" : child.active ? "Đang hoạt động" : "Đã ngừng"}
                        </span>
                        <div className="staff-category-actions">
                          <button type="button" className="staff-category-text-action" onClick={() => openEdit(child)}>Sửa</button>
                          <button type="button" className="staff-category-text-action is-muted" onClick={() => toggleActive(child)}>
                            {child.active ? "Ngừng dùng" : "Bật lại"}
                          </button>
                          <button type="button" className="staff-category-text-action is-danger" onClick={() => remove(child)}>Xóa</button>
                        </div>
                      </div>
                      {formOpen && editing?.id === child.id && renderForm()}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))}

        {!filteredTree.length && <p className="staff-category-empty">Không tìm thấy danh mục.</p>}
      </div>
    </InternalLayout>
  );
}

const toLocalDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

export function StaffPromotionsPage({ user, onLogout }) {
  const [promotions, setPromotions] = useState([]);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [discountType, setDiscountType] = useState("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [minimumOrder, setMinimumOrder] = useState("");
  const [maximumDiscount, setMaximumDiscount] = useState("");

  const refresh = async () => setPromotions(await getStaffPromotions());
  useEffect(() => { refresh().catch((reason) => setError(reason.message)); }, []);

  useEffect(() => {
    if (editing) {
      setDiscountType(editing.discountType || "PERCENT");
      setDiscountValue(editing.discountValue ?? "");
      setMinimumOrder(editing.minimumOrder ?? "");
      setMaximumDiscount(editing.maximumDiscount ?? "");
    } else {
      setDiscountType("PERCENT");
      setDiscountValue("");
      setMinimumOrder("");
      setMaximumDiscount("");
    }
  }, [editing]);

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = {
      name: values.name.trim(),
      code: String(values.code).trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue) || 0,
      minimumOrder: Number(minimumOrder) || 0,
      maximumDiscount: maximumDiscount ? Number(maximumDiscount) : null,
      usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
      startsAt: new Date(values.startsAt).toISOString(),
      endsAt: new Date(values.endsAt).toISOString(),
      active: values.active === "on",
    };
    try {
      if (editing?.id) await updateStaffPromotion(editing.id, payload);
      else await createStaffPromotion(payload);
      await refresh();
      setEditing(null);
      setNotice("Đã lưu chương trình khuyến mãi");
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (promotion) => {
    if (!window.confirm(`Xóa mã ${promotion.code}?`)) return;
    try {
      await deleteStaffPromotion(promotion.id);
      await refresh();
      setNotice("Đã xóa mã khuyến mãi");
    } catch (reason) {
      setError(reason.message);
    }
  };

  return (
    <InternalLayout active="promotions" isAdmin={user?.role === "ADMIN"} user={user} onLogout={onLogout}>
      <header className="internal-page-heading">
        <h1 className="font-display">Khuyến mãi</h1>
      </header>
      {error && <p className="staff-form-error" role="alert">{error}</p>}
      {notice && <p className="staff-form-notice" role="status">{notice}</p>}
      <section className="staff-management-panel">
        <div className="staff-management-panel-head">
          <h2>{editing ? "Chỉnh sửa chương trình" : "Tạo chương trình và mã giảm giá"}</h2>
          {editing && <button className="staff-secondary-action" onClick={() => setEditing(null)}>Hủy sửa</button>}
        </div>
        <form key={editing?.id || "new-promotion"} className="staff-management-form" onSubmit={submit}>
          <label className="profile-field">
            <span>TÊN CHƯƠNG TRÌNH</span>
            <input name="name" required defaultValue={editing?.name || ""} />
          </label>
          <label className="profile-field">
            <span>MÃ GIẢM GIÁ</span>
            <input name="code" required defaultValue={editing?.code || ""} />
          </label>
          <label className="profile-field">
            <span>KIỂU GIẢM</span>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
              <option value="PERCENT">Phần trăm</option>
              <option value="FIXED">Số tiền</option>
            </select>
          </label>
          <label className="profile-field">
            <span>MỨC GIẢM *</span>
            {discountType === "FIXED" ? (
              <MoneyInput required value={discountValue} onChange={setDiscountValue} placeholder="50.000" />
            ) : (
              <input type="number" min={1} max={100} required value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="15" />
            )}
          </label>
          <label className="profile-field">
            <span>ĐƠN TỐI THIỂU</span>
            <MoneyInput value={minimumOrder} onChange={setMinimumOrder} placeholder="0" />
          </label>
          <label className="profile-field">
            <span>GIẢM TỐI ĐA</span>
            <MoneyInput value={maximumDiscount} onChange={setMaximumDiscount} placeholder="100.000" />
          </label>
          <label className="profile-field">
            <span>SỐ LẦN SỬ DỤNG</span>
            <input name="usageLimit" type="number" min="1" defaultValue={editing?.usageLimit ?? ""} />
          </label>
          <label className="profile-field">
            <span>BẮT ĐẦU</span>
            <input name="startsAt" type="datetime-local" required defaultValue={toLocalDateTime(editing?.startsAt) || toLocalDateTime(Date.now())} />
          </label>
          <label className="profile-field">
            <span>KẾT THÚC</span>
            <input name="endsAt" type="datetime-local" required defaultValue={toLocalDateTime(editing?.endsAt) || toLocalDateTime(Date.now() + 7 * 86400000)} />
          </label>
          <label className="staff-promotion-active">
            <input name="active" type="checkbox" defaultChecked={editing ? editing.active : true} />
            Đang hoạt động
          </label>
          <div className="staff-management-form-actions staff-management-wide">
            <button className="staff-primary-action" disabled={busy}>
              {busy ? "ĐANG LƯU…" : editing ? "LƯU CHƯƠNG TRÌNH" : "TẠO CHƯƠNG TRÌNH"}
            </button>
          </div>
        </form>
      </section>
      <div className="staff-promotion-list">
        {promotions.map((promotion) => (
          <article className="staff-promotion-row" key={promotion.id}>
            <div>
              <strong>{promotion.name}</strong>
              <span>{promotion.code} · {promotion.discountType === "PERCENT" ? `${promotion.discountValue}%` : formatPrice(promotion.discountValue)}</span>
              <span>{new Date(promotion.startsAt).toLocaleDateString("vi-VN")} – {new Date(promotion.endsAt).toLocaleDateString("vi-VN")}</span>
              <span>{promotion.active ? "Đang bật" : "Đã tắt"}</span>
            </div>
            <div>
              <button className="staff-secondary-action" onClick={() => setEditing(promotion)}>Chỉnh sửa</button>
              <button className="staff-secondary-action" onClick={() => remove(promotion)}>Xóa</button>
            </div>
          </article>
        ))}
      </div>
    </InternalLayout>
  );
}
