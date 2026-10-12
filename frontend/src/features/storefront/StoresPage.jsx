import { useMemo, useState } from "react";
import Icon from "../../shared/components/Icon.jsx";
import { countryName, getStores, getStorefrontContent } from "../../shared/services/storefront.js";

const storeContent = getStorefrontContent().stores;
const stores = getStores();

export default function StoresPage() {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [locationMessage, setLocationMessage] = useState("");
  const countries = [...new Set(stores.map((store) => store.country))];
  const cities = [...new Set(stores.filter((store) => !country || store.country === country).map((store) => store.city))];
  const visible = useMemo(() => stores.filter((store) => (!country || store.country === country) && (!city || store.city === city)), [country, city]);
  const mapAddress = visible[0]?.address || stores[0]?.address;
  const mapUrl = mapAddress ? `https://maps.google.com/maps?q=${encodeURIComponent(mapAddress)}&output=embed` : "";

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

  return <main className="grid min-h-[calc(100svh-76px)] bg-[#f3f4f6] pt-[76px] lg:grid-cols-[.95fr_1.05fr]">
    <section className="relative min-h-[44svh] overflow-hidden bg-[#e5e7eb] lg:sticky lg:top-[76px] lg:h-[calc(100svh-76px)]" aria-label={storeContent.mapLabel}>
      {mapUrl && <iframe className="absolute inset-0 h-full w-full border-0 grayscale-[.12]" src={mapUrl} title={`${storeContent.mapLabel}: ${mapAddress}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/35 to-transparent" />
      {mapAddress && <a className="absolute bottom-4 left-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-[10px] shadow-sm backdrop-blur md:bottom-6 md:left-6" href={`https://maps.google.com/?q=${encodeURIComponent(mapAddress)}`} target="_blank" rel="noreferrer"><Icon name="pin" className="h-4 w-4" />{storeContent.openMap}</a>}
    </section>

    <section className="min-w-0 px-5 pb-10 pt-5 md:px-8 md:pt-7 lg:max-h-[calc(100svh-76px)] lg:overflow-y-auto lg:px-[4.2vw] lg:pb-12 lg:pt-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl md:text-4xl">{storeContent.title}</h1>
        <button className="inline-flex items-center gap-2 text-xs" type="button" aria-expanded={filtersOpen} onClick={() => setFiltersOpen((current) => !current)}>{storeContent.filtersLabel}<Icon name="filter" className="h-5 w-5" /></button>
      </div>

      {filtersOpen && <section className="grid gap-3 sm:grid-cols-2" aria-label={storeContent.filtersLabel}>
        <label className="flex h-[62px] flex-col justify-center rounded-[10px] bg-white px-4 shadow-sm"><span className="text-[10px] text-black">{storeContent.countryLabel}</span><select className="!min-h-0 !w-full !border-0 !bg-transparent !px-0 !py-0 text-sm text-black focus:!border-0" value={country} onChange={(event) => { setCountry(event.target.value); setCity(""); }}><option value="">{storeContent.selectCountry}</option>{countries.map((item) => <option key={item} value={item}>{countryName(item)}</option>)}</select></label>
        <label className="flex h-[62px] flex-col justify-center rounded-[10px] bg-white px-4 shadow-sm"><span className="text-[10px] text-black">{storeContent.cityLabel}</span><select className="!min-h-0 !w-full !border-0 !bg-transparent !px-0 !py-0 text-sm text-black focus:!border-0" value={city} onChange={(event) => setCity(event.target.value)}><option value="">{storeContent.selectCity}</option>{cities.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <div className="sm:col-span-2"><button className="inline-flex items-center gap-2 py-1 text-xs transition-opacity hover:opacity-55" type="button" onClick={useCurrentLocation}><Icon name="pin" className="h-4 w-4" />{storeContent.currentLocation}</button><p className="mt-1 min-h-4 text-[10px] text-black" role="status">{locationMessage}</p></div>
      </section>}

      <div className="mt-5 flex items-center justify-between border-b border-black/10 pb-3 text-[10px] uppercase tracking-[.09em] text-black"><span>{storeContent.resultLabel}</span></div>
      <div className="mt-4 divide-y divide-black/10">
        {visible.map((store) => <article key={store.name} className="py-5 md:py-6">
          <div className="flex items-start justify-between gap-5">
            <div className="min-w-0">
              <h2 className="text-[16px] font-medium leading-snug md:text-lg">{store.name}</h2>
              <p className="mt-2 text-xs leading-5 text-black">{store.address}</p>
              <p className="mt-2 text-xs text-black">{store.hours}</p>
            </div>
          </div>
          {store.image && <img className="mt-5 block aspect-[1.55/1] w-full rounded-[10px] bg-white object-cover object-[center_58%]" src={store.image} alt={store.name} loading="lazy" />}
          <a className="mt-4 inline-flex items-center gap-2 text-[10px] uppercase tracking-[.08em] underline underline-offset-4" href={`https://maps.google.com/?q=${encodeURIComponent(store.address)}`} target="_blank" rel="noreferrer">{storeContent.directions}</a>
        </article>)}
        {!visible.length && <p className="rounded-[10px] bg-white p-6 text-sm text-black">{storeContent.noStores}</p>}
      </div>
    </section>
  </main>;
}
