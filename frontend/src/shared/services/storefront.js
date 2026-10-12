import { homeHero, homeSections, stories, stores, storefrontContent } from "../content/storefrontContent.js";
import { getCatalogCategories, getCatalogProducts } from "./api.js";

const CACHE_KEY_PRODUCTS = "trendy_catalog_products";
const CACHE_KEY_CATEGORIES = "trendy_catalog_categories";

function loadCached(key, fallback) {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage?.getItem(key) : null;
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveCached(key, value) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage?.setItem(key, JSON.stringify(value));
    }
  } catch {}
}

let catalogProducts = loadCached(CACHE_KEY_PRODUCTS, []);
let catalogMenuCategories = loadCached(CACHE_KEY_CATEGORIES, []);

export const getProducts = () => catalogProducts.filter((product) => product && product.active !== false);

export const getProduct = (slug) => {
  const product = catalogProducts.find((item) => item.slug === slug);
  return product && product.active !== false ? product : null;
};

export const getSlides = () => {
  const activeList = getProducts();
  return [
    { title: "CHẤT LIỆU VÀ SẮC MÀU", image: activeList[0]?.image || homeHero.image, story: "chat-lieu-sac-mau", cta: "Khám phá" },
    { title: "NGHỆ THUẬT CHẾ TÁC", image: activeList[1]?.image || activeList[0]?.image || homeHero.image, story: "nghe-thuat-che-tac", cta: "Khám phá" },
  ];
};

export const getHomeHero = () => homeHero;

export const getHomeSections = () => {
  const activeList = getProducts();
  return homeSections.map((section) => ({
    ...section,
    products: activeList,
    previewProducts: activeList,
  }));
};

export const getStories = () => stories;
export const getStory = (slug) => stories.find((story) => story.slug === slug);
export const getStores = () => stores;
export const getProductMenuCategories = () => catalogMenuCategories;

export const getProductMenuCategory = (id) =>
  catalogMenuCategories.flatMap((group) => [group, ...(group.children || [])]).find((category) => category.id === id);

export const getProductMenuCategoryLabels = (product) => {
  const categoryIds = new Set(Array.isArray(product?.category) ? product.category : product?.category ? [product.category] : []);
  return catalogMenuCategories.flatMap((group) => [
    ...(categoryIds.has(group.id) ? [group.title] : []),
    ...group.children.filter((child) => categoryIds.has(child.id)).map((child) => child.label),
  ]);
};

export const getPrimaryProductMenuCategory = (product) => {
  const categoryIds = new Set(Array.isArray(product?.category) ? product.category : product?.category ? [product.category] : []);
  return catalogMenuCategories.find((group) => categoryIds.has(group.id))?.title || "";
};

export const getStorefrontContent = () => storefrontContent;

export const searchProducts = (query, limit = 5) => {
  const normalize = (value) =>
    value
      .toLocaleLowerCase("vi")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  const normalizedQuery = normalize(query.trim());
  const activeList = getProducts();
  return normalizedQuery
    ? activeList
        .filter((product) =>
          [product.name, ...getProductMenuCategoryLabels(product)].some((value) =>
            normalize(value).includes(normalizedQuery)
          )
        )
        .slice(0, limit)
    : [];
};

export async function refreshCatalog() {
  try {
    const [productsResult, categoriesResult] = await Promise.all([
      getCatalogProducts(),
      getCatalogCategories(),
    ]);

    if (Array.isArray(productsResult)) {
      catalogProducts = productsResult
        .filter((product) => product && product.active !== false)
        .map((product) => ({
          ...product,
          category: Array.isArray(product.category)
            ? product.category
            : (product.categories || []).map((category) => category.id),
          gallery:
            Array.isArray(product.images) && product.images.length
              ? product.images.map((image) => image.url)
              : product.front
              ? [product.image, product.front]
              : [product.image],
        }));
      saveCached(CACHE_KEY_PRODUCTS, catalogProducts);
    }

    if (Array.isArray(categoriesResult)) {
      catalogMenuCategories = categoriesResult.map((category) => ({
        id: category.id,
        title: category.title,
        children: (category.children || []).map((child) => ({
          id: child.id,
          label: child.label || child.title,
        })),
      }));
      saveCached(CACHE_KEY_CATEGORIES, catalogMenuCategories);
    }
  } catch (error) {
    // If network fails, keeps existing cached products and categories
  }

  return { products: getProducts(), categories: catalogMenuCategories };
}

// Trigger initial catalog load
refreshCatalog().catch(() => {});

export const formatPrice = (amount) => `${Number(amount).toLocaleString("vi-VN")} ₫`;

export function getVariants(product) {
  return Array.isArray(product?.variants) ? product.variants : [];
}

export function getProductVariant(product, sku) {
  return getVariants(product).find((variant) => variant.sku === sku) || null;
}

export function getProductPrice(product, sku) {
  return getProductVariant(product, sku)?.price ?? product?.price ?? 0;
}

export function countryName(name = "") {
  const names = {
    "United States": "Hoa Kỳ",
    "South Korea": "Hàn Quốc",
    Japan: "Nhật Bản",
    China: "Trung Quốc",
    Thailand: "Thái Lan",
    Vietnam: "Việt Nam",
  };
  return names[name] || name;
}

export function openingHours(hours = "") {
  return hours
    .replace("Mon–Sat", "Thứ 2–Thứ 7")
    .replace("Every day", "Hằng ngày")
    .replace("Sun", "Chủ nhật")
    .replaceAll("AM", "sáng")
    .replaceAll("PM", "tối");
}
