import { useEffect, useMemo, useState } from "react";
import Icon from "../../shared/components/Icon.jsx";
import ProductCard from "../../shared/components/ProductCard.jsx";
import { getProductMenuCategories, getProductMenuCategory, getProducts, getStorefrontContent, searchProducts } from "../../shared/services/storefront.js";

const config = getStorefrontContent().store;
const productCategoryHref = (item) => `/store?subCategory=${item.id}`;
const normalizeStoreCategory = (value) => value === "All" || getProductMenuCategory(value) ? value : "All";

export default function StorePage({ category, subCategory, onAdd, onWishlist, wishlist, catalogVersion }) {
  const productCategories = getProductMenuCategories();
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(() => normalizeStoreCategory(category));
  const [sort, setSort] = useState("Nổi bật");
  const [search, setSearch] = useState("");

  useEffect(() => { setCategoryId(normalizeStoreCategory(category)); }, [category]);
  useEffect(() => { setCategoryMenuOpen(false); }, [subCategory]);

  const filtered = useMemo(() => {
    let list = [...getProducts()];
    const activeCategory = getProductMenuCategory(subCategory);
    if (categoryId !== "All") list = list.filter((product) => product.category?.includes(categoryId));
    if (activeCategory) list = list.filter((product) => product.category?.includes(activeCategory.id));
    if (search.trim()) {
      const matchingProducts = new Set(searchProducts(search, 100).map((product) => product.slug));
      list = list.filter((product) => matchingProducts.has(product.slug));
    }
    if (sort === "Giá thấp đến cao") list.sort((a, b) => a.price - b.price);
    if (sort === "Giá cao đến thấp") list.sort((a, b) => b.price - a.price);
    if (sort === "Tên sản phẩm") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [categoryId, subCategory, search, sort, catalogVersion]);

  const selectedMenuCategory = getProductMenuCategory(subCategory);
  const title = selectedMenuCategory?.label || selectedMenuCategory?.title || config.title[categoryId] || config.title.All;
  const description = config.description[categoryId] || config.description.All;
  const resetFilters = () => { setCategoryId("All"); setSearch(""); setSort("Nổi bật"); window.history.pushState(null, "", "/store"); window.dispatchEvent(new PopStateEvent("popstate")); };

  return <main className="min-h-screen bg-white pb-20 pt-[112px] md:pt-[124px]">
    <div className="flex items-center justify-between gap-4 px-5 md:px-[4.2vw]">
      <button className="flex min-h-11 min-w-0 items-center gap-3 rounded-full border border-black/15 bg-white px-5 text-left transition-colors hover:border-black focus:outline-none focus-visible:ring-1 focus-visible:ring-black focus-visible:ring-offset-2" type="button" onClick={() => setCategoryMenuOpen((current) => !current)} aria-expanded={categoryMenuOpen}>
        <span className="shrink-0 text-[10px] uppercase tracking-[.08em]">Danh mục</span>
        <span className="truncate text-sm">{selectedMenuCategory?.label || selectedMenuCategory?.title || "Tất cả sản phẩm"}</span>
        <span className="ml-1 text-base leading-none">{categoryMenuOpen ? "−" : "+"}</span>
      </button>
      <button className="inline-flex shrink-0 items-center gap-2 px-0 text-sm" onClick={() => setFilterOpen(!filterOpen)} aria-expanded={filterOpen}>Lọc <Icon name="filter" className="h-6 w-6" /></button>
    </div>
    {categoryMenuOpen && <section className="mx-5 mt-4 rounded-2xl bg-[#f6f6f6] px-5 py-6 md:mx-[4.2vw] md:px-8 md:py-8" aria-label="Danh mục sản phẩm">
      <div className="mb-6 border-b border-black/10 pb-4 md:mb-7">
        <a className={`text-sm font-medium transition-opacity hover:opacity-60 ${!subCategory ? "underline underline-offset-4" : ""}`} href="/store">Tất cả sản phẩm</a>
      </div>
      <div className="grid gap-7 md:grid-cols-2 md:gap-0">
        {productCategories.map((group, index) => <section key={group.id} className={`${index ? "border-t border-black/10 pt-7 md:border-l md:border-t-0 md:pl-8 md:pt-0" : "md:pr-8"}`}>
          <a className={`mb-4 block text-sm font-medium transition-opacity hover:opacity-60 ${subCategory === group.id ? "underline underline-offset-4" : ""}`} href={productCategoryHref(group)}>{group.title}</a>
          <div className="grid gap-x-6 gap-y-3 pl-3 sm:grid-cols-2 md:gap-x-8">
            {group.children.map((child) => <a key={child.id} className={`text-sm leading-snug transition-opacity hover:opacity-60 ${subCategory === child.id ? "underline underline-offset-4" : ""}`} href={productCategoryHref(child)}>{child.label}</a>)}
          </div>
        </section>)}
      </div>
    </section>}
    {filterOpen && <section className="mx-5 mt-5 grid gap-4 rounded-2xl border border-black/10 bg-white/60 p-4 sm:grid-cols-2 lg:grid-cols-3 md:mx-[4.2vw] md:p-6">
      <label className="flex flex-col gap-2 text-[10px] uppercase tracking-[.08em]">Danh mục<select className="h-10 rounded-full border border-black/15 bg-transparent px-3 text-sm normal-case tracking-normal" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{config.categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="flex flex-col gap-2 text-[10px] uppercase tracking-[.08em]">Sắp xếp<select className="h-10 rounded-full border border-black/15 bg-transparent px-3 text-sm normal-case tracking-normal" value={sort} onChange={(event) => setSort(event.target.value)}>{config.sortOptions.map((option) => <option key={option}>{option}</option>)}</select></label>
      <label className="flex flex-col gap-2 text-[10px] uppercase tracking-[.08em] sm:col-span-2 lg:col-span-2">Tìm sản phẩm<input className="h-10 rounded-full border border-black/15 bg-transparent px-3 text-sm normal-case tracking-normal outline-none focus:border-black" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập tên sản phẩm hoặc danh mục" /></label>
      <button className="pill-button self-end text-[10px] uppercase tracking-[.06em]" onClick={resetFilters}>Xóa bộ lọc</button>
    </section>}

    <header className="mx-auto mt-[62px] max-w-4xl px-5 text-center md:mt-[74px]">
      <h1 className="font-display text-[27px] font-semibold tracking-[-.035em] md:text-[30px]">{title}</h1>
      <p className="mx-auto mt-4 max-w-3xl text-sm leading-6 text-black md:text-base">{description}</p>
    </header>

    <section className="store-results mx-5 mt-[clamp(48px,5vw,72px)] md:mx-[4.2vw]">
      <div className="mb-4 flex items-center justify-between border-b border-black/10 pb-3 text-[10px] uppercase tracking-[.08em] text-black"><span>{filtered.length} sản phẩm</span><button className="md:hidden" onClick={() => setFilterOpen(true)}>Lọc sản phẩm</button></div>
      {filtered.length ? <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3 2xl:gap-x-7">{filtered.map((product, index) => <ProductCard key={product.slug} product={product} index={index} onAdd={onAdd} onWishlist={onWishlist} wished={wishlist.includes(product.slug)} />)}</div> : <div className="grid min-h-72 place-items-center text-center"><div><p className="font-display text-2xl">Chưa có sản phẩm phù hợp</p><button className="pill-button mt-5 text-xs" onClick={resetFilters}>Xóa bộ lọc</button></div></div>}
    </section>
  </main>;
}
