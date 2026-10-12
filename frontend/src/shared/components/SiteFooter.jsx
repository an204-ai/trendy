import BrandMark from "./BrandMark.jsx";
import { getStorefrontContent } from "../services/storefront.js";

function SocialPlatformIcon({ platform }) {
  if (platform === "Instagram") return <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.6" cy="6.7" r=".8" fill="currentColor" stroke="none" /></svg>;
  if (platform === "TikTok") return <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 4v10.1a4.1 4.1 0 1 1-4-4.1" /><path d="M14 4c.6 2.5 2.4 4.1 5 4.5" /></svg>;
  return <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2.5" y="5.4" width="19" height="13.2" rx="4" /><path d="m10 9 5.3 3-5.3 3z" fill="currentColor" stroke="none" /></svg>;
}

export default function SiteFooter({ onSubscribe }) {
  const { footer } = getStorefrontContent();
  return <footer className="bg-white px-5 pb-4 pt-7 text-black md:px-[4.2vw] md:pt-8">
    <div className="grid gap-6 border-b border-black/10 pb-6 sm:grid-cols-2 md:grid-cols-[1.3fr_.8fr_1fr] md:gap-[4vw]">
      <div><a className="font-display text-xl tracking-[-.06em]" href="/" aria-label="Trendy - Trang chủ"><BrandMark /></a><p className="mt-2 max-w-80 text-[11px] leading-5 text-black">{footer.about}</p><div className="mt-4 flex items-center gap-4 text-black" aria-hidden="true">{footer.socialLinks.map(({ label }) => <span key={label} className="grid h-7 w-7 place-items-center"><SocialPlatformIcon platform={label} /></span>)}</div></div>
      <div className="flex flex-col items-start gap-2 text-[11px]"><p className="mb-1 text-[9px] uppercase tracking-[.12em] text-black">{footer.customerCare}</p>{footer.links.map(({ label, href }) => <a key={`${label}-${href}`} href={href}>{label}</a>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); onSubscribe(); event.currentTarget.reset(); }}><p className="text-[9px] uppercase tracking-[.12em] text-black">{footer.newsletter}</p><p className="mt-1.5 text-[11px] text-black">{footer.newsletterDescription}</p><label className="mt-2 flex max-w-80 border-b border-black/35"><input className="h-8 min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-black" type="email" placeholder="Địa chỉ email" required /><button className="px-2 text-[9px] uppercase tracking-[.08em]" aria-label="Đăng ký">Gửi</button></label></form>
    </div>
    <div className="flex flex-col gap-2 pt-3 text-[8px] uppercase tracking-[.08em] text-black md:flex-row md:items-center md:justify-between"><span>{footer.copyright}</span><div className="flex flex-wrap gap-3">{footer.legalLinks.map(({ label, href }) => <a key={label} href={href}>{label}</a>)}<button onClick={onSubscribe}>{footer.locale}</button></div></div>
  </footer>;
}
