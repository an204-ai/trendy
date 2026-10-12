const paths = {
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
  bag: <><path d="M4.5 8.5h15l-1 12h-13l-1-12Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
  user: <><circle cx="12" cy="8" r="3.2" /><path d="M5.2 20a6.8 6.8 0 0 1 13.6 0" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  heart: <path d="M20.5 8.9c0 4.4-8.5 10-8.5 10s-8.5-5.6-8.5-10a4.4 4.4 0 0 1 8.5-1.6 4.4 4.4 0 0 1 8.5 1.6Z" />,
  check: <path d="m5 13 4 4L19 7" />,
  filter: <><path d="M4 7h16M7 12h10m-7 5h4" /><path d="M18 4v6M8 9v6M15 14v6" /></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.4" /></>,
};

export default function Icon({ name, className = "h-5 w-5", filled = false }) {
  return <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
