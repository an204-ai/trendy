/**
 * Tiện ích cập nhật thẻ Meta SEO và Open Graph động khi chuyển trang trong React
 */

const setMetaTag = (selector, attributeName, attributeValue, contentValue) => {
  if (typeof document === "undefined") return;
  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attributeName, attributeValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", contentValue || "");
};

const setCanonical = (url) => {
  if (typeof document === "undefined") return;
  let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
};

const setJsonLd = (id, data) => {
  if (typeof document === "undefined") return;
  let script = document.getElementById(id);
  if (!data) {
    if (script) script.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
};

const toAbsoluteUrl = (pathOrUrl) => {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const origin = typeof window !== "undefined" ? window.location.origin : "https://trendyeye.vn";
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${origin}${cleanPath}`;
};

export function updatePageSeo({
  title,
  description,
  image = "/images/og-banner.jpg",
  url,
  type = "website",
  jsonLd = null,
}) {
  if (typeof document === "undefined") return;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://trendyeye.vn";
  const fullUrl = url ? toAbsoluteUrl(url) : (typeof window !== "undefined" ? window.location.href : "https://trendyeye.vn/");
  const fullImage = toAbsoluteUrl(image);
  const siteName = "Mắt Kính Trendy";
  const fullTitle = title ? `${title} — ${siteName}` : `${siteName} — Kính Cận & Kính Thời Trang Cao Cấp`;
  const defaultDesc = "Khám phá các thiết kế kính cận, kính thời trang và tròng kính cao cấp tại Mắt Kính Trendy. Trải nghiệm không gian đo mắt chuyên sâu tại TP. Hồ Chí Minh.";
  const metaDesc = description ? description.replace(/\s+/g, " ").trim().slice(0, 200) : defaultDesc;

  // Cập nhật tiêu đề trang
  document.title = fullTitle;

  // Cập nhật thẻ meta mô tả
  setMetaTag("meta[name='description']", "name", "description", metaDesc);

  // Cập nhật Canonical link
  setCanonical(fullUrl);

  // Cập nhật Open Graph (Facebook, Zalo, Telegram, v.v.)
  setMetaTag("meta[property='og:site_name']", "property", "og:site_name", siteName);
  setMetaTag("meta[property='og:title']", "property", "og:title", fullTitle);
  setMetaTag("meta[property='og:description']", "property", "og:description", metaDesc);
  setMetaTag("meta[property='og:url']", "property", "og:url", fullUrl);
  setMetaTag("meta[property='og:type']", "property", "og:type", type);
  setMetaTag("meta[property='og:image']", "property", "og:image", fullImage);
  setMetaTag("meta[property='og:image:secure_url']", "property", "og:image:secure_url", fullImage);

  // Cập nhật Twitter Card
  setMetaTag("meta[name='twitter:card']", "name", "twitter:card", "summary_large_image");
  setMetaTag("meta[name='twitter:title']", "name", "twitter:title", fullTitle);
  setMetaTag("meta[name='twitter:description']", "name", "twitter:description", metaDesc);
  setMetaTag("meta[name='twitter:image']", "name", "twitter:image", fullImage);

  // Cập nhật JSON-LD nếu có
  setJsonLd("dynamic-page-json-ld", jsonLd);
}
