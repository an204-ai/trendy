import { useEffect, useMemo, useState } from "react";
import Icon from "../../shared/components/Icon.jsx";
import { countryName, getStores, getStorefrontContent } from "../../shared/services/storefront.js";

const storeContent = getStorefrontContent().stores;
const stores = getStores();

export default function StoresPage() {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [locationMessage, setLocationMessage] = useState("");
  const [lightboxStore, setLightboxStore] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const countries = [...new Set(stores.map((store) => store.country))];
  const cities = [...new Set(stores.filter((store) => !country || store.country === country).map((store) => store.city))];
  const visible = useMemo(() => stores.filter((store) => (!country || store.country === country) && (!city || store.city === city)), [country, city]);
  const activeStore = visible[0] || stores[0];
  const mapAddress = activeStore?.address;
  const mapEmbedUrl = activeStore?.embedMapUrl || (mapAddress ? `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed` : "");
  const mapDirectUrl = activeStore?.mapUrl || (mapAddress ? `https://maps.google.com/?q=${encodeURIComponent(mapAddress)}` : "");

  const useCurrentLocation = () => {
    setLocationMessage("");
    if (!navigator.geolocation) {
      setLocationMessage(storeContent.locationUnsupported);
      return;
    }
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const nearest = stores.reduce((best, store) => {
        if (!store.coordinates) return best;
        const distance = Math.hypot(coords.latitude - store.coordinates[0], (coords.longitude - store.coordinates[1]) * Math.cos(coords.latitude * Math.PI / 180));
        return !best || distance < best.distance ? { store, distance } : best;
      }, null)?.store || (stores.length === 1 ? stores[0] : null);
      if (nearest) {
        setCountry(nearest.country);
        setCity(nearest.city);
      }
    }, () => setLocationMessage(storeContent.locationError), { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 });
  };

  const openGallery = (store, index = 0) => {
    setLightboxStore(store);
    setActivePhotoIndex(index);
  };

  const closeGallery = () => {
    setLightboxStore(null);
    setActivePhotoIndex(0);
  };

  const prevPhoto = () => {
    if (!lightboxStore?.gallery) return;
    setActivePhotoIndex((current) => (current > 0 ? current - 1 : lightboxStore.gallery.length - 1));
  };

  const nextPhoto = () => {
    if (!lightboxStore?.gallery) return;
    setActivePhotoIndex((current) => (current < lightboxStore.gallery.length - 1 ? current + 1 : 0));
  };

  useEffect(() => {
    if (!lightboxStore) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeGallery();
      else if (event.key === "ArrowLeft") prevPhoto();
      else if (event.key === "ArrowRight") nextPhoto();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxStore, activePhotoIndex]);

  return (
    <main className="grid min-h-[calc(100svh-76px)] bg-[#f3f4f6] pt-[76px] lg:grid-cols-[.95fr_1.05fr]">
      <section className="relative min-h-[44svh] overflow-hidden bg-[#e5e7eb] lg:sticky lg:top-[76px] lg:h-[calc(100svh-76px)]" aria-label={storeContent.mapLabel}>
        {mapEmbedUrl && (
          <iframe
            className="absolute inset-0 h-full w-full border-0 grayscale-[.12]"
            src={mapEmbedUrl}
            title={`${storeContent.mapLabel}: ${mapAddress}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/35 to-transparent" />
        {mapDirectUrl && (
          <a
            className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-[10px] shadow-sm backdrop-blur transition-transform hover:scale-105 md:bottom-6 md:left-6"
            href={mapDirectUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="pin" className="h-4 w-4" />
            {storeContent.openMap}
          </a>
        )}
      </section>

      <section className="min-w-0 px-5 pb-10 pt-5 md:px-8 md:pt-7 lg:max-h-[calc(100svh-76px)] lg:overflow-y-auto lg:px-[4.2vw] lg:pb-12 lg:pt-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="font-display text-3xl md:text-4xl">{storeContent.title}</h1>
          <button className="inline-flex items-center gap-2 text-xs" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((current) => !current)}>
            {storeContent.filtersLabel}
            <Icon name="filter" className="h-5 w-5" />
          </button>
        </div>

        {filtersOpen && (
          <section className="grid gap-3 sm:grid-cols-2" aria-label={storeContent.filtersLabel}>
            <label className="flex h-[62px] flex-col justify-center rounded-[10px] bg-white px-4 shadow-sm">
              <span className="text-[10px] text-black">{storeContent.countryLabel}</span>
              <select className="!min-h-0 !w-full !border-0 !bg-transparent !px-0 !py-0 text-sm text-black focus:!border-0" value={country} onChange={(event) => { setCountry(event.target.value); setCity(""); }}>
                <option value="">{storeContent.selectCountry}</option>
                {countries.map((item) => <option key={item} value={item}>{countryName(item)}</option>)}
              </select>
            </label>
            <label className="flex h-[62px] flex-col justify-center rounded-[10px] bg-white px-4 shadow-sm">
              <span className="text-[10px] text-black">{storeContent.cityLabel}</span>
              <select className="!min-h-0 !w-full !border-0 !bg-transparent !px-0 !py-0 text-sm text-black focus:!border-0" value={city} onChange={(event) => setCity(event.target.value)}>
                <option value="">{storeContent.selectCity}</option>
                {cities.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2">
              <button className="inline-flex items-center gap-2 py-1 text-xs transition-opacity hover:opacity-55" type="button" onClick={useCurrentLocation}>
                <Icon name="pin" className="h-4 w-4" />
                {storeContent.currentLocation}
              </button>
              <p className="mt-1 min-h-4 text-[10px] text-black" role="status">{locationMessage}</p>
            </div>
          </section>
        )}

        <div className="mt-5 flex items-center justify-between border-b border-black/10 pb-3 text-[10px] uppercase tracking-[.09em] text-black">
          <span>{storeContent.resultLabel}</span>
        </div>

        <div className="mt-4 divide-y divide-black/10">
          {visible.map((store) => {
            const galleryList = store.gallery || (store.image ? [store.image] : []);
            const detailCount = galleryList.length > 1 ? galleryList.length - 1 : 0;

            return (
              <article key={store.name} className="py-5 md:py-6">
                <div className="flex items-start justify-between gap-5">
                  <div className="min-w-0">
                    <h2 className="text-[16px] font-medium leading-snug md:text-lg">{store.name}</h2>
                    <p className="mt-2 text-xs leading-5 text-black">{store.address}</p>
                    <p className="mt-1 text-xs text-neutral-600">{store.hours}</p>
                    {store.phone && <p className="mt-1 text-xs text-neutral-600">Hotline: {store.phone}</p>}
                  </div>
                </div>

                {store.image && (
                  <div className="mt-5 flex flex-col gap-2">
                    {/* Ảnh chính to: ảnh cũ */}
                    <div
                      className="group relative aspect-[1.55/1] w-full cursor-pointer overflow-hidden rounded-xl bg-neutral-100 shadow-sm"
                      onClick={() => openGallery(store, 0)}
                    >
                      <img
                        className="h-full w-full object-cover object-center"
                        src={store.image}
                        alt={store.name}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                    </div>

                    {/* Các ảnh chi tiết bên dưới với ảnh cuối hiển thị +X */}
                    {galleryList.length > 1 && (
                      <div className="grid grid-cols-3 gap-2">
                        {galleryList[1] && (
                          <div
                            className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg bg-neutral-100 shadow-sm"
                            onClick={() => openGallery(store, 1)}
                          >
                            <img
                              src={galleryList[1].url || galleryList[1]}
                              alt={galleryList[1].title || ""}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                          </div>
                        )}

                        {galleryList[2] && (
                          <div
                            className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg bg-neutral-100 shadow-sm"
                            onClick={() => openGallery(store, 2)}
                          >
                            <img
                              src={galleryList[2].url || galleryList[2]}
                              alt={galleryList[2].title || ""}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                          </div>
                        )}

                        {galleryList[3] && (
                          <div
                            className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-lg bg-neutral-100 shadow-sm"
                            onClick={() => openGallery(store, 3)}
                          >
                            <img
                              src={galleryList[3].url || galleryList[3]}
                              alt={galleryList[3].title || ""}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            {galleryList.length > 3 && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/55 font-display text-2xl font-bold tracking-tight text-white backdrop-blur-[1px] transition-colors group-hover:bg-black/70 md:text-3xl">
                                +{galleryList.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <a
                  className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.08em] underline underline-offset-4 transition-opacity hover:opacity-60"
                  href={store.mapUrl || (store.address ? `https://maps.google.com/?q=${encodeURIComponent(store.address)}` : "#")}
                  target="_blank"
                  rel="noreferrer"
                >
                  {storeContent.directions}
                </a>
              </article>
            );
          })}
          {!visible.length && <p className="rounded-[10px] bg-white p-6 text-sm text-black">{storeContent.noStores}</p>}
        </div>
      </section>

      {lightboxStore && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white backdrop-blur-md animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Thư viện ảnh cửa hàng"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeGallery();
          }}
        >
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-5 md:px-8">
            <span className="truncate text-sm font-medium">{lightboxStore.name}</span>
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              onClick={closeGallery}
              aria-label="Đóng thư viện ảnh"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </header>

          <div className="relative flex flex-1 items-center justify-center px-4 py-2">
            {lightboxStore.gallery?.length > 1 && (
              <button
                type="button"
                className="absolute left-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-black/50 text-2xl text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
                onClick={prevPhoto}
                aria-label="Ảnh trước"
              >
                ‹
              </button>
            )}

            <div className="relative flex max-h-[70vh] max-w-5xl items-center justify-center overflow-hidden rounded-xl">
              <img
                src={lightboxStore.gallery[activePhotoIndex]?.url || lightboxStore.gallery[activePhotoIndex]}
                alt={lightboxStore.gallery[activePhotoIndex]?.title || lightboxStore.name}
                className="max-h-[70vh] w-auto max-w-full object-contain"
              />
            </div>

            {lightboxStore.gallery?.length > 1 && (
              <button
                type="button"
                className="absolute right-4 z-10 grid h-12 w-12 place-items-center rounded-full bg-black/50 text-2xl text-white backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
                onClick={nextPhoto}
                aria-label="Ảnh tiếp theo"
              >
                ›
              </button>
            )}
          </div>

          {lightboxStore.gallery?.length > 1 && (
            <footer className="flex h-24 shrink-0 items-center justify-center gap-3 overflow-x-auto border-t border-white/10 px-4 py-3">
              {lightboxStore.gallery.map((item, idx) => {
                const url = item?.url || item;
                const isSelected = idx === activePhotoIndex;
                return (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg transition-all ${
                      isSelected ? "scale-105 ring-2 ring-white" : "opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </footer>
          )}
        </div>
      )}
    </main>
  );
}
