import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatPrice, getPrimaryProductMenuCategory, getProductMenuCategories, getProducts, getStorefrontContent, searchProducts } from "../services/storefront.js";
import BrandMark from "./BrandMark.jsx";
import Icon from "./Icon.jsx";

const { navigation } = getStorefrontContent();
const navItems = navigation.items;

const categoryHref = (category) => `/store?subCategory=${category.id}`;

export default function SiteHeader({ route, cartCount, search, setSearch, onAccount }) {
  const productCategories = getProductMenuCategories();
  const startsOverHero = route === "/";
  const [headerOverHero, setHeaderOverHero] = useState(startsOverHero);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchClosing, setSearchClosing] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [openProductCategory, setOpenProductCategory] = useState(null);
  const [mobileOpenCategories, setMobileOpenCategories] = useState(() => productCategories.map(({ id }) => id));
  const [headerVisible, setHeaderVisible] = useState(true);
  const productDropdownRef = useRef(null);
  const headerOverHeroRef = useRef(startsOverHero);
  const searchCloseTimer = useRef(null);
  const lastScrollY = useRef(window.scrollY);
  const [expandedHeaderHeight, setExpandedHeaderHeight] = useState(76);
  const isHome = route === "/";
  const hasGlassBackground = !isHome || !headerOverHero || Boolean(openProductCategory);
  const showMenuPanel = Boolean(openProductCategory);
  const searchResults = searchProducts(search, 100);
  const trendingProducts = getProducts().slice(0, 5);

  const openSearch = () => {
    if (searchCloseTimer.current) window.clearTimeout(searchCloseTimer.current);
    setSearchClosing(false);
    setRecentlyViewed(loadRecentlyViewed());
    setSearchOpen(true);
  };
  const closeSearch = () => {
    if (searchCloseTimer.current) window.clearTimeout(searchCloseTimer.current);
    setSearchClosing(true);
    searchCloseTimer.current = window.setTimeout(() => {
      setSearchOpen(false);
      setSearchClosing(false);
      searchCloseTimer.current = null;
    }, 220);
  };

  const openProductMenu = (categoryId) => {
    setOpenProductCategory(categoryId);
  };

  const closeProductMenu = () => {
    setOpenProductCategory(null);
  };

  useEffect(() => {
    const update = () => {
      const currentScrollY = window.scrollY;
      let nextHeaderOverHero = false;

      if (isHome) {
        const hero = document.querySelector(".home-hero");
        nextHeaderOverHero = Boolean(hero && hero.getBoundingClientRect().bottom > 0);
      }

      if (headerOverHeroRef.current !== nextHeaderOverHero) {
        headerOverHeroRef.current = nextHeaderOverHero;
        setHeaderOverHero(nextHeaderOverHero);
        closeProductMenu();
      }

      if (isHome || currentScrollY <= 28) {
        setHeaderVisible(true);
      } else {
        const scrollDelta = currentScrollY - lastScrollY.current;
        if (scrollDelta > 3) {
          setHeaderVisible(false);
          closeProductMenu();
        } else if (scrollDelta < -3) {
          setHeaderVisible(true);
        }
      }
      lastScrollY.current = currentScrollY;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [isHome, route]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    setHeaderVisible(true);
    setMenuOpen(false);
    setSearchOpen(false);
    setSearchClosing(false);
    if (searchCloseTimer.current) window.clearTimeout(searchCloseTimer.current);
    closeProductMenu();
    headerOverHeroRef.current = startsOverHero;
    setHeaderOverHero(startsOverHero);
    setMobileOpenCategories(productCategories.map(({ id }) => id));
  }, [route]);

  useLayoutEffect(() => {
    const dropdown = productDropdownRef.current;
    if (!showMenuPanel || !dropdown) {
      setExpandedHeaderHeight(76);
      return undefined;
    }

    const measureDropdown = () => {
      const activeDropdown = productDropdownRef.current;
      if (activeDropdown) setExpandedHeaderHeight(Math.ceil(activeDropdown.getBoundingClientRect().bottom + 8));
    };
    measureDropdown();
    const observer = new ResizeObserver(measureDropdown);
    observer.observe(dropdown);
    window.addEventListener("resize", measureDropdown);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measureDropdown);
    };
  }, [showMenuPanel, openProductCategory]);

  useEffect(() => () => {
    if (searchCloseTimer.current) window.clearTimeout(searchCloseTimer.current);
  }, []);

  return <>
    <header style={showMenuPanel ? { height: `${expandedHeaderHeight}px` } : undefined} className={`site-header fixed inset-x-0 top-0 z-[70] h-[76px] px-[4.2vw] transition-[height,background-color,backdrop-filter,transform] duration-300 ease-in-out ${!isHome && !headerVisible ? "-translate-y-full pointer-events-none" : "translate-y-0"} ${hasGlassBackground ? "glass-panel text-black" : "home-hero-header bg-transparent text-white"}`}>
      <div className="site-header-inner grid h-[76px] grid-cols-[1fr_auto_1fr] items-center">
        <div className="flex min-w-0 items-center justify-start gap-5">
          <button className="menu-trigger hidden h-9 w-9 items-center justify-center" onClick={() => { setMenuOpen(true); setMobileOpenCategories(productCategories.map(({ id }) => id)); }} aria-label="Mở menu"><Icon name="menu" /></button>
          <nav className="desktop-nav hidden items-center gap-[clamp(14px,1.7vw,28px)] whitespace-nowrap text-[clamp(14px,.95vw,17px)]">
            {productCategories.map((group) => <div key={group.id} className={`product-nav relative ${openProductCategory === group.id ? "is-open" : ""}`} onMouseEnter={() => openProductMenu(group.id)} onMouseLeave={closeProductMenu} onFocus={() => openProductMenu(group.id)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) closeProductMenu(); }}>
              <a className="transition-opacity hover:opacity-55" href={categoryHref(group)}>{group.title}</a>
              {openProductCategory === group.id && showMenuPanel && <div ref={productDropdownRef} className="product-dropdown" aria-label={group.title}>
                <div className="flex flex-col items-start">
                  {group.children.map((child) => <a key={child.id} className="block py-1.5 text-[inherit] leading-snug" href={categoryHref(child)}>{child.label}</a>)}
                </div>
              </div>}
            </div>)}
            {navItems.map(({ label, href }) => <a key={label} className="transition-opacity hover:opacity-55" href={href}>{label}</a>)}
          </nav>
        </div>
        <a className="whitespace-nowrap text-center text-[clamp(23px,2.35vw,48px)]" href="/" aria-label="Trendy - Trang chủ"><BrandMark /></a>
        <div className="flex items-center justify-end gap-[clamp(8px,1.1vw,19px)]">
          <button className="grid h-9 w-8 place-items-center" onClick={openSearch} aria-label="Tìm kiếm"><Icon name="search" className="h-[21px] w-[21px]" /></button>
          <button className="grid h-9 w-8 place-items-center" onClick={onAccount} aria-label="Tài khoản"><Icon name="user" className="h-[22px] w-[22px]" /></button>
          <a className="relative grid h-9 w-8 place-items-center" href="/cart" aria-label={`Túi hàng, ${cartCount} sản phẩm`}><Icon name="bag" className="h-[23px] w-[23px]" />{cartCount > 0 && <span className="absolute -right-1 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-black px-1 text-[9px] leading-none text-white">{cartCount > 99 ? "99+" : cartCount}</span>}</a>
        </div>
      </div>
    </header>

    {menuOpen && <div className="menu-overlay px-5 pb-7 pt-[100px] md:px-[5vw]" role="dialog" aria-modal="true" aria-label="Menu chính">
      <button className="absolute right-5 top-5 grid h-10 w-10 place-items-center md:right-[5vw] md:top-8" onClick={() => setMenuOpen(false)} aria-label="Đóng menu"><Icon name="close" /></button>
      <div className="mx-auto w-full max-w-6xl">
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
          {productCategories.map((group) => <section key={group.id} className="border-b border-black/10 pb-5">
            <div className="flex items-center justify-between gap-4">
              <a className="text-[16px] font-medium" href={categoryHref(group)}>{group.title}</a>
              <button className="grid h-9 w-9 shrink-0 place-items-center text-xl" type="button" aria-expanded={mobileOpenCategories.includes(group.id)} aria-label={`${mobileOpenCategories.includes(group.id) ? "Thu gọn" : "Mở"} ${group.title}`} onClick={() => setMobileOpenCategories((current) => current.includes(group.id) ? current.filter((id) => id !== group.id) : [...current, group.id])}>{mobileOpenCategories.includes(group.id) ? "−" : "+"}</button>
            </div>
            {mobileOpenCategories.includes(group.id) && <div className="mt-3 flex flex-col items-start gap-2 pl-4">
              {group.children.map((child) => <a key={child.id} className="text-[16px] leading-snug" href={categoryHref(child)}>{child.label}</a>)}
            </div>}
          </section>)}
        </div>
        <nav className="mt-8 flex flex-col items-start gap-5" aria-label="Liên kết chính">
          {navItems.map(({ label, href }) => <a key={label} className="text-[16px] font-medium" href={href}>{label}</a>)}
        </nav>
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-9 text-[9px] uppercase tracking-[.1em] text-black md:flex-row md:justify-between"><BrandMark textClassName="text-sm" /><span>{navigation.locale}</span></div>
    </div>}

    {searchOpen && <div className={`search-overlay px-5 pb-12 pt-6 md:px-[5vw] ${searchClosing ? "is-closing" : ""}`} role="dialog" aria-modal="true" aria-label="Tìm kiếm">
      <div className="mx-auto flex max-w-[1120px] justify-end"><button className="grid h-10 w-10 place-items-center" onClick={closeSearch} aria-label="Đóng tìm kiếm"><Icon name="close" /></button></div>
      <label className="mx-auto mt-12 flex max-w-[1120px] items-center gap-4 border-b border-black pb-3 md:mt-16">
        <Icon name="search" className="h-6 w-6 shrink-0" />
        <input autoFocus className="min-w-0 flex-1 border-0 bg-transparent px-0 text-base outline-none placeholder:text-neutral-400 md:text-lg" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập từ khóa tìm kiếm" />
        {search && <button className="shrink-0 text-xs uppercase tracking-[.08em]" onClick={() => setSearch("")} type="button">Xóa</button>}
      </label>
      <div className="mx-auto mt-10 max-w-[1120px] md:mt-16">
        {search.trim() ? <section aria-label="Kết quả tìm kiếm">
          <div className="mb-5 flex items-end justify-between gap-4"><h2 className="text-sm font-medium uppercase tracking-[.06em]">Kết quả tìm kiếm</h2><span className="text-xs">{searchResults.length} sản phẩm</span></div>
          {searchResults.length ? <SearchProductGrid products={searchResults} /> : <p className="py-12 text-sm">Không tìm thấy sản phẩm phù hợp với “{search.trim()}”.</p>}
        </section> : <section aria-label="Xu hướng tìm kiếm">
          <h2 className="mb-5 text-sm font-medium uppercase tracking-[.06em]">Xu hướng tìm kiếm</h2>
          <SearchProductGrid products={trendingProducts} />
        </section>}
        <section className="mt-14 md:mt-20" aria-label={recentlyViewed.length ? "Sản phẩm đã xem" : "Gợi ý sản phẩm"}>
          <div className="mb-5 flex items-end justify-between gap-4"><h2 className="text-sm font-medium uppercase tracking-[.06em]">{recentlyViewed.length ? "Sản phẩm đã xem" : "Gợi ý dành cho bạn"}</h2>{recentlyViewed.length > 0 && <button className="text-xs uppercase tracking-[.06em]" onClick={() => { localStorage.removeItem("gm-recently-viewed"); setRecentlyViewed([]); }}>Xóa lịch sử</button>}</div>
          <SearchProductGrid products={recentlyViewed.length ? recentlyViewed : getProducts().slice(5, 10)} />
        </section>
      </div>
    </div>}

  </>;
}

