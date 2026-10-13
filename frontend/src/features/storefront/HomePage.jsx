import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatPrice, getHomeHero, getHomeSections } from "../../shared/services/storefront.js";
import Icon from "../../shared/components/Icon.jsx";

function HomeProductCard({ product, onWishlist, wished, image, sizeClass, imageFit = "contain", compactMeta = false, interactive = true }) {
  return <article className={`home-product-card group relative min-w-0 shrink-0 ${sizeClass}`}>
    <div className="home-product-image relative aspect-square overflow-hidden bg-[#f5f6f7]">
      <a className="absolute inset-0 flex items-center justify-center" href={`/product/${product.slug}`} aria-label={`Xem ${product.name}`} tabIndex={interactive ? undefined : -1}>
        <img className={`h-full w-full ${imageFit === "contain" ? "object-contain p-[8%] mix-blend-multiply" : "object-cover object-top"}`} src={image || product.image} alt={product.name} />
      </a>
      <button className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-black shadow-sm transition hover:bg-white" onClick={() => onWishlist?.(product.slug)} aria-label={wished ? "Bỏ khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"} aria-pressed={wished} tabIndex={interactive ? undefined : -1}>
        <Icon name="heart" className="h-[18px] w-[18px]" filled={wished} />
      </button>
    </div>
    <a className={`${compactMeta ? "mt-2" : "mt-3"} block text-left`} href={`/product/${product.slug}`} tabIndex={interactive ? undefined : -1}>
      <span className={`block truncate ${compactMeta ? "text-[11px] leading-4 md:text-xs" : "text-[13px] leading-5 md:text-sm"}`}>{product.name}</span>
      <span className={`block tabular-nums text-black ${compactMeta ? "mt-0.5 text-[10px] leading-4 md:text-[11px]" : "mt-0.5 text-[12px] leading-5 md:text-sm"}`}>{formatPrice(product.price)}</span>
    </a>
  </article>;
}

function useMouseDragCarousel() {
  const drag = useRef({ isDragging: false, startX: 0, startScrollLeft: 0, moved: false });

  return {
    onMouseDown(event) {
      if (event.button !== 0 || event.target.closest("button")) return;
      drag.current = { isDragging: true, startX: event.clientX, startScrollLeft: event.currentTarget.scrollLeft, moved: false };
    },
    onMouseMove(event) {
      if (!drag.current.isDragging) return;
      const distance = event.clientX - drag.current.startX;
      if (Math.abs(distance) > 4) drag.current.moved = true;
      if (drag.current.moved) {
        event.preventDefault();
        event.currentTarget.scrollLeft = drag.current.startScrollLeft - distance;
      }
    },
    onMouseUp() {
      drag.current.isDragging = false;
    },
    onMouseLeave() {
      drag.current.isDragging = false;
    },
    onClickCapture(event) {
      if (!drag.current.moved) return;
      event.preventDefault();
      event.stopPropagation();
      drag.current.moved = false;
    },
    onDragStart(event) {
      event.preventDefault();
    },
  };
}

