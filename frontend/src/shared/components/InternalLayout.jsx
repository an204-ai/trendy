const roleLabel = (role) => role === "ADMIN" ? "Quản trị viên" : "Nhân viên";

export default function InternalLayout({ active, isAdmin = false, user, onLogout, children }) {
  const links = [
    ...(isAdmin ? [{ key: "overview", label: "Tổng quan", href: "/admin" }] : []),
    { key: "products", label: "Sản phẩm", href: "/staff/products" },
    { key: "categories", label: "Danh mục", href: "/staff/categories" },
    { key: "promotions", label: "Khuyến mãi", href: "/staff/promotions" },
    { key: "orders", label: "Đơn hàng", href: "/staff/orders" },
    { key: "chat", label: "Chăm sóc khách hàng", href: "/staff/chat" },
    ...(isAdmin ? [{ key: "staff", label: "Nhân viên", href: "/admin/staff" }] : []),
  ];

  return <div className="internal-portal">
    <aside className="internal-sidebar">
      <a className="internal-brand font-display" href={isAdmin ? "/admin" : "/staff/orders"} aria-label="Trendy, khu vực nội bộ">TRENDY</a>
      <span className="internal-sidebar-title">{isAdmin ? "ADMIN" : "NHÂN VIÊN"}</span>
      <nav className="internal-nav" aria-label="Điều hướng nội bộ">
        {links.map((link) => <a key={link.key} href={link.href} aria-current={active === link.key ? "page" : undefined} className={active === link.key ? "is-active" : ""}>{link.label}</a>)}
      </nav>
      <div className="internal-user">
        <strong>{user?.fullName || user?.email || roleLabel(user?.role)}</strong>
        <span>{roleLabel(user?.role)}</span>
        <button className="internal-logout" onClick={onLogout}>Đăng xuất</button>
      </div>
    </aside>
    <div className="internal-main">
      <header className="internal-topbar"><span>KHU VỰC {isAdmin ? "ADMIN" : "NHÂN VIÊN"}</span><strong>{user?.fullName || roleLabel(user?.role)}</strong></header>
      <main className="internal-content">{children}</main>
    </div>
  </div>;
}
