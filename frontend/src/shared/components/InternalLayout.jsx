import { useState } from "react";
import Icon from "./Icon.jsx";
import { changePassword } from "../services/api.js";

const roleLabel = (role) => role === "ADMIN" ? "Quản trị viên" : "Nhân viên";

export default function InternalLayout({ active, isAdmin = false, user, onLogout, children }) {
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const links = [
    ...(isAdmin ? [{ key: "overview", label: "Tổng quan", href: "/admin" }] : []),
    { key: "orders", label: "Đơn hàng", href: "/staff/orders" },
    { key: "products", label: "Sản phẩm", href: "/staff/products" },
    { key: "categories", label: "Danh mục", href: "/staff/categories" },
    { key: "promotions", label: "Khuyến mãi", href: "/staff/promotions" },
    { key: "customers", label: "Khách hàng", href: "/staff/customers" },
    { key: "chat", label: "Chăm sóc khách hàng", href: "/staff/chat" },
    ...(isAdmin ? [{ key: "staff", label: "Nhân viên", href: "/admin/staff" }] : []),
  ];

  return (
    <div className="internal-portal">
      {drawerOpen && (
        <div
          className="internal-sidebar-backdrop"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`internal-sidebar ${drawerOpen ? "is-open" : ""}`}>
        <div className="internal-sidebar-header">
          <a
            className="internal-brand font-display"
            href={isAdmin ? "/admin" : "/staff/orders"}
            aria-label="Trendy, khu vực nội bộ"
            onClick={() => setDrawerOpen(false)}
          >
            TRENDY
          </a>
          <button
            type="button"
            className="internal-sidebar-close"
            onClick={() => setDrawerOpen(false)}
            aria-label="Đóng menu"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        <span className="internal-sidebar-title">{isAdmin ? "Quản trị viên" : "Nhân viên"}</span>
        <nav className="internal-nav" aria-label="Điều hướng nội bộ">
          {links.map((link) => (
            <a
              key={link.key}
              href={link.href}
              aria-current={active === link.key ? "page" : undefined}
              className={active === link.key ? "is-active" : ""}
              onClick={() => setDrawerOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="internal-user">
          <strong>{user?.fullName || user?.email || roleLabel(user?.role)}</strong>
          <span className="internal-user-role">{roleLabel(user?.role)}</span>
          <div className="internal-user-actions">
            <button
              className="internal-user-action-btn"
              type="button"
              onClick={() => { setDrawerOpen(false); setShowPwdModal(true); }}
            >
              <Icon name="user" className="h-3.5 w-3.5" />
              <span>Đổi mật khẩu</span>
            </button>
            <button className="internal-logout" onClick={onLogout} title="Đăng xuất">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
      <div className="internal-main">
        <header className="internal-topbar">
          <div className="internal-topbar-left">
            <button
              type="button"
              className="internal-menu-toggle"
              onClick={() => setDrawerOpen(true)}
              aria-label="Mở menu chức năng"
              title="Danh mục chức năng"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>
            <span className="internal-topbar-tag">Khu vực {isAdmin ? "quản trị" : "nhân viên"}</span>
          </div>
          <strong className="internal-topbar-user">{user?.fullName || roleLabel(user?.role)}</strong>
        </header>
        <main className="internal-content">{children}</main>
      </div>
      {showPwdModal && <StaffChangePasswordModal onClose={() => setShowPwdModal(false)} />}
    </div>
  );
}

function StaffChangePasswordModal({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu mới không khớp");
      return;
    }
    if (currentPassword === newPassword) {
      setError("Mật khẩu mới không được trùng với mật khẩu hiện tại");
      return;
    }
    setBusy(true);
    try {
      await changePassword({ currentPassword, newPassword }, true);
      setSuccess("Đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message || "Không thể đổi mật khẩu");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="staff-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="staff-modal-content" style={{ maxWidth: "440px" }}>
        <div className="staff-modal-head">
          <h2>Đổi mật khẩu</h2>
          <button className="staff-modal-close" type="button" onClick={onClose} aria-label="Đóng">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        <form className="staff-modal-body" onSubmit={handleSubmit} noValidate>
          <div style={{ display: "grid", gap: "14px" }}>
            <label className="profile-field">
              <span>Mật khẩu hiện tại *</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </label>
            <label className="profile-field">
              <span>Mật khẩu mới *</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự"
              />
            </label>
            <label className="profile-field">
              <span>Xác nhận mật khẩu mới *</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </label>
          </div>
          {error && (
            <div role="alert" className="staff-form-error">
              <Icon name="alert" className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div role="status" className="staff-form-notice">
              <Icon name="check" className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
            <button className="staff-secondary-action" type="button" onClick={onClose} disabled={busy}>
              Đóng
            </button>
            <button className="staff-primary-action" type="submit" disabled={busy}>
              {busy ? "Đang cập nhật…" : "Cập nhật"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