function LookbookSection({ section, wishlist, onWishlist, carouselRef }) {
  const cardRefs = useRef([]);
  const thumbnailRefs = useRef([]);
  const thumbnailViewportRef = useRef(null);
  const isSyncingRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dragHandlers = useMouseDragCarousel();
  const productCount = section?.products?.length || 0;

  useEffect(() => {
    if (!productCount) return;
    const carousel = carouselRef.current;
    const firstMiddleCard = cardRefs.current[productCount];
    if (!carousel || !firstMiddleCard) return;
    const offset = firstMiddleCard.getBoundingClientRect().left - carousel.getBoundingClientRect().left;
    if (Math.abs(offset) > 1) {
      carousel.scrollLeft += offset;
    }
    syncActiveSlide();
  }, [productCount]);

  if (!productCount) return null;

  const syncActiveSlide = () => {
    const carousel = carouselRef.current;
    if (!carousel || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      const cycleWidth = getCycleWidth();
      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (cycleWidth > 0 && maxScroll >= cycleWidth * 1.5) {
        if (carousel.scrollLeft < cycleWidth) {
          carousel.scrollLeft += cycleWidth;
        } else if (carousel.scrollLeft >= cycleWidth * 2) {
          carousel.scrollLeft -= cycleWidth;
        }
      }
      const thumbnailViewport = thumbnailViewportRef.current;
      if (thumbnailViewport) {
        const firstMiddleThumb = thumbnailRefs.current[productCount];
        const firstTrailingThumb = thumbnailRefs.current[productCount * 2];
        const thumbnailCycleWidth = firstMiddleThumb && firstTrailingThumb
          ? firstTrailingThumb.getBoundingClientRect().left - firstMiddleThumb.getBoundingClientRect().left
          : 0;
        const cyclePosition = cycleWidth > 0 ? ((carousel.scrollLeft - cycleWidth) % cycleWidth + cycleWidth) % cycleWidth : 0;
        const progress = cycleWidth > 0 ? cyclePosition / cycleWidth : 0;
        thumbnailViewport.scrollLeft = thumbnailCycleWidth * (1 + progress);
      }
      const left = carousel.getBoundingClientRect().left;
      let closestIndex = 0;
      let closestDistance = Infinity;
      cardRefs.current.forEach((card, index) => {
        if (!card) return;
        const distance = Math.abs(card.getBoundingClientRect().left - left);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });
      const productIndex = productCount > 0 ? closestIndex % productCount : 0;
      setActiveIndex((current) => current === productIndex ? current : productIndex);
    } finally {
      isSyncingRef.current = false;
    }
  };

  const getCycleWidth = () => {
    const carousel = carouselRef.current;
    const firstMiddleCard = cardRefs.current[productCount];
    const firstTrailingCard = cardRefs.current[productCount * 2];
    if (!carousel || !firstMiddleCard || !firstTrailingCard) return 0;
    return firstTrailingCard.getBoundingClientRect().left - firstMiddleCard.getBoundingClientRect().left;
  };

  const selectSlide = (index) => {
    const carousel = carouselRef.current;
    const card = cardRefs.current[index + productCount];
    if (carousel && card) {
      const distance = card.getBoundingClientRect().left - carousel.getBoundingClientRect().left;
      carousel.scrollTo({ left: carousel.scrollLeft + distance, behavior: "smooth" });
    }
    setActiveIndex(index);
  };

  const repeatedProducts = [
    ...section.products.map((product, index) => ({ product, index, copy: 0 })),
    ...section.products.map((product, index) => ({ product, index, copy: 1 })),
    ...section.products.map((product, index) => ({ product, index, copy: 2 })),
  ];

  const safeProductIndex = productCount > 0 ? activeIndex % productCount : 0;

  return <>
    <div ref={carouselRef} onScroll={syncActiveSlide} {...dragHandlers} className="home-lookbook-carousel flex cursor-grab select-none touch-pan-x gap-[3.2vw] overflow-x-auto overscroll-x-contain pr-[2.2vw] active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {repeatedProducts.map(({ product, index, copy }, renderIndex) => <div key={`${copy}-${product.slug}`} ref={(node) => { cardRefs.current[renderIndex] = node; }} aria-hidden={copy !== 1} className="w-[82vw] shrink-0 sm:w-[58vw] xl:w-[43vw]">
        <HomeProductCard product={product} image={product.image} imageFit="cover" sizeClass="w-full" onWishlist={onWishlist} wished={wishlist.includes(product.slug)} interactive={copy === 1} />
      </div>)}
    </div>
    <div className="mt-5 flex min-h-[54px] items-center justify-center gap-3" aria-label={section.previewLabel}>
      <div ref={thumbnailViewportRef} className="home-lookbook-thumbnails w-[min(90vw,360px)] overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-center gap-3 pr-[300px] sm:gap-4 sm:pl-[2px]">
          {repeatedProducts.map(({ product, index, copy }, renderIndex) => <button key={`${copy}-${product.slug}`} ref={(node) => { thumbnailRefs.current[renderIndex] = node; }} className={`home-lookbook-thumb h-[46px] w-[29px] shrink-0 overflow-hidden transition-opacity sm:h-[58px] sm:w-[37px] ${activeIndex === index ? "opacity-100" : "opacity-45 hover:opacity-80"}`} onClick={() => selectSlide(index)} aria-label={`Xem ${product.name}`} aria-pressed={activeIndex === index} aria-hidden={copy !== 1} tabIndex={copy === 1 ? undefined : -1}>
            <img className="h-full w-full object-cover object-top" src={product.image} alt="" />
          </button>)}
        </div>
      </div>
      <a className="whitespace-nowrap text-[9px] font-medium uppercase tracking-[.04em] underline-offset-4 hover:underline" href={`/product/${section.products[safeProductIndex]?.slug || section.products[0]?.slug}`}>{section.previewLabel}</a>
    </div>
  </>;
}

function BestsellersSection({ section, wishlist, onWishlist, carouselRef }) {
  const dragHandlers = useMouseDragCarousel();
  if (!section?.products?.length) return null;
  return <div ref={carouselRef} {...dragHandlers} className="home-best-carousel flex cursor-grab select-none touch-pan-x gap-3 overflow-x-auto overscroll-x-contain pb-2 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 lg:gap-5">
    {section.products.map((product) => <div key={product.slug} className="w-[56vw] shrink-0 sm:w-[38vw] lg:w-[28vw] xl:w-[23vw]">
      <HomeProductCard product={product} image={product.front || product.image} sizeClass="w-full" onWishlist={onWishlist} wished={wishlist.includes(product.slug)} compactMeta />
    </div>)}
  </div>;
}

