export default function BrandMark({ className = "", textClassName = "" }) {
  return <span className={`inline-flex items-center ${className}`}>
    <span className={`font-display font-medium tracking-[-.065em] ${textClassName}`}>TRENDY</span>
  </span>;
}