function loadRecentlyViewed() {
  try {
    const slugs = JSON.parse(localStorage.getItem("gm-recently-viewed") || "[]");
    const productsBySlug = new Map(getProducts().map((product) => [product.slug, product]));
    return slugs.map((slug) => productsBySlug.get(slug)).filter(Boolean).slice(0, 5);
  } catch {
    return [];
  }
}

function SearchProductGrid({ products }) {
  return <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-5">
    {products.map((product) => {
      const cutout = Boolean(product.front);
      return <a key={product.slug} className="search-product group block min-w-0" href={`/product/${product.slug}`}>
        <div className="search-product-image relative aspect-[.92] overflow-hidden bg-white">
          <img className={`h-full w-full ${cutout ? "object-contain p-5 mix-blend-multiply md:p-7" : "object-cover object-center"}`} src={product.front || product.image} alt={product.name} />
          <span className="absolute bottom-2.5 left-2.5 text-[9px] uppercase tracking-[.06em]">{getPrimaryProductMenuCategory(product)}</span>
        </div>
        <div className="flex items-baseline justify-between gap-2 px-0.5 pt-3">
          <span className="truncate text-xs font-medium md:text-sm">{product.name}</span>
          <span className="shrink-0 text-[10px] tabular-nums md:text-xs">{formatPrice(product.price)}</span>
        </div>
      </a>;
    })}
  </div>;
}