function HomeHero({ hero }) {
  const heroData = hero || getHomeHero();
  const slides = heroData?.slides?.length ? heroData.slides : [{ poster: heroData?.image }];
  const [activeIndex, setActiveIndex] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const activeSlide = slides[activeIndex];
  const hasActiveVideo = Boolean(activeSlide.video && !videoFailed);
  const imageStoryDuration = 6200;

  const nextSlide = () => {
    setProgress(0);
    setVideoFailed(false);
    setActiveIndex((current) => (current + 1) % slides.length);
  };

  useEffect(() => {
    setProgress(0);
    setVideoFailed(false);
  }, [activeIndex]);

  useEffect(() => {
    if (hasActiveVideo || slides.length < 2) return undefined;
    const timer = window.setTimeout(nextSlide, imageStoryDuration);
    return () => window.clearTimeout(timer);
  }, [activeIndex, hasActiveVideo, imageStoryDuration, slides.length]);

  const selectSlide = (index) => {
    setProgress(0);
    setVideoFailed(false);
    setActiveIndex(index);
  };

  return <section className="home-hero relative grid min-h-[590px] h-[88svh] max-h-[960px] place-items-center overflow-hidden bg-black text-center text-white">
    {hasActiveVideo
      ? <video key={activeSlide.video} className="absolute inset-0 h-full w-full object-cover object-center" src={activeSlide.video} poster={activeSlide.poster || (activeSlide.video ? undefined : heroData.image)} autoPlay loop={slides.length <= 1} muted playsInline preload="auto" aria-label="Video chiến dịch Trendy" onTimeUpdate={(event) => { const video = event.currentTarget; if (Number.isFinite(video.duration) && video.duration > 0) setProgress((video.currentTime / video.duration) * 100); }} onEnded={slides.length > 1 ? nextSlide : undefined} onError={() => setVideoFailed(true)} />
      : <img key={activeSlide.poster || heroData.image} className="absolute inset-0 h-full w-full object-cover object-center" src={activeSlide.poster || heroData.image} alt="" />}
    <div className="hero-shade absolute inset-0" />
    <div className="absolute bottom-[16%] left-1/2 z-20 w-full -translate-x-1/2 px-5">
      <h1 className="font-display text-[clamp(25px,2.15vw,40px)] leading-tight tracking-[.01em]">{heroData.title}</h1>
      <div className="mt-5 flex flex-wrap justify-center gap-3 md:mt-6 md:gap-4">
        <a className="hero-button inline-flex items-center justify-center" href={`/store?category=${heroData.category}`}>{heroData.shopLabel}</a>
        <a className="hero-button inline-flex items-center justify-center" href={`/stories/${heroData.storySlug}`}>{heroData.storyLabel}</a>
      </div>
    </div>
    {slides.length > 1 ? (
      <div className="absolute bottom-[5%] left-1/2 z-20 flex w-[min(42vw,780px)] -translate-x-1/2 gap-2" aria-label="Cảnh hero">
        {slides.map((slide, index) => <button key={slide.video || slide.poster || index} className="hero-story-track h-px flex-1 overflow-hidden bg-white/40" type="button" onClick={() => selectSlide(index)} aria-label={`Chuyển đến cảnh ${index + 1}`} aria-current={index === activeIndex ? "step" : undefined}>
          <span className={`hero-story-progress block h-full bg-white ${index < activeIndex ? "is-complete" : index === activeIndex && !hasActiveVideo ? "is-running" : ""}`} style={index === activeIndex ? hasActiveVideo ? { width: `${progress}%` } : { animationDuration: `${imageStoryDuration}ms` } : index < activeIndex ? { width: "100%" } : { width: "0%"}} />
        </button>)}
      </div>
    ) : null}
  </section>;
}

export default function HomePage({ onWishlist, wishlist = [], catalogVersion }) {
  const latestCarouselRef = useRef(null);
  const bestCarouselRef = useRef(null);
  const sections = useMemo(() => getHomeSections(), [catalogVersion]);
  const hero = useMemo(() => getHomeHero(), [catalogVersion]);

  return <main className="min-h-screen bg-white text-black">
    <HomeHero hero={hero} />
    {sections.map((section, index) => {
      const hasProducts = Array.isArray(section?.products) && section.products.length > 0;
      return <section id={index === 0 ? "latest-arrivals" : undefined} key={section.id} className={`home-product-section px-[2.2vw] ${index === 0 ? "pt-8" : "mt-12 pt-0 md:mt-16"} pb-7 md:pb-10`}>
        <header className="mb-3 flex items-center justify-between gap-5 md:mb-4">
          <h2 className="text-[10px] font-medium uppercase tracking-[.015em] md:text-xs">{section.title}</h2>
          <a className="shrink-0 text-[9px] uppercase underline underline-offset-4" href="/store">{section.action}</a>
        </header>
        {hasProducts ? (
          section.display === "lookbook"
            ? <LookbookSection section={section} wishlist={wishlist} onWishlist={onWishlist} carouselRef={latestCarouselRef} />
            : <BestsellersSection section={section} wishlist={wishlist} onWishlist={onWishlist} carouselRef={bestCarouselRef} />
        ) : (
          <div className="grid min-h-44 place-items-center rounded-xl border border-black/10 bg-[#fafafa] p-8 text-center sm:min-h-56">
            <div className="flex flex-col items-center gap-2.5 text-black/50">
              <Icon name="bag" className="h-6 w-6" />
              <span className="text-xs uppercase tracking-[.1em]">Chưa có sản phẩm</span>
            </div>
          </div>
        )}
      </section>;
    })}
  </main>;
}
