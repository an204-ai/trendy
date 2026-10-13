import { useState, useEffect } from "react";
import ProductCard from "../../shared/components/ProductCard.jsx";
import { getProduct, getProducts, getStories, getStorefrontContent } from "../../shared/services/storefront.js";

const stories = getStories();
const pageContent = getStorefrontContent().stories;
const storyCopy = (story) => story;

function StoryBanner({ story, featured = false }) {
  const text = storyCopy(story);

  return <a
    className={`group relative block overflow-hidden bg-neutral-300 text-white ${featured ? "stories-feature h-[calc(100svh-76px)] min-h-[524px] max-h-[1024px]" : "stories-banner"}`}
    href={`/stories/${story.slug}`}
    aria-label={`Đọc câu chuyện: ${text.title}`}
  >
    <img className="absolute inset-0 h-full w-full object-cover" src={story.cardImage} alt={text.title} />
    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/10" />
    <div className={`absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 ${featured ? "p-5 pb-12 md:p-[4.2vw] md:pb-[5vw]" : "p-5 md:p-[4.2vw]"}`}>
      <div className={`max-w-2xl ${featured ? "max-w-3xl" : ""}`}>
        {featured && <p className="mb-3 text-xs uppercase tracking-[.14em] md:text-sm">Mới nhất</p>}
        {featured ? <h1 className="font-display text-3xl leading-tight md:text-5xl">{text.title}</h1> : <h2 className="font-display text-2xl leading-tight md:text-4xl">{text.title}</h2>}
        {featured && text.intro && <p className="mt-4 max-w-3xl text-sm leading-6 md:text-base md:leading-7">{text.intro}</p>}
        <span className="mt-3 inline-flex items-center gap-2 text-xs md:text-sm">
          {pageContent.start}
        </span>
      </div>
    </div>
  </a>;
}

function StoryImage({ src, alt, className = "", blend = false }) {
  return <div className={`relative overflow-hidden ${className}`}>
    <img className={`h-full w-full object-cover ${blend ? "mix-blend-multiply" : ""}`} src={src} alt={alt} loading="lazy" />
  </div>;
}

function StoryChapter({ section, inverse = false }) {
  return <div className={inverse ? "text-white" : "text-black"}>
    <h2 className="font-display max-w-xl text-3xl leading-[1.15] md:text-4xl">{section.title}</h2>
    <p className="mt-5 max-w-lg text-sm leading-7 md:mt-7 md:text-base md:leading-8">{section.body}</p>
  </div>;
}

function MaterialStoryLayout({ story, sections }) {
  const [feature, ...details] = sections;
  return <div className="bg-[#f2f3f5] px-5 py-16 md:px-[6vw] md:py-24">
    <div className="mx-auto max-w-[1500px]">
      {feature && <section className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
        <StoryImage src={story.gallery?.[feature.imageIndex] || story.hero} alt={`${story.title} · ${feature.title}`} className="story-photo-soft aspect-[5/4] bg-white md:col-span-8" />
        <div className="md:col-span-4"><StoryChapter section={feature} /></div>
      </section>}
      <div className="mt-16 grid gap-10 md:mt-28 md:grid-cols-2 md:gap-12">
        {details.map((section, index) => <article key={section.title} className={`grid items-center gap-6 ${index === 0 ? "md:pt-10" : "md:pb-10"}`}>
          <StoryImage src={story.gallery?.[section.imageIndex] || story.cardImage} alt={`${story.title} · ${section.title}`} className={`${index === 0 ? "story-photo-circle aspect-square" : "story-photo-arch aspect-[4/3]"} bg-white`} />
          <StoryChapter section={section} />
        </article>)}
      </div>
    </div>
  </div>;
}

function AtelierStoryLayout({ story, sections }) {
  return <section className="bg-black px-5 py-16 text-white md:px-[6vw] md:py-24">
    <div className="mx-auto max-w-[1420px]">
      <div className="mb-12 border-b border-white/30 pb-4 md:mb-16">
        <h2 className="font-display text-3xl md:text-5xl">Trong xưởng chế tác</h2>
      </div>
      <div className="space-y-16 md:space-y-24">
        {sections.map((section, index) => {
          const reverse = index % 2 === 1;
          return <article key={section.title} className="grid items-center gap-7 md:grid-cols-12 md:gap-10">
            <StoryImage src={story.gallery?.[section.imageIndex] || story.cardImage} alt={`${story.title} · ${section.title}`} blend={false} className={`aspect-[4/3] border border-white/15 bg-[#202020] md:col-span-7 ${reverse ? "md:order-2" : "md:order-1"}`} />
            <div className={`md:col-span-4 ${reverse ? "md:order-1" : "md:order-2"}`}><StoryChapter section={section} inverse /></div>
          </article>;
        })}
      </div>
    </div>
  </section>;
}

