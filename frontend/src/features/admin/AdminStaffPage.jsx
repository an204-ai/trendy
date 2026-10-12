import { useState } from "react";
import InternalLayout from "../../shared/components/InternalLayout.jsx";

export function AdminStaffPage({ user, onLogout, onCreateStaff }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setBusy(true); setError(""); setNotice("");
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      const user = await onCreateStaff(values);
      setNotice(`Đã tạo tài khoản nhân viên ${user.email}`);
      form.reset();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  return <InternalLayout active="staff" isAdmin user={user} onLogout={onLogout}><div className="staff-console-page">
    <header className="staff-console-heading"><h1 className="font-display">Nhân viên</h1></header>
    <section className="staff-create-section"><h2>Tạo tài khoản nhân viên</h2>
      <form className="staff-create-form" onSubmit={submit}>
        <label className="profile-field"><span>HỌ VÀ TÊN</span><input name="fullName" required minLength={2} maxLength={120} autoComplete="name" /></label>
        <label className="profile-field"><span>EMAIL</span><input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
        <label className="profile-field"><span>MẬT KHẨU</span><input name="password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" /></label>
        <label className="profile-field"><span>SỐ ĐIỆN THOẠI</span><input name="phone" type="tel" maxLength={32} autoComplete="tel" /></label>
        {error && <p className="staff-form-error" role="alert">{error}</p>}
        {notice && <p className="staff-form-notice" role="status">{notice}</p>}
        <button className="staff-primary-action staff-create-submit" disabled={busy}>{busy ? "ĐANG TẠO…" : "TẠO TÀI KHOẢN"}</button>
      </form>
    </section>
  </div></InternalLayout>;
}
