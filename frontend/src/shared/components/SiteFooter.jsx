import BrandMark from "./BrandMark.jsx";
import { getStorefrontContent } from "../services/storefront.js";

function SocialPlatformIcon({ platform }) {
  if (platform.includes("Instagram")) {
    return (
      <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.6" cy="6.7" r=".8" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (platform.includes("TikTok")) {
    return (
      <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 4v10.1a4.1 4.1 0 1 1-4-4.1" />
        <path d="M14 4c.6 2.5 2.4 4.1 5 4.5" />
      </svg>
    );
  }
  if (platform.includes("Shopee")) {
    return (
      <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8h12l-1 12H7L6 8Z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
        <path d="M13.5 11.5c-.5-.5-1.5-.7-2.1-.4-.6.3-.7 1.1-.2 1.6l1.6 1.4c.5.5.4 1.3-.2 1.6-.6.3-1.6.1-2.1-.4" />
      </svg>
    );
  }
  return (
    <svg className="h-[17px] w-[17px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="5.4" width="19" height="13.2" rx="4" />
      <path d="m10 9 5.3 3-5.3 3z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SiteFooter({ onSubscribe }) {
  const { footer } = getStorefrontContent();
  return (
    <footer className="bg-white px-5 pb-4 pt-7 text-black md:px-[4.2vw] md:pt-8">
      <div className="grid gap-6 border-b border-black/10 pb-6 sm:grid-cols-2 md:grid-cols-[1.3fr_.8fr_1fr] md:gap-[4vw]">
        <div>
          <a className="font-display text-xl tracking-[-.06em]" href="/" aria-label="Trendy - Trang chủ">
            <BrandMark />
          </a>
          <p className="mt-2 max-w-80 text-[11px] leading-5 text-black">{footer.about}</p>
          <div className="mt-4 flex items-center gap-3">
            {footer.socialLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href || "#"}
                target="_blank"
                rel="noreferrer"
                title={label}
                aria-label={label}
                className="grid h-8 w-8 place-items-center rounded-full border border-black/15 text-black transition-all hover:border-black hover:bg-black hover:text-white"
              >
                <SocialPlatformIcon platform={label} />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-start gap-2 text-[11px]">
          <p className="mb-1 text-[9px] uppercase tracking-[.12em] text-black">{footer.customerCare}</p>
          {footer.links.map(({ label, href, external }) => (
            <a
              key={`${label}-${href}`}
              href={href}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="transition-opacity hover:opacity-60"
            >
              {label}
            </a>
          ))}
        </div>

        <form onSubmit={(event) => { event.preventDefault(); onSubscribe(); event.currentTarget.reset(); }}>
          <p className="text-[9px] uppercase tracking-[.12em] text-black">{footer.newsletter}</p>
          <p className="mt-1.5 text-[11px] text-black">{footer.newsletterDescription}</p>
          <label className="mt-2 flex max-w-80 border-b border-black/35">
            <input className="h-8 min-h-0 flex-1 border-0 bg-transparent px-0 text-[11px] outline-none placeholder:text-neutral-400" type="email" placeholder="Địa chỉ email" required />
            <button className="px-2 text-[9px] uppercase tracking-[.08em]" aria-label="Đăng ký">Gửi</button>
          </label>
        </form>
      </div>

      <div className="flex flex-col gap-2 pt-3 text-[8px] uppercase tracking-[.08em] text-black md:flex-row md:items-center md:justify-between">
        <span>{footer.copyright}</span>
        <div className="flex flex-wrap gap-3">
          {footer.legalLinks.map(({ label, href }) => (
            <a key={label} href={href}>{label}</a>
          ))}
          <button onClick={onSubscribe}>{footer.locale}</button>
        </div>
      </div>
    </footer>
  );
}