function StoryEditorialSections({ story, sections }) {
  if (story.layout === "materials") return <MaterialStoryLayout story={story} sections={sections} />;
  return <AtelierStoryLayout story={story} sections={sections} />;
}

export function StoriesPage() {
  const [featured, ...remainingStories] = stories;
  if (!featured) return <NotFound />;

  return <main className="min-h-screen pb-16 pt-[76px]">
    <StoryBanner story={featured} featured />
    <section className="px-5 pt-8 md:px-[4.2vw] md:pt-11">
      <header className="mb-5 flex items-end justify-between border-b border-black/10 pb-4 md:mb-7">
        <h2 className="font-display text-2xl md:text-3xl">{pageContent.allStories}</h2>
      </header>
      <div className="-mx-5 space-y-2 md:-mx-[4.2vw] md:space-y-3">
        {remainingStories.map((story) => <StoryBanner key={story.slug} story={story} />)}
      </div>
    </section>
  </main>;
}

export function StoryDetailPage({ slug, onAdd, onWishlist, wishlist }) {
  const story = stories.find((item) => item.slug === slug);
  const [products, setProducts] = useState(() => getProducts());

  useEffect(() => {
    const update = () => setProducts(getProducts());
    update();
    window.addEventListener("focus", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("focus", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  if (!story) return <NotFound />;
  const text = storyCopy(story);

  const related = (() => {
    const explicit = (story.relatedProducts || []).map(getProduct).filter(Boolean);
    if (explicit.length > 0) return explicit;
    return products.slice(0, 4);
  })();

  const articleSections = text.sections || [];

  return <main className="pb-16 pt-[76px] md:pb-20">
    <section className="relative grid h-[86svh] min-h-[590px] max-h-[1050px] items-end overflow-hidden bg-neutral-700 text-white md:h-[92svh]">
      <img className="absolute inset-0 h-full w-full object-cover" src={story.hero} alt={`${text.title} · hình ảnh mở đầu`} />
      <div className="story-hero-shade absolute inset-0" />
      <div className="relative grid w-full items-end gap-8 px-5 pb-14 pt-36 md:grid-cols-12 md:px-[4.2vw] md:pb-[5vw]">
        <div className="md:col-span-8">
          <h1 className="font-display max-w-4xl text-4xl leading-[1.08] md:text-6xl">{text.title}</h1>
        </div>
      </div>
    </section>

    <section id="story-intro" className="mx-auto max-w-5xl px-5 py-16 md:px-8 md:py-28">
      <p className="font-display text-2xl leading-[1.35] md:text-4xl md:leading-[1.3]">{text.intro}</p>
    </section>

    <StoryEditorialSections story={story} sections={articleSections} />

    <section className="mx-auto max-w-4xl px-5 py-16 text-center md:py-24">
      <span className="font-display text-3xl text-black">“</span>
      <h2 className="font-display mt-2 text-2xl leading-relaxed md:text-4xl">{text.foot}</h2>
    </section>

    <section className="border-t border-black/10 px-5 pt-10 md:px-[4.2vw] md:pt-14">
      <div className="mb-6 flex items-end justify-between gap-4 md:mb-8">
        <h2 className="font-display text-2xl md:text-3xl">SẢN PHẨM TRONG CÂU CHUYỆN</h2>
        <a className="inline-flex shrink-0 items-center gap-2 pb-1 text-[9px] uppercase tracking-[.1em] underline underline-offset-4 md:text-[10px]" href="/store">Xem tất cả</a>
      </div>
      <div className="grid grid-cols-2 gap-x-2 gap-y-8 sm:grid-cols-3 md:grid-cols-4 md:gap-x-4">
        {related.map((product, index) => <ProductCard key={product.slug} product={product} index={index} onAdd={onAdd} onWishlist={onWishlist} wished={wishlist.includes(product.slug)} />)}
      </div>
    </section>

    <section className="mx-5 mt-12 border-t border-black/10 py-7 md:mx-[4.2vw] md:mt-16 md:flex md:items-center md:justify-between">
      <p className="text-[9px] uppercase tracking-[.14em] text-black">ĐỌC TIẾP</p>
      <div className="mt-4 flex flex-col gap-3 md:mt-0 md:flex-row md:gap-8">
        {stories.filter((item) => item.slug !== slug).map((item) => <a key={item.slug} href={`/stories/${item.slug}`} className="font-display text-lg transition-opacity hover:opacity-60 md:text-xl">{storyCopy(item).title}</a>)}
      </div>
    </section>
  </main>;
}

export function NotFound() {
  return <main className="grid min-h-[75vh] place-items-center px-5 pt-24 text-center"><div><h1 className="font-display text-5xl">TRANG NÀY KHÔNG TỒN TẠI</h1><a className="pill-button mt-7" href="/">Về trang chủ</a></div></main>;
}
