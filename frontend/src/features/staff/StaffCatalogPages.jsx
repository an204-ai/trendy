import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import InternalLayout from "../../shared/components/InternalLayout.jsx";
import Icon from "../../shared/components/Icon.jsx";
import { formatPrice } from "../../shared/services/storefront.js";
import {
  createStaffCategory, createStaffProduct, createStaffPromotion, deleteStaffCategory, deleteStaffProduct, deleteStaffPromotion,
  getStaffCategories, getStaffProducts, getStaffPromotions, updateProductStock, updateStaffCategory, updateStaffProduct, updateStaffPromotion,
} from "../../shared/services/api.js";
import { validateAddress, validateEmail, validateName, validatePassword, validatePhone, validatePrice, validateRequired, validateSku, validateSlug, validateStock } from "../../shared/utils/validation.js";

const slugify = (value) =>
  (value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function generateUniqueSlug(text, existingProducts = [], currentId = null) {
  const base = slugify(text || "");
  if (!base) return "";

  const usedSlugs = new Set(
    (existingProducts || [])
      .filter((p) => p && p.id !== currentId && p.slug)
      .map((p) => slugify(p.slug))
  );

  if (!usedSlugs.has(base)) {
    return base;
  }

  let suffix = 1;
  while (usedSlugs.has(`${base}-${suffix}`)) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}
const STAFF_PAGE_SIZE = 10;

const PRESET_COLORS = [
  // Tone Đen - Xám - Trắng
  { hex: "#000000", name: "Đen bóng" },
  { hex: "#1F2937", name: "Đen nhám" },
  { hex: "#4B5563", name: "Xám chì" },
  { hex: "#9CA3AF", name: "Xám khói" },
  { hex: "#CBD5E1", name: "Bạc kim loại" },
  { hex: "#FFFFFF", name: "Trắng tinh" },
  { hex: "#E5E7EB", name: "Trong suốt" },

  // Tone Nâu - Đồi mồi - Hổ phách
  { hex: "#451A03", name: "Đồi mồi" },
  { hex: "#78350F", name: "Nâu Havana" },
  { hex: "#92400E", name: "Nâu cafe" },
  { hex: "#B45309", name: "Hổ phách" },
  { hex: "#A16207", name: "Nâu da bò" },
  { hex: "#D97706", name: "Vàng gold" },
  { hex: "#F59E0B", name: "Vàng hổ phách" },

  // Tone Đỏ - Hồng
  { hex: "#DC2626", name: "Đỏ ruby" },
  { hex: "#EF4444", name: "Đỏ tươi" },
  { hex: "#B91C1C", name: "Đỏ đậm" },
  { hex: "#881337", name: "Đỏ rượu vang" },
  { hex: "#991B1B", name: "Đỏ mận" },
  { hex: "#F472B6", name: "Hồng pastel" },
  { hex: "#EC4899", name: "Hồng cánh sen" },

  // Tone Vàng - Cam
  { hex: "#EAB308", name: "Vàng kim" },
  { hex: "#FACC15", name: "Vàng tươi" },
  { hex: "#CA8A04", name: "Vàng mù tạt" },
  { hex: "#FB923C", name: "Cam san hô" },
  { hex: "#EA580C", name: "Cam đất" },
  { hex: "#C2410C", name: "Cam cháy" },
  { hex: "#B45309", name: "Vàng đồng" },

  // Tone Xanh lá
  { hex: "#365314", name: "Xanh rêu đậm" },
  { hex: "#3F6212", name: "Xanh rêu" },
  { hex: "#15803D", name: "Xanh lục bảo" },
  { hex: "#22C55E", name: "Xanh lá tươi" },
  { hex: "#65A30D", name: "Xanh olive" },
  { hex: "#0D9488", name: "Xanh ngọc bích" },
  { hex: "#6EE7B7", name: "Xanh mint" },

  // Tone Xanh dương
  { hex: "#1E3A8A", name: "Xanh navy" },
  { hex: "#1D4ED8", name: "Xanh hoàng gia" },
  { hex: "#2563EB", name: "Xanh cobalt" },
  { hex: "#0284C7", name: "Xanh biển sâu" },
  { hex: "#0EA5E9", name: "Xanh cyan" },
  { hex: "#38BDF8", name: "Xanh da trời" },
  { hex: "#7DD3FC", name: "Xanh pastel" },

  // Tone Tím
  { hex: "#581C87", name: "Tím than" },
  { hex: "#6B21A8", name: "Tím hoàng gia" },
  { hex: "#7C3AED", name: "Tím thạch anh" },
  { hex: "#8B5CF6", name: "Tím violet" },
  { hex: "#A855F7", name: "Tím lavender" },
  { hex: "#C084FC", name: "Tím nhạt" },
  { hex: "#E9D5FF", name: "Tím pastel" },
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
        title={currentColor ? currentColor.name : (value || "Chọn màu")}
      />
      <div className="staff-color-popover">
        <div className="staff-color-grid">
          {PRESET_COLORS.map((c) => (
            <button
              key={`${c.name}-${c.hex}`}
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
        <label className="staff-color-custom-row" title="Chọn màu tùy biến">
          <input
            type="color"
            value={value && value.startsWith("#") ? value : "#000000"}
            onChange={(e) => {
              onChange(e.target.value);
              if (onSelectColor) onSelectColor({ hex: e.target.value, name: "Màu tùy chọn" });
            }}
            className="staff-color-input-native"
          />
          <span>Màu tùy chọn…</span>
        </label>
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
        <span className="staff-field-label" style={{ margin: 0 }}>{label}</span>
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
            <button
              type="button"
              className="staff-secondary-action"
              onClick={() => fileInputRef.current?.click()}
              title="Khuyên dùng 1200 × 1200 px"
            >
              Đổi ảnh (Khuyên dùng 1200 × 1200 px)
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
          <span>Tải ảnh từ máy (Khuyên dùng 1200 × 1200 px)</span>
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
        <span className="staff-field-label" style={{ margin: 0 }}>Hình trưng bày</span>
        <button
          type="button"
          className="staff-secondary-action"
          onClick={() => fileInputRef.current?.click()}
          title="Khuyên dùng 1200 × 1200 px"
        >
          <Icon name="plus" className="h-4 w-4" /> Thêm ảnh (Khuyên dùng 1200 × 1200 px)
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
      {images.length === 0 ? (
        <button
          type="button"
          className="staff-uploader-empty-drop"
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="plus" className="h-5 w-5" />
          <span>Tải ảnh trưng bày từ máy (Khuyên dùng 1200 × 1200 px)</span>
        </button>
      ) : (
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
      )}
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
          title="Tải ảnh biến thể (Khuyên dùng 1200 × 1200 px)"
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

const ATTRIBUTE_PRESETS = [
  { name: "Màu sắc", type: "COLOR" },
  { name: "Độ cận", type: "DIOPTER" },
  { name: "Phiên bản", type: "VERSION" },
];

function AttributeCombobox({ value, type, onSelect, placeholder = "Chọn hoặc nhập..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        if (isOpen) {
          setIsOpen(false);
          const trimmed = query.trim();
          if (trimmed && trimmed.toLowerCase() !== (value || "").toLowerCase()) {
            const matched = ATTRIBUTE_PRESETS.find(
              (p) => p.name.toLowerCase() === trimmed.toLowerCase()
            );
            if (matched) {
              onSelect(matched.name, matched.type);
            } else {
              let detected = "CUSTOM";
              const lower = trimmed.toLowerCase();
              if (lower.includes("màu")) detected = "COLOR";
              else if (lower.includes("cận") || lower.includes("độ")) detected = "DIOPTER";
              else if (lower.includes("kích") || lower.includes("size")) detected = "SIZE";
              else if (lower.includes("phiên bản") || lower.includes("bản")) detected = "VERSION";
              onSelect(trimmed, detected);
            }
          } else if (!trimmed) {
            setQuery(value || "");
          }
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, query, value, onSelect]);

  const normalized = query.trim().toLowerCase();
  const filteredPresets = ATTRIBUTE_PRESETS.filter((p) =>
    p.name.toLowerCase().includes(normalized)
  );
  const exactMatch = ATTRIBUTE_PRESETS.some(
    (p) => p.name.toLowerCase() === normalized
  );

  const handleChoose = (name, itemType) => {
    setQuery(name);
    setIsOpen(false);
    onSelect(name, itemType);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      if (filteredPresets.length > 0) {
        handleChoose(filteredPresets[0].name, filteredPresets[0].type);
      } else {
        let detected = "CUSTOM";
        const lower = trimmed.toLowerCase();
        if (lower.includes("màu")) detected = "COLOR";
        else if (lower.includes("cận") || lower.includes("độ")) detected = "DIOPTER";
        else if (lower.includes("kích") || lower.includes("size")) detected = "SIZE";
        else if (lower.includes("phiên bản") || lower.includes("bản")) detected = "VERSION";
        handleChoose(trimmed, detected);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery(value || "");
    }
  };

  return (
    <div ref={containerRef} className="staff-attr-combobox-wrap">
      <div className="staff-attr-combobox-input-box">
        <Icon name="tag" className="h-3.5 w-3.5 staff-attr-combobox-icon" />
        <input
          ref={inputRef}
          type="text"
          className="staff-attr-combobox-input"
          value={query}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="staff-attr-combobox-clear"
            onClick={(e) => {
              e.stopPropagation();
              setQuery("");
              inputRef.current?.focus();
              setIsOpen(true);
            }}
            title="Xóa chữ"
          >
            <Icon name="close" className="h-3 w-3" />
          </button>
        ) : null}
      </div>

      {isOpen && (
        <div className="staff-attr-combobox-menu">
          {filteredPresets.map((preset) => {
            const isCurrent = (value || "").toLowerCase() === preset.name.toLowerCase();
            return (
              <button
                key={preset.name}
                type="button"
                className={`staff-attr-combobox-item ${isCurrent ? "is-selected" : ""}`}
                onClick={() => handleChoose(preset.name, preset.type)}
              >
                <span>{preset.name}</span>
                {isCurrent && <Icon name="check" className="h-3.5 w-3.5 text-black" />}
              </button>
            );
          })}

          {!exactMatch && query.trim() !== "" && (
            <button
              type="button"
              className="staff-attr-combobox-item is-custom"
              onClick={() => {
                const trimmed = query.trim();
                let detected = "CUSTOM";
                const lower = trimmed.toLowerCase();
                if (lower.includes("màu")) detected = "COLOR";
                else if (lower.includes("cận") || lower.includes("độ")) detected = "DIOPTER";
                else if (lower.includes("kích") || lower.includes("size")) detected = "SIZE";
                else if (lower.includes("phiên bản") || lower.includes("bản")) detected = "VERSION";
                handleChoose(trimmed, detected);
              }}
            >
              <span>+ Sử dụng &ldquo;{query.trim()}&rdquo;</span>
              <Icon name="plus" className="h-3.5 w-3.5" />
            </button>
          )}

          {filteredPresets.length === 0 && query.trim() === "" && (
            <div className="staff-attr-combobox-empty">
              Chưa có thuộc tính nào
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VariantImageCell({ value, onChange }) {
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await compressAndReadFile(file);
    if (dataUrl) onChange(dataUrl);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
      />
      {value ? (
        <div
          style={{
            position: "relative",
            width: "34px",
            height: "34px",
            borderRadius: "6px",
            overflow: "hidden",
            border: "1px solid #d5d5cf",
            cursor: "pointer",
            background: "#f4f4f2",
            flexShrink: 0,
          }}
          onClick={() => fileRef.current?.click()}
          title="Bấm để đổi ảnh cho biến thể này (Khuyên dùng 1200 × 1200 px)"
        >
          <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            title="Xóa ảnh biến thể"
            style={{
              position: "absolute",
              top: 1,
              right: 1,
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.7)",
              color: "#ffffff",
              border: "none",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <Icon name="close" className="h-2 w-2" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Tải ảnh sản phẩm cho biến thể này"
          style={{
            width: "34px",
            height: "34px",
            borderRadius: "6px",
            border: "1px dashed #b8b8b0",
            background: "#fafaf8",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "#666666",
            padding: 0,
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
        >
          <Icon name="plus" className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function StaffProductEditor({ form, categories, products = [], onSave, onCancel, busy, error }) {
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
  const [frameMaterial, setFrameMaterial] = useState(() => form.specifications?.frameMaterial || "");
  const [lensMaterial, setLensMaterial] = useState(() => form.specifications?.lensMaterial || "");
  const [customDetails, setCustomDetails] = useState(() => {
    if (Array.isArray(form.specifications?.customDetails)) {
      return form.specifications.customDetails.join("\n");
    }
    return form.specifications?.customDetails || form.specifications?.detailsText || "";
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [galleryImages, setGalleryImages] = useState(() => (form.images || []).map((img) => img.url || img));

  const [isMultiVariant, setIsMultiVariant] = useState(() => {
    if (!form.variants || form.variants.length <= 1) {
      if (form.variants?.[0]?.name && form.variants[0].name !== "Mặc định") return true;
      return false;
    }
    return true;
  });

  const [singleStock, setSingleStock] = useState(() => form.variants?.[0]?.stockOnHand ?? "0");

  const [attributes, setAttributes] = useState(() => {
    const attrOpts = form.specifications?.attributeOptions || {};
    const list = [];
    if (Array.isArray(attrOpts.color) && attrOpts.color.length) {
      list.push({ id: "color", type: "COLOR", name: "Màu sắc", values: attrOpts.color });
    }
    if (Array.isArray(attrOpts.diopter) && attrOpts.diopter.length) {
      list.push({ id: "diopter", type: "DIOPTER", name: "Độ cận", values: attrOpts.diopter });
    }
    if (Array.isArray(attrOpts.size) && attrOpts.size.length) {
      list.push({ id: "size", type: "SIZE", name: "Kích thước", values: attrOpts.size });
    }
    if (Array.isArray(attrOpts.version) && attrOpts.version.length) {
      list.push({ id: "version", type: "VERSION", name: "Phiên bản", values: attrOpts.version });
    }
    if (list.length > 0) return list;

    if (form.variants && form.variants.length > 0) {
      const colorMap = new Map();
      const diopterMap = new Map();
      form.variants.forEach((v) => {
        const parts = (v.name || "").split("/");
        if (parts.length >= 2) {
          const cName = parts[0]?.trim();
          if (cName && !colorMap.has(cName)) {
            colorMap.set(cName, { name: cName, swatch: v.swatch || "#000000", image: v.image || "" });
          }
          const dName = parts[1]?.trim();
          if (dName && !diopterMap.has(dName)) {
            diopterMap.set(dName, { name: dName });
          }
        } else if (parts.length === 1 && parts[0]?.trim() && parts[0].trim() !== "Mặc định") {
          const cName = parts[0].trim();
          if (v.swatch) {
            colorMap.set(cName, { name: cName, swatch: v.swatch, image: v.image || "" });
          }
        }
      });
      const inferred = [];
      if (colorMap.size > 0) {
        inferred.push({ id: "color", type: "COLOR", name: "Màu sắc", values: Array.from(colorMap.values()) });
      }
      if (diopterMap.size > 0) {
        inferred.push({ id: "diopter", type: "DIOPTER", name: "Độ cận", values: Array.from(diopterMap.values()) });
      }
      if (inferred.length > 0) return inferred;
    }

    return [
      { id: "color", type: "COLOR", name: "Màu sắc", values: [] },
      { id: "size", type: "SIZE", name: "Kích thước", values: [] },
    ];
  });

  const [deletedVariantKeys, setDeletedVariantKeys] = useState(() => new Set());
  const [bulkPriceValue, setBulkPriceValue] = useState("");
  const [bulkStockValue, setBulkStockValue] = useState("10");
  const [inlineValues, setInlineValues] = useState({});
  const [inlineSwatches, setInlineSwatches] = useState({});

  const [variants, setVariants] = useState(() => {
    if (form.variants && form.variants.length) {
      return form.variants.map((v) => ({
        sku: v.sku || "",
        name: v.name || "",
        swatch: v.swatch || "",
        price: v.price ?? "",
        stockOnHand: v.stockOnHand ?? "0",
        image: v.image || "",
      }));
    }
    return [];
  });

  const generateCombinations = (attrList = attributes, forceReset = false) => {
    const activeAttrs = attrList.filter((a) => a.values && a.values.length > 0);
    if (!activeAttrs.length) {
      setVariants([]);
      return;
    }

    const effectiveDeletedKeys = forceReset ? new Set() : deletedVariantKeys;
    if (forceReset) {
      setDeletedVariantKeys(new Set());
    }

    const valueArrays = activeAttrs.map((a) => a.values.map((v) => ({ ...v, _attrType: a.type })));
    const combos = valueArrays.reduce((acc, curr) => acc.flatMap((prev) => curr.map((next) => [...prev, next])), [[]]);
    const base = baseSku.trim() || "SKU";

    const nextVariants = combos
      .map((combo) => {
        const name = combo.map((item) => item.name).join(" / ");
        const skuSuffix = combo.map((item) => slugify(item.name).toUpperCase().slice(0, 4) || "01").join("-");
        const sku = `${base}-${skuSuffix}`;
        const colorItem = combo.find((item) => item._attrType === "COLOR" && (item.swatch || item.image));
        return {
          name,
          sku,
          swatch: colorItem?.swatch || "",
          image: colorItem?.image || "",
          stockOnHand: bulkStockValue !== "" ? bulkStockValue : "10",
          price: bulkPriceValue !== "" ? bulkPriceValue : "",
        };
      })
      .filter((nv) => !effectiveDeletedKeys.has(nv.name.trim().toLowerCase()));

    setVariants((curr) => {
      return nextVariants.map((nv) => {
        const existing = curr.find((item) => item.name === nv.name);
        if (existing) {
          return {
            ...nv,
            sku: existing.sku || nv.sku,
            stockOnHand: existing.stockOnHand !== undefined ? existing.stockOnHand : nv.stockOnHand,
            price: existing.price !== undefined && existing.price !== "" ? existing.price : nv.price,
            image: existing.image || nv.image,
            swatch: existing.swatch || nv.swatch,
          };
        }
        return nv;
      });
    });
  };

  const handleAddAttributeRow = () => {
    const newId = String(Date.now());
    setAttributes((curr) => [...curr, { id: newId, type: "CUSTOM", name: "", values: [] }]);
  };

  const handleRemoveAttributeRow = (rowId) => {
    setAttributes((curr) => {
      const next = curr.filter((a) => a.id !== rowId);
      generateCombinations(next, false);
      return next;
    });
  };

  const handleUpdateAttribute = (rowId, newName, newType) => {
    const trimmed = (newName || "").trim();
    let effectiveType = newType;
    if (!effectiveType || effectiveType === "CUSTOM") {
      const lower = trimmed.toLowerCase();
      if (lower.includes("màu")) effectiveType = "COLOR";
      else if (lower.includes("cận") || lower.includes("độ")) effectiveType = "DIOPTER";
      else if (lower.includes("phiên bản") || lower.includes("bản")) effectiveType = "VERSION";
      else effectiveType = "CUSTOM";
    }

    setAttributes((curr) => {
      const nextAttrs = curr.map((a) => (a.id === rowId ? { ...a, type: effectiveType, name: trimmed } : a));
      generateCombinations(nextAttrs, false);
      return nextAttrs;
    });
  };

  const handleAddValue = (rowId) => {
    const rawVal = (inlineValues[rowId] || "").trim();
    if (!rawVal) return;
    const targetRow = attributes.find((a) => a.id === rowId);
    if (!targetRow) return;
    if (targetRow.values.some((v) => v.name.toLowerCase() === rawVal.toLowerCase())) {
      setInlineValues((prev) => ({ ...prev, [rowId]: "" }));
      return;
    }
    const valObj = { name: rawVal };
    if (targetRow.type === "COLOR") {
      valObj.swatch = inlineSwatches[rowId] || "#000000";
      valObj.image = "";
    }

    const nextAttrs = attributes.map((a) =>
      a.id === rowId ? { ...a, values: [...a.values, valObj] } : a
    );
    setAttributes(nextAttrs);
    setInlineValues((prev) => ({ ...prev, [rowId]: "" }));
    generateCombinations(nextAttrs, false);
  };

  const handleRemoveValue = (rowId, valIdx) => {
    const nextAttrs = attributes.map((a) =>
      a.id === rowId ? { ...a, values: a.values.filter((_, idx) => idx !== valIdx) } : a
    );
    setAttributes(nextAttrs);
    generateCombinations(nextAttrs, false);
  };

  const handleApplyBulk = () => {
    setVariants((curr) =>
      curr.map((v) => ({
        ...v,
        ...(bulkStockValue !== "" ? { stockOnHand: String(Math.max(0, Number(bulkStockValue) || 0)) } : {}),
        ...(bulkPriceValue !== "" ? { price: String(Math.max(0, Number(bulkPriceValue) || 0)) } : {}),
      }))
    );
  };

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const validateProductField = (field, val) => {
    if (field === "name") return validateName(val, "Tên sản phẩm", 2, 160);
    if (field === "baseSku") {
      const basicErr = validateSku(val, "Mã SKU", 2, 80);
      if (basicErr) return basicErr;
      const targetSku = (val || "").trim().toUpperCase();
      const isDuplicate = products.some((p) => {
        if (p.id === form.id) return false;
        if (p.sku && p.sku.trim().toUpperCase() === targetSku) return true;
        if (p.code && p.code.trim().toUpperCase() === targetSku) return true;
        if (p.variants && p.variants.some((v) => v.sku && v.sku.trim().toUpperCase() === targetSku)) return true;
        return false;
      });
      if (isDuplicate) return "Mã SKU này đã được sử dụng";
      return "";
    }
    if (field === "slug") {
      const basicErr = validateSlug(val, "Đường dẫn tĩnh", 2, 120);
      if (basicErr) return basicErr;
      const normalized = slugify(val);
      const isDuplicate = products.some(
        (p) => p.id !== form.id && slugify(p.slug || "") === normalized
      );
      if (isDuplicate) return "Đường dẫn tĩnh này đã được sử dụng";
      return "";
    }
    if (field === "price") return validatePrice(val, "Giá bán tiêu chuẩn");
    if (field === "image") return val?.trim() ? "" : "Vui lòng chọn hình ảnh đại diện cho sản phẩm";
    return "";
  };

  const handleNameChange = (val) => {
    setName(val);
    setTouched((prev) => ({ ...prev, name: true }));
    const nameErr = validateProductField("name", val);
    const generatedSlug = generateUniqueSlug(val, products, form.id);
    setSlug(generatedSlug);
    const slugErr = generatedSlug ? "" : validateProductField("slug", generatedSlug);
    setFieldErrors((prev) => ({ ...prev, name: nameErr, slug: slugErr }));
  };

  const handleSkuChange = (val) => {
    setBaseSku(val);
    setCode(val);
    setTouched((prev) => ({ ...prev, baseSku: true }));
    const err = validateProductField("baseSku", val);
    setFieldErrors((prev) => ({ ...prev, baseSku: err }));
  };

  const handlePriceChange = (val) => {
    setPrice(val);
    setTouched((prev) => ({ ...prev, price: true }));
    const err = validateProductField("price", val);
    setFieldErrors((prev) => ({ ...prev, price: err }));
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let val = "";
    if (field === "name") val = name;
    else if (field === "baseSku") val = baseSku;
    else if (field === "slug") val = slug;
    else if (field === "price") val = price;
    else if (field === "image") val = image;
    const err = validateProductField(field, val);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const validateInfoTab = () => {
    const errors = {
      name: validateProductField("name", name),
      baseSku: validateProductField("baseSku", baseSku),
      slug: validateProductField("slug", slug),
      price: validateProductField("price", price),
    };
    const hasErr = Object.values(errors).some(Boolean);
    if (hasErr) {
      setTouched((prev) => ({ ...prev, name: true, baseSku: true, slug: true, price: true }));
      setFieldErrors((prev) => ({ ...prev, ...errors }));
    }
    return !hasErr;
  };

  const validateMediaTab = () => {
    const err = validateProductField("image", image);
    if (err) {
      setTouched((prev) => ({ ...prev, image: true }));
      setFieldErrors((prev) => ({ ...prev, image: err }));
      return false;
    }
    return true;
  };

  const handleNextTab = () => {
    if (activeTab === "info") {
      if (!validateInfoTab()) return;
      setActiveTab("media");
    } else if (activeTab === "media") {
      if (!validateMediaTab()) return;
      setActiveTab("variants");
    }
  };

  const handleSelectTab = (targetTab) => {
    if (activeTab === "info" && targetTab !== "info") {
      if (!validateInfoTab()) return;
    }
    if (activeTab === "media" && targetTab === "variants") {
      if (!validateMediaTab()) return;
    }
    setActiveTab(targetTab);
  };

  const addGalleryImage = (dataUrl) => {
    if (!dataUrl) return;
    setGalleryImages((curr) => [...curr, dataUrl]);
  };

  const removeGalleryImage = (idx) => {
    setGalleryImages((curr) => curr.filter((_, i) => i !== idx));
  };

  const addVariant = (customName = "", customSwatch = "") => {
    const nextIdx = variants.length + 1;
    const effectiveName = customName || "";
    const skuSuffix = customName ? slugify(customName).toUpperCase().slice(0, 6) : String(nextIdx).padStart(2, "0");
    const defaultSku = baseSku.trim() ? `${baseSku.trim()}-${skuSuffix}` : "";
    const effectiveSwatch = attributes.some((a) => a.type === "COLOR") ? (customSwatch || "#000000") : "";

    setVariants((curr) => [
      ...curr,
      {
        sku: defaultSku,
        name: effectiveName,
        swatch: effectiveSwatch,
        price: "",
        stockOnHand: "10",
        image: "",
      },
    ]);
  };

  const removeVariant = (index) => {
    const target = variants[index];
    if (target?.name) {
      setDeletedVariantKeys((prev) => new Set(prev).add(target.name.trim().toLowerCase()));
    }
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
    if (!validateInfoTab()) {
      setActiveTab("info");
      return;
    }
    if (!validateMediaTab()) {
      setActiveTab("media");
      return;
    }

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
          swatch: attributes.some((a) => a.type === "COLOR") && v.swatch && v.swatch.trim() ? v.swatch.trim() : undefined,
          price: v.price !== "" && v.price !== undefined && v.price !== null ? Number(v.price) : undefined,
          stockOnHand: v.stockOnHand !== "" && v.stockOnHand !== undefined && v.stockOnHand !== null ? Number(v.stockOnHand) : 0,
          image: v.image ? v.image.trim() : undefined,
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
      slug: slug.trim() || generateUniqueSlug(name, products, form.id),
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
      specifications: {
        ...(form.specifications || {}),
        frameMaterial: frameMaterial.trim() || undefined,
        lensMaterial: lensMaterial.trim() || undefined,
        customDetails: customDetails.trim()
          ? customDetails.split("\n").map((l) => l.trim()).filter(Boolean)
          : undefined,
        variantTypes: isMultiVariant ? (attributes.filter((a) => a.values && a.values.length > 0).map((a) => a.type).length ? attributes.filter((a) => a.values && a.values.length > 0).map((a) => a.type) : ["COLOR"]) : undefined,
        variantType: isMultiVariant && attributes.filter((a) => a.values && a.values.length > 0).length === 1 ? attributes.filter((a) => a.values && a.values.length > 0)[0].type : undefined,
        attributeOptions: isMultiVariant ? {
          color: attributes.find((a) => a.type === "COLOR")?.values,
          diopter: attributes.find((a) => a.type === "DIOPTER")?.values,
          size: attributes.find((a) => a.type === "SIZE")?.values,
          version: attributes.find((a) => a.type === "VERSION")?.values,
        } : undefined,
      },
    });
  };

  return (
    <section className="staff-management-panel">
      <nav className="staff-form-tabs" aria-label="Các bước thông tin sản phẩm">
        <button type="button" className={`staff-form-tab-btn ${activeTab === "info" ? "is-active" : ""}`} onClick={() => handleSelectTab("info")}>
          Thông tin chung
        </button>
        <button type="button" className={`staff-form-tab-btn ${activeTab === "media" ? "is-active" : ""}`} onClick={() => handleSelectTab("media")}>
          Hình ảnh và mô tả
        </button>
        <button type="button" className={`staff-form-tab-btn ${activeTab === "variants" ? "is-active" : ""}`} onClick={() => handleSelectTab("variants")}>
          Biến thể và kho hàng
        </button>
      </nav>

      <form onSubmit={handleSubmit} noValidate>
        {activeTab === "info" && (
          <div className="staff-form-unified-box">
            <div className="staff-form-grid-2">
              <label className={`profile-field ${touched.name && fieldErrors.name ? "has-error" : ""}`} style={{ margin: 0 }}>
                <span>Tên sản phẩm *</span>
                <input
                  required
                  minLength={2}
                  maxLength={160}
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => handleBlur("name")}
                  className={touched.name && fieldErrors.name ? "is-invalid" : ""}
                  placeholder="Gentle Monster Her"
                />
                {touched.name && fieldErrors.name && (
                  <span className="profile-field-error">
                    <Icon name="alert" className="h-3.5 w-3.5" />
                    {fieldErrors.name}
                  </span>
                )}
              </label>
              <label className={`profile-field ${touched.baseSku && fieldErrors.baseSku ? "has-error" : ""}`} style={{ margin: 0 }}>
                <span>Mã SKU *</span>
                <input
                  required
                  maxLength={80}
                  value={baseSku}
                  onChange={(e) => handleSkuChange(e.target.value)}
                  onBlur={() => handleBlur("baseSku")}
                  className={touched.baseSku && fieldErrors.baseSku ? "is-invalid" : ""}
                  placeholder="TR-0012"
                />
                {touched.baseSku && fieldErrors.baseSku && (
                  <span className="profile-field-error">
                    <Icon name="alert" className="h-3.5 w-3.5" />
                    {fieldErrors.baseSku}
                  </span>
                )}
              </label>
            </div>

            <div className="staff-form-grid-2">
              <label className={`profile-field ${touched.slug && fieldErrors.slug ? "has-error" : ""}`} style={{ margin: 0 }}>
                <span>Đường dẫn tĩnh *</span>
                <input
                  readOnly
                  tabIndex={-1}
                  required
                  maxLength={120}
                  value={slug}
                  className={touched.slug && fieldErrors.slug ? "is-invalid" : ""}
                  placeholder="gentle-monster-her"
                  style={{
                    backgroundColor: "var(--color-surface-soft, #f8f9fa)",
                    cursor: "not-allowed",
                    color: "var(--color-text-muted, #6b7280)",
                  }}
                />
                {touched.slug && fieldErrors.slug && (
                  <span className="profile-field-error">
                    <Icon name="alert" className="h-3.5 w-3.5" />
                    {fieldErrors.slug}
                  </span>
                )}
              </label>
              <label className={`profile-field ${touched.price && fieldErrors.price ? "has-error" : ""}`} style={{ margin: 0 }}>
                <span>Giá bán tiêu chuẩn *</span>
                <MoneyInput
                  required
                  value={price}
                  onChange={(val) => handlePriceChange(val)}
                  onBlur={() => handleBlur("price")}
                  className={touched.price && fieldErrors.price ? "is-invalid" : ""}
                  placeholder="Nhập giá bán"
                />
                {touched.price && fieldErrors.price && (
                  <span className="profile-field-error">
                    <Icon name="alert" className="h-3.5 w-3.5" />
                    {fieldErrors.price}
                  </span>
                )}
              </label>
            </div>

            <div className="staff-form-grid-2">
              <label className="profile-field" style={{ margin: 0 }}>
                <span>Trạng thái</span>
                <select value={active ? "active" : "inactive"} onChange={(e) => setActive(e.target.value === "active")}>
                  <option value="active">Đang bán</option>
                  <option value="inactive">Ngừng bán</option>
                </select>
              </label>
            </div>

            <div className="staff-category-tree-box">
              <span className="staff-field-label">Danh mục sản phẩm</span>
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
              label="Hình đại diện *"
              value={image}
              onChange={(val) => {
                setImage(val);
                setFieldErrors((prev) => ({ ...prev, image: "" }));
              }}
              required={true}
            />
            {fieldErrors.image && (
              <span className="profile-field-error" style={{ margin: "-8px 0 16px" }}>
                <Icon name="alert" className="h-3.5 w-3.5" />
                {fieldErrors.image}
              </span>
            )}

            <GalleryUploader
              images={galleryImages}
              onAdd={addGalleryImage}
              onRemove={removeGalleryImage}
            />

            <div className="staff-form-grid-2">
              <label className="profile-field" style={{ margin: 0 }}>
                <span>Chất liệu gọng</span>
                <input
                  value={frameMaterial}
                  onChange={(e) => setFrameMaterial(e.target.value)}
                  placeholder="Ví dụ: Acetate, Titanium cao cấp..."
                />
              </label>
              <label className="profile-field" style={{ margin: 0 }}>
                <span>Chất liệu tròng</span>
                <input
                  value={lensMaterial}
                  onChange={(e) => setLensMaterial(e.target.value)}
                  placeholder="Ví dụ: Polycarbonate chống tia UV, Tráng gương..."
                />
              </label>
            </div>

            <div>
              <label className="profile-field" style={{ margin: 0 }}>
                <span>Chi tiết sản phẩm</span>
                <textarea
                  rows={9}
                  style={{ minHeight: "190px", lineHeight: "1.6" }}
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder={"Thiết kế viền kính bo cong hiện đại\nLogo kim loại khắc chìm ở càng kính\nChống tia cực tím UV400\nĐệm mũi êm ái chống trượt"}
                />
              </label>
            </div>

            <div>
              <label className="profile-field" style={{ margin: 0 }}>
                <span>Mô tả</span>
                <textarea
                  rows={8}
                  style={{ minHeight: "170px", lineHeight: "1.6" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nhập mô tả sản phẩm, câu chuyện thiết kế..."
                />
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
                <label className={`profile-field ${touched.baseSku && fieldErrors.baseSku ? "has-error" : ""}`}>
                  <span>Mã SKU sản phẩm *</span>
                  <input
                    required
                    value={baseSku}
                    onChange={(e) => handleSkuChange(e.target.value)}
                    onBlur={() => handleBlur("baseSku")}
                    className={touched.baseSku && fieldErrors.baseSku ? "is-invalid" : ""}
                    placeholder="GM-HER-01"
                  />
                  {touched.baseSku && fieldErrors.baseSku && (
                    <span className="profile-field-error">
                      <Icon name="alert" className="h-3.5 w-3.5" />
                      {fieldErrors.baseSku}
                    </span>
                  )}
                </label>
                <label className="profile-field">
                  <span>Số lượng tồn kho *</span>
                  <input type="number" min={0} required value={singleStock} onChange={(e) => setSingleStock(e.target.value)} placeholder="0" />
                </label>
              </div>
            ) : (
              <>
                <div className="staff-variants-toolbar" style={{ marginBottom: "16px" }}>
                  <label className={`profile-field ${touched.baseSku && fieldErrors.baseSku ? "has-error" : ""}`} style={{ flex: 1, minWidth: "220px", margin: 0 }}>
                    <span>Mã SKU gốc *</span>
                    <input
                      required
                      value={baseSku}
                      onChange={(e) => handleSkuChange(e.target.value)}
                      onBlur={() => handleBlur("baseSku")}
                      className={touched.baseSku && fieldErrors.baseSku ? "is-invalid" : ""}
                      placeholder="GM-HER"
                    />
                    {touched.baseSku && fieldErrors.baseSku && (
                      <span className="profile-field-error">
                        <Icon name="alert" className="h-3.5 w-3.5" />
                        {fieldErrors.baseSku}
                      </span>
                    )}
                  </label>
                </div>

                <div style={{ display: "grid", gap: "20px", width: "100%" }}>
                  {/* Card 1: Thuộc tính & Biến thể (Full Width) */}
                  <div className="staff-variant-card" style={{ width: "100%" }}>
                    <div className="staff-variant-card-head">
                      <strong>THUỘC TÍNH & BIẾN THỂ</strong>
                    </div>

                    <div className="staff-attr-rows-list">
                      {attributes.map((attr) => (
                        <div key={attr.id} className="staff-attr-row-item">
                          <div className="staff-attr-row-header">
                            <AttributeCombobox
                              value={attr.name}
                              type={attr.type}
                              onSelect={(newName, newType) => handleUpdateAttribute(attr.id, newName, newType)}
                              placeholder="Chọn hoặc nhập thuộc tính..."
                            />

                            {attributes.length > 1 && (
                              <button
                                type="button"
                                className="staff-attr-row-remove-btn"
                                onClick={() => handleRemoveAttributeRow(attr.id)}
                                title="Xóa thuộc tính này"
                              >
                                <Icon name="close" className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="staff-attr-tags-box">
                            {attr.values.map((v, valIdx) => (
                              <span key={`${v.name}-${valIdx}`} className="staff-attr-value-tag">
                                {attr.type === "COLOR" && (
                                  v.image ? (
                                    <img src={v.image} alt="" style={{ width: 14, height: 14, borderRadius: "50%", objectFit: "cover" }} />
                                  ) : (
                                    <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: v.swatch || "#000", border: "1px solid rgba(0,0,0,0.15)" }} />
                                  )
                                )}
                                <span>{v.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveValue(attr.id, valIdx)}
                                  title="Xóa giá trị"
                                  style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "inline-flex", color: "#888" }}
                                >
                                  <Icon name="close" className="h-3 w-3" />
                                </button>
                              </span>
                            ))}

                            <div className="staff-attr-inline-add">
                              {attr.type === "COLOR" && (
                                <ColorPalettePicker
                                  value={inlineSwatches[attr.id] || "#000000"}
                                  onChange={(hex) => setInlineSwatches((prev) => ({ ...prev, [attr.id]: hex }))}
                                  onSelectColor={(obj) => {
                                    setInlineSwatches((prev) => ({ ...prev, [attr.id]: obj.hex }));
                                    if (!inlineValues[attr.id]) setInlineValues((prev) => ({ ...prev, [attr.id]: obj.name }));
                                  }}
                                />
                              )}
                              <input
                                type="text"
                                className="staff-attr-inline-input"
                                placeholder={
                                  attr.type === "COLOR"
                                    ? "Nhập tên màu..."
                                    : attr.type === "DIOPTER"
                                    ? "Nhập độ cận..."
                                    : attr.type === "SIZE"
                                    ? "Nhập kích thước..."
                                    : "Nhập giá trị..."
                                }
                                value={inlineValues[attr.id] || ""}
                                onChange={(e) => setInlineValues((prev) => ({ ...prev, [attr.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddValue(attr.id);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="staff-secondary-action"
                                style={{ minHeight: "32px", padding: "0 10px", fontSize: "11px", borderRadius: "999px" }}
                                onClick={() => handleAddValue(attr.id)}
                              >
                                <Icon name="plus" className="h-3 w-3" /> Thêm giá trị
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "2px" }}>
                      <button
                        type="button"
                        className="staff-add-attr-btn"
                        onClick={handleAddAttributeRow}
                      >
                        <Icon name="plus" className="h-3.5 w-3.5" />
                        <span>Thêm thuộc tính</span>
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Danh sách biến thể (Full Width ở dưới cùng) */}
                  <div className="staff-variant-card" style={{ width: "100%" }}>
                    <div className="staff-variant-card-head" style={{ flexWrap: "wrap", gap: "12px" }}>
                      <strong>Danh sách biến thể</strong>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8f8f6", padding: "4px 8px", borderRadius: "8px", border: "1px solid #eaeae5" }}>
                          <span style={{ fontSize: "11px", fontWeight: "600", color: "#666" }}>Giá chung:</span>
                          <input
                            type="number"
                            min={0}
                            value={bulkPriceValue}
                            onChange={(e) => setBulkPriceValue(e.target.value)}
                            placeholder="Nhập giá"
                            style={{ width: "95px", minHeight: "28px", padding: "0 6px", fontSize: "11px", borderRadius: "6px", border: "1px solid #d5d5cf", background: "#fff" }}
                          />
                          <span style={{ fontSize: "11px", fontWeight: "600", color: "#666", marginLeft: "4px" }}>Tồn kho:</span>
                          <input
                            type="number"
                            min={0}
                            value={bulkStockValue}
                            onChange={(e) => setBulkStockValue(e.target.value)}
                            placeholder="10"
                            style={{ width: "60px", minHeight: "28px", padding: "0 6px", fontSize: "11px", borderRadius: "6px", border: "1px solid #d5d5cf", background: "#fff" }}
                          />
                          <button
                            type="button"
                            className="staff-primary-action"
                            style={{ minHeight: "28px", padding: "0 10px", fontSize: "11px", borderRadius: "6px" }}
                            onClick={handleApplyBulk}
                          >
                            Áp dụng tất cả
                          </button>
                        </div>
                        <button
                          type="button"
                          className="staff-secondary-action"
                          style={{ minHeight: "32px", padding: "0 10px", fontSize: "11px" }}
                          onClick={() => generateCombinations(attributes, true)}
                        >
                          Tạo lại tổ hợp
                        </button>
                        <button
                          type="button"
                          className="staff-secondary-action"
                          style={{ minHeight: "32px", padding: "0 10px", fontSize: "11px" }}
                          onClick={() => addVariant()}
                        >
                          <Icon name="plus" className="h-3 w-3" /> Thêm biến thể
                        </button>
                      </div>
                    </div>

                    <div className="staff-combos-table-wrap">
                      <table className="staff-combos-table">
                        <thead>
                          <tr>
                            <th style={{ width: "46px" }}>Ảnh</th>
                            <th>Tên biến thể</th>
                            <th style={{ width: "160px" }}>Mã SKU</th>
                            <th style={{ width: "130px" }}>Giá bán</th>
                            <th style={{ width: "90px" }}>Tồn kho</th>
                            <th style={{ width: "46px", textAlign: "center" }}>Xóa</th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.length === 0 ? (
                            <tr>
                              <td colSpan={6} style={{ textAlign: "center", padding: "24px", color: "#888", fontSize: "12px" }}>
                                Chưa có biến thể nào. Vui lòng thêm giá trị thuộc tính để tạo biến thể.
                              </td>
                            </tr>
                          ) : (
                            variants.map((v, idx) => (
                              <tr key={idx}>
                                <td>
                                  <VariantImageCell
                                    value={v.image || ""}
                                    onChange={(newImg) => updateVariant(idx, "image", newImg)}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={v.name}
                                    onChange={(e) => updateVariant(idx, "name", e.target.value)}
                                    style={{ width: "100%", minHeight: "34px", padding: "0 8px", fontSize: "12px", fontWeight: "600" }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    required
                                    value={v.sku}
                                    onChange={(e) => updateVariant(idx, "sku", e.target.value)}
                                    style={{ width: "100%", minHeight: "34px", padding: "0 8px", fontSize: "12px" }}
                                  />
                                </td>
                                <td>
                                  <MoneyInput
                                    value={v.price}
                                    onChange={(val) => updateVariant(idx, "price", val)}
                                    placeholder="Theo giá gốc"
                                    style={{ width: "100%", minHeight: "34px", padding: "0 8px", fontSize: "12px" }}
                                  />
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    min={0}
                                    value={v.stockOnHand}
                                    onChange={(e) => updateVariant(idx, "stockOnHand", e.target.value)}
                                    style={{ width: "100%", minHeight: "34px", padding: "0 8px", fontSize: "12px" }}
                                  />
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <button
                                    type="button"
                                    className="staff-secondary-action"
                                    style={{ width: "28px", height: "28px", minHeight: "28px", padding: 0, display: "inline-grid", placeItems: "center" }}
                                    onClick={() => removeVariant(idx)}
                                    title="Xóa biến thể này"
                                  >
                                    <Icon name="close" className="h-3 w-3" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        )}

        {error && (
          <div className="staff-form-error" style={{ marginTop: "16px" }} role="alert">
            <Icon name="alert" className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

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
              <button type="button" className="staff-secondary-action" style={{ marginLeft: "8px" }} onClick={handleNextTab}>
                Tiếp theo
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" className="staff-secondary-action" onClick={onCancel}>Hủy</button>
            <button type="submit" className="staff-primary-action" disabled={busy}>
              {busy ? "Đang lưu sản phẩm…" : form.id ? "Lưu cập nhật" : "Tạo sản phẩm"}
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
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

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
        <StaffProductEditor
          form={form}
          categories={categories}
          products={products}
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

  const [catTitle, setCatTitle] = useState("");
  const [catId, setCatId] = useState("");
  const [catLabel, setCatLabel] = useState("");
  const [catParentId, setCatParentId] = useState("");
  const [catSortOrder, setCatSortOrder] = useState(0);
  const [catFieldErrors, setCatFieldErrors] = useState({});
  const [catTouched, setCatTouched] = useState({});

  const refresh = async () => setCategories(await getStaffCategories());
  useEffect(() => { refresh().catch((reason) => setError(reason.message)); }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

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

  const validateCatField = (name, val) => {
    if (name === "title") return validateName(val, "Tên danh mục", 2, 120);
    if (name === "id") return val.trim() ? validateSlug(val, "Mã danh mục", 2, 80) : "";
    return "";
  };

  const handleCatTitleChange = (val) => {
    setCatTitle(val);
    setCatTouched((prev) => ({ ...prev, title: true }));
    const err = validateCatField("title", val);
    setCatFieldErrors((prev) => ({ ...prev, title: err }));
  };

  const handleCatIdChange = (val) => {
    setCatId(val);
    setCatTouched((prev) => ({ ...prev, id: true }));
    const err = validateCatField("id", val);
    setCatFieldErrors((prev) => ({ ...prev, id: err }));
  };

  const handleCatBlur = (name) => {
    setCatTouched((prev) => ({ ...prev, [name]: true }));
    const val = name === "title" ? catTitle : catId;
    const err = validateCatField(name, val);
    setCatFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const openCreate = () => {
    setEditing(null);
    setDefaultParentId("");
    setCatTitle("");
    setCatId("");
    setCatLabel("");
    setCatParentId("");
    setCatSortOrder(0);
    setCatFieldErrors({});
    setCatTouched({});
    setError("");
    setNotice("");
    setFormOpen(true);
  };

  const openAddChild = (parent) => {
    setEditing(null);
    setDefaultParentId(parent.id);
    setCatTitle("");
    setCatId("");
    setCatLabel("");
    setCatParentId(parent.id);
    setCatSortOrder(0);
    setCatFieldErrors({});
    setCatTouched({});
    setError("");
    setNotice("");
    setFormOpen(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setDefaultParentId("");
    setCatTitle(category.title || "");
    setCatId(category.id || "");
    setCatLabel(category.label || "");
    setCatParentId(category.parentId || "");
    setCatSortOrder(category.sortOrder ?? 0);
    setCatFieldErrors({});
    setCatTouched({});
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
    const titleErr = validateCatField("title", catTitle);
    const idErr = !editing?.id ? validateCatField("id", catId) : "";
    if (titleErr || idErr) {
      setCatTouched({ title: true, id: true });
      setCatFieldErrors({ title: titleErr, id: idErr });
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    const payload = {
      title: catTitle.trim(),
      label: (catLabel || catTitle).trim(),
      ...(catParentId ? { parentId: catParentId } : { parentId: null }),
      sortOrder: Number(catSortOrder || 0),
      ...(!editing?.id ? { id: catId.trim() || slugify(catTitle) } : {}),
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
      {error && (
        <div className="staff-form-error" role="alert">
          <Icon name="alert" className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <form key={editing?.id || defaultParentId || "new-category"} className="staff-management-form staff-category-form" onSubmit={submit} noValidate>
        {!editing?.id && (
          <label className={`profile-field ${catTouched.id && catFieldErrors.id ? "has-error" : ""}`}>
            <span>Mã danh mục · có thể để trống</span>
            <input
              name="id"
              value={catId}
              onChange={(e) => handleCatIdChange(e.target.value)}
              onBlur={() => handleCatBlur("id")}
              className={catTouched.id && catFieldErrors.id ? "is-invalid" : ""}
              placeholder="tu-dong-tao-tu-ten"
            />
            {catTouched.id && catFieldErrors.id && (
              <span className="profile-field-error">
                <Icon name="alert" className="h-3.5 w-3.5" />
                {catFieldErrors.id}
              </span>
            )}
          </label>
        )}
        <label className={`profile-field ${catTouched.title && catFieldErrors.title ? "has-error" : ""}`}>
          <span>Tên danh mục *</span>
          <input
            name="title"
            required
            value={catTitle}
            onChange={(e) => handleCatTitleChange(e.target.value)}
            onBlur={() => handleCatBlur("title")}
            className={catTouched.title && catFieldErrors.title ? "is-invalid" : ""}
          />
          {catTouched.title && catFieldErrors.title && (
            <span className="profile-field-error">
              <Icon name="alert" className="h-3.5 w-3.5" />
              {catFieldErrors.title}
            </span>
          )}
        </label>
        <label className="profile-field">
          <span>Tên hiển thị</span>
          <input
            name="label"
            value={catLabel}
            onChange={(e) => setCatLabel(e.target.value)}
          />
        </label>
        <label className="profile-field">
          <span>Cấp danh mục cha</span>
          <select
            name="parentId"
            value={catParentId}
            onChange={(e) => setCatParentId(e.target.value)}
          >
            <option value="">Danh mục gốc</option>
            {rootCategories.filter((item) => item.id !== editing?.id).map((item) => (
              <option key={item.id} value={item.id}>Con của: {item.label || item.title}</option>
            ))}
          </select>
        </label>
        <label className="profile-field">
          <span>Thứ tự hiển thị</span>
          <input
            type="number"
            name="sortOrder"
            min="0"
            value={catSortOrder}
            onChange={(e) => setCatSortOrder(e.target.value)}
          />
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

      {error && !formOpen && (
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
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [promoName, setPromoName] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discountType, setDiscountType] = useState("PERCENT");
  const [discountValue, setDiscountValue] = useState("");
  const [minimumOrder, setMinimumOrder] = useState("");
  const [maximumDiscount, setMaximumDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [active, setActive] = useState(true);

  const [promoFieldErrors, setPromoFieldErrors] = useState({});
  const [promoTouched, setPromoTouched] = useState({});

  const refresh = async () => setPromotions(await getStaffPromotions());
  useEffect(() => { refresh().catch((reason) => setError(reason.message)); }, []);
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const validateField = (name, val) => {
    if (name === "name") return validateName(val, "Tên chương trình", 2, 160);
    if (name === "code") return validateSku(val, "Mã giảm giá", 3, 48);
    if (name === "discountValue") {
      if (val === "" || val === null || val === undefined) return "Vui lòng nhập mức giảm giá";
      const num = Number(val);
      if (isNaN(num)) return "Mức giảm phải là số hợp lệ";
      if (discountType === "PERCENT") {
        if (num < 1 || num > 100) return "Mức giảm theo phần trăm phải từ 1 đến 100%";
      } else {
        if (num <= 0) return "Số tiền giảm phải lớn hơn 0";
      }
      return "";
    }
    if (name === "endsAt" && startsAt && val) {
      if (new Date(val) <= new Date(startsAt)) return "Thời gian kết thúc phải sau thời gian bắt đầu";
    }
    return "";
  };

  const handleFieldChange = (name, val) => {
    let err = "";
    setPromoTouched((prev) => ({ ...prev, [name]: true }));
    if (name === "name") { setPromoName(val); err = validateField("name", val); }
    else if (name === "code") { const upper = val.toUpperCase(); setPromoCode(upper); err = validateField("code", upper); }
    else if (name === "discountValue") { setDiscountValue(val); err = validateField("discountValue", val); }
    else if (name === "startsAt") { setStartsAt(val); }
    else if (name === "endsAt") { setEndsAt(val); err = validateField("endsAt", val); }
    setPromoFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleFieldBlur = (name) => {
    setPromoTouched((prev) => ({ ...prev, [name]: true }));
    let val = "";
    if (name === "name") val = promoName;
    else if (name === "code") val = promoCode;
    else if (name === "discountValue") val = discountValue;
    else if (name === "endsAt") val = endsAt;
    const err = validateField(name, val);
    setPromoFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const startCreate = () => {
    setEditing(null);
    setPromoName("");
    setPromoCode("");
    setDiscountType("PERCENT");
    setDiscountValue("");
    setMinimumOrder("");
    setMaximumDiscount("");
    setUsageLimit("");
    setStartsAt(toLocalDateTime(Date.now()));
    setEndsAt(toLocalDateTime(Date.now() + 7 * 86400000));
    setActive(true);
    setPromoFieldErrors({});
    setPromoTouched({});
    setError("");
    setNotice("");
    setCreating(true);
  };

  const startEdit = (promotion) => {
    setCreating(false);
    setEditing(promotion);
    setPromoName(promotion.name || "");
    setPromoCode(promotion.code || "");
    setDiscountType(promotion.discountType || "PERCENT");
    setDiscountValue(promotion.discountValue ?? "");
    setMinimumOrder(promotion.minimumOrder ?? "");
    setMaximumDiscount(promotion.maximumDiscount ?? "");
    setUsageLimit(promotion.usageLimit ?? "");
    setStartsAt(toLocalDateTime(promotion.startsAt) || toLocalDateTime(Date.now()));
    setEndsAt(toLocalDateTime(promotion.endsAt) || toLocalDateTime(Date.now() + 7 * 86400000));
    setActive(promotion.active !== false);
    setPromoFieldErrors({});
    setPromoTouched({});
    setError("");
    setNotice("");
  };

  const cancelForm = () => {
    setCreating(false);
    setEditing(null);
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    const errors = {
      name: validateField("name", promoName),
      code: validateField("code", promoCode),
      discountValue: validateField("discountValue", discountValue),
      endsAt: validateField("endsAt", endsAt),
    };
    const hasErr = Object.values(errors).some(Boolean);
    if (hasErr) {
      setPromoTouched({ name: true, code: true, discountValue: true, endsAt: true });
      setPromoFieldErrors(errors);
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    const payload = {
      name: promoName.trim(),
      code: promoCode.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue) || 0,
      minimumOrder: Number(minimumOrder) || 0,
      maximumDiscount: discountType === "PERCENT" && maximumDiscount ? Number(maximumDiscount) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      active,
    };
    try {
      if (editing?.id) {
        await updateStaffPromotion(editing.id, payload);
        setNotice("Đã cập nhật chương trình khuyến mãi");
      } else {
        await createStaffPromotion(payload);
        setNotice("Đã tạo chương trình khuyến mãi");
      }
      await refresh();
      setEditing(null);
      setCreating(false);
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
      if (editing?.id === promotion.id) setEditing(null);
      setNotice("Đã xóa mã khuyến mãi");
    } catch (reason) {
      setError(reason.message);
    }
  };

  const renderForm = () => (
    <form key={editing?.id || "new-promotion"} className="staff-management-form" onSubmit={submit} noValidate>
      {error && (
        <div className="staff-form-error staff-management-wide" role="alert">
          <Icon name="alert" className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <label className={`profile-field ${promoTouched.name && promoFieldErrors.name ? "has-error" : ""}`}>
        <span>Tên chương trình *</span>
        <input
          name="name"
          required
          placeholder="Ví dụ: Ưu đãi mùa hè"
          value={promoName}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          onBlur={() => handleFieldBlur("name")}
          className={promoTouched.name && promoFieldErrors.name ? "is-invalid" : ""}
        />
        {promoTouched.name && promoFieldErrors.name && (
          <span className="profile-field-error">
            <Icon name="alert" className="h-3.5 w-3.5" />
            {promoFieldErrors.name}
          </span>
        )}
      </label>
      <label className={`profile-field ${promoTouched.code && promoFieldErrors.code ? "has-error" : ""}`}>
        <span>Mã giảm giá *</span>
        <input
          name="code"
          required
          placeholder="Ví dụ: SUMMER2026"
          value={promoCode}
          onChange={(e) => handleFieldChange("code", e.target.value)}
          onBlur={() => handleFieldBlur("code")}
          style={{ textTransform: "uppercase" }}
          className={promoTouched.code && promoFieldErrors.code ? "is-invalid" : ""}
        />
        {promoTouched.code && promoFieldErrors.code && (
          <span className="profile-field-error">
            <Icon name="alert" className="h-3.5 w-3.5" />
            {promoFieldErrors.code}
          </span>
        )}
      </label>

      <div className="profile-field staff-management-wide">
        <span>Hình thức giảm giá</span>
        <div className="staff-discount-type-tabs">
          <button
            type="button"
            className={`staff-discount-tab ${discountType === "PERCENT" ? "is-active" : ""}`}
            onClick={() => setDiscountType("PERCENT")}
          >
            <strong>%</strong>
            <span>Giảm theo phần trăm</span>
          </button>
          <button
            type="button"
            className={`staff-discount-tab ${discountType === "FIXED" ? "is-active" : ""}`}
            onClick={() => {
              setDiscountType("FIXED");
              setMaximumDiscount("");
            }}
          >
            <strong>₫</strong>
            <span>Giảm số tiền cố định</span>
          </button>
        </div>
      </div>

      {discountType === "PERCENT" ? (
        <>
          <label className={`profile-field ${promoTouched.discountValue && promoFieldErrors.discountValue ? "has-error" : ""}`}>
            <span>Mức giảm (%) *</span>
            <div className="staff-input-with-suffix">
              <input
                type="number"
                min={1}
                max={100}
                required
                value={discountValue}
                onChange={(e) => handleFieldChange("discountValue", e.target.value)}
                onBlur={() => handleFieldBlur("discountValue")}
                placeholder="10"
                className={promoTouched.discountValue && promoFieldErrors.discountValue ? "is-invalid" : ""}
              />
              <span className="staff-input-suffix">%</span>
            </div>
            {promoTouched.discountValue && promoFieldErrors.discountValue && (
              <span className="profile-field-error">
                <Icon name="alert" className="h-3.5 w-3.5" />
                {promoFieldErrors.discountValue}
              </span>
            )}
          </label>
          <label className="profile-field">
            <span>Giảm tối đa (VNĐ)</span>
            <MoneyInput
              value={maximumDiscount}
              onChange={setMaximumDiscount}
              placeholder="Không giới hạn"
            />
          </label>
          <label className="profile-field">
            <span>Đơn tối thiểu (VNĐ)</span>
            <MoneyInput
              value={minimumOrder}
              onChange={setMinimumOrder}
              placeholder="0"
            />
          </label>
          <label className="profile-field">
            <span>Số lần sử dụng</span>
            <input
              name="usageLimit"
              type="number"
              min="1"
              placeholder="Không giới hạn"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
          </label>
        </>
      ) : (
        <>
          <label className={`profile-field ${promoTouched.discountValue && promoFieldErrors.discountValue ? "has-error" : ""}`}>
            <span>Số tiền giảm (VNĐ) *</span>
            <MoneyInput
              required
              value={discountValue}
              onChange={(val) => handleFieldChange("discountValue", val)}
              onBlur={() => handleFieldBlur("discountValue")}
              placeholder="50.000"
              className={promoTouched.discountValue && promoFieldErrors.discountValue ? "is-invalid" : ""}
            />
            {promoTouched.discountValue && promoFieldErrors.discountValue && (
              <span className="profile-field-error">
                <Icon name="alert" className="h-3.5 w-3.5" />
                {promoFieldErrors.discountValue}
              </span>
            )}
          </label>
          <label className="profile-field">
            <span>Đơn tối thiểu (VNĐ)</span>
            <MoneyInput
              value={minimumOrder}
              onChange={setMinimumOrder}
              placeholder="0"
            />
          </label>
          <label className="profile-field">
            <span>Số lần sử dụng</span>
            <input
              name="usageLimit"
              type="number"
              min="1"
              placeholder="Không giới hạn"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
            />
          </label>
          <div />
        </>
      )}

      <label className="profile-field">
        <span>Bắt đầu</span>
        <input
          name="startsAt"
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => handleFieldChange("startsAt", e.target.value)}
        />
      </label>
      <label className={`profile-field ${promoTouched.endsAt && promoFieldErrors.endsAt ? "has-error" : ""}`}>
        <span>Kết thúc</span>
        <input
          name="endsAt"
          type="datetime-local"
          required
          value={endsAt}
          onChange={(e) => handleFieldChange("endsAt", e.target.value)}
          onBlur={() => handleFieldBlur("endsAt")}
          className={promoTouched.endsAt && promoFieldErrors.endsAt ? "is-invalid" : ""}
        />
        {promoTouched.endsAt && promoFieldErrors.endsAt && (
          <span className="profile-field-error">
            <Icon name="alert" className="h-3.5 w-3.5" />
            {promoFieldErrors.endsAt}
          </span>
        )}
      </label>

      <label className="staff-promotion-active staff-management-wide">
        <input
          name="active"
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        Đang hoạt động
      </label>

      <div className="staff-management-form-actions staff-management-wide">
        <button className="staff-primary-action" disabled={busy}>
          {busy ? "ĐANG LƯU…" : editing ? "LƯU CHƯƠNG TRÌNH" : "TẠO CHƯƠNG TRÌNH"}
        </button>
        <button type="button" className="staff-secondary-action" onClick={cancelForm}>
          Hủy
        </button>
      </div>
    </form>
  );

  return (
    <InternalLayout active="promotions" isAdmin={user?.role === "ADMIN"} user={user} onLogout={onLogout}>
      <header className="internal-page-heading" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1 className="font-display">Khuyến mãi</h1>
        {!creating && !editing && (
          <button type="button" className="staff-primary-action" onClick={startCreate}>
            Thêm chương trình
          </button>
        )}
      </header>
      {error && !creating && !editing && (
        <div className="staff-form-error" role="alert">
          <Icon name="alert" className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="staff-form-notice" role="status">
          <Icon name="check" className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {creating && (
        <section className="staff-management-panel" style={{ marginBottom: "20px" }}>
          <div className="staff-management-panel-head">
            <h2>Tạo chương trình và mã giảm giá</h2>
            <button type="button" className="staff-secondary-action" onClick={cancelForm}>Đóng</button>
          </div>
          {renderForm()}
        </section>
      )}

      <div className="staff-promotion-list">
        {promotions.map((promotion) => {
          if (editing?.id === promotion.id) {
            return (
              <section key={promotion.id} className="staff-management-panel" style={{ margin: "10px 0" }}>
                <div className="staff-management-panel-head">
                  <h2>Chỉnh sửa chương trình</h2>
                  <button type="button" className="staff-secondary-action" onClick={cancelForm}>Hủy sửa</button>
                </div>
                {renderForm()}
              </section>
            );
          }

          return (
            <article className="staff-promotion-row" key={promotion.id}>
              <div>
                <strong>{promotion.name}</strong>
                <span>
                  {promotion.code} · {promotion.discountType === "PERCENT"
                    ? `Giảm ${promotion.discountValue}%${promotion.maximumDiscount ? ` (tối đa ${formatPrice(promotion.maximumDiscount)})` : ""}`
                    : `Giảm ${formatPrice(promotion.discountValue)}`}
                </span>
                <span>
                  {promotion.minimumOrder > 0 ? `Đơn từ ${formatPrice(promotion.minimumOrder)} · ` : ""}
                  {new Date(promotion.startsAt).toLocaleDateString("vi-VN")} – {new Date(promotion.endsAt).toLocaleDateString("vi-VN")}
                </span>
                <span>{promotion.active ? "Đang bật" : "Đã tắt"}</span>
              </div>
              <div className="staff-promotion-actions">
                <button type="button" className="staff-secondary-action" onClick={() => startEdit(promotion)}>Chỉnh sửa</button>
                <button type="button" className="staff-secondary-action is-danger" onClick={() => remove(promotion)}>Xóa</button>
              </div>
            </article>
          );
        })}
      </div>
    </InternalLayout>
  );
}
