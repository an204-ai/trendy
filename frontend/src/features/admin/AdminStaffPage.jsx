import { useEffect, useState } from "react";
import InternalLayout from "../../shared/components/InternalLayout.jsx";
import Icon from "../../shared/components/Icon.jsx";
import {
  createStaffUser,
  deleteStaffUser,
  getStaffUsers,
  updateStaffUser,
} from "../../shared/services/api.js";

const validateField = (name, value, isEdit = false) => {
  const v = String(value ?? "").trim();
  switch (name) {
    case "fullName":
      if (!v) return "Vui lòng nhập họ và tên";
      if (v.length < 2) return "Họ và tên cần có ít nhất 2 ký tự";
      if (v.length > 120) return "Họ và tên tối đa 120 ký tự";
      return "";
    case "email":
      if (!v) return "Vui lòng nhập email hoặc tên đăng nhập";
      if (v.length < 3) return "Tên đăng nhập cần có ít nhất 3 ký tự";
      if (v.length > 254) return "Email tối đa 254 ký tự";
      if (v.includes("@")) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(v)) return "Định dạng email chưa đúng (ví dụ: nhanvien@trendyeye.com)";
      }
      return "";
    case "phone":
      if (!v) return "";
      const phoneDigits = v.replace(/[\s.-]/g, "");
      const phoneRegex = /^(0|\+84)[35789][0-9]{8}$/;
      if (!phoneRegex.test(phoneDigits)) {
        return "Số điện thoại không đúng định dạng (cần 10 chữ số, ví dụ: 0901234567)";
      }
      return "";
    case "password":
      if (!value) {
        return isEdit ? "" : "Vui lòng nhập mật khẩu";
      }
      if (String(value).length < 8) return "Mật khẩu cần có ít nhất 8 ký tự";
      if (String(value).length > 128) return "Mật khẩu tối đa 128 ký tự";
      return "";
    default:
      return "";
  }
};

export function AdminStaffPage({ user, onLogout }) {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalMode, setModalMode] = useState(null); // "create" | "edit" | null
  const [editingMember, setEditingMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const initialFormState = {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    role: "STAFF",
    active: true,
  };
  const [formData, setFormData] = useState(initialFormState);
  const [fieldErrors, setFieldErrors] = useState({});

  const refresh = async () => {
    try {
      const response = await getStaffUsers();
      setStaffList(response.users || []);
    } catch (reason) {
      setError(reason.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const openCreateModal = () => {
    setEditingMember(null);
    setFormData(initialFormState);
    setFieldErrors({});
    setError("");
    setNotice("");
    setModalMode("create");
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      fullName: member.fullName || "",
      email: member.email || "",
      phone: member.phone || "",
      password: "",
      role: member.role || "STAFF",
      active: member.active !== false,
    });
    setFieldErrors({});
    setError("");
    setNotice("");
    setModalMode("edit");
  };

  const closeModal = () => {
    if (busy) return;
    setModalMode(null);
    setEditingMember(null);
    setError("");
  };

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    const isEdit = modalMode === "edit";
    const err = validateField(name, value, isEdit);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
    if (error) setError("");
  };

  const handleFieldBlur = (name) => {
    const isEdit = modalMode === "edit";
    const err = validateField(name, formData[name], isEdit);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const validateAll = (isEdit) => {
    const errors = {
      fullName: validateField("fullName", formData.fullName, isEdit),
      email: validateField("email", formData.email, isEdit),
      phone: validateField("phone", formData.phone, isEdit),
      password: validateField("password", formData.password, isEdit),
    };
    const invalid = Object.fromEntries(Object.entries(errors).filter(([_, msg]) => Boolean(msg)));
    return invalid;
  };

  const submitCreate = async (event) => {
    event.preventDefault();
    const errors = validateAll(false);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Vui lòng kiểm tra lại các trường thông tin có cảnh báo định dạng bên dưới");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role,
    };
    if (formData.phone && formData.phone.trim()) {
      payload.phone = formData.phone.trim();
    }

    try {
      const result = await createStaffUser(payload);
      setNotice(`Đã tạo tài khoản ${result.user?.fullName || payload.fullName}`);
      setModalMode(null);
      await refresh();
    } catch (reason) {
      setError(reason.message);
      if (reason.message?.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({ ...prev, email: reason.message }));
      }
    } finally {
      setBusy(false);
    }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    if (!editingMember) return;

    const errors = validateAll(true);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Vui lòng kiểm tra lại các trường thông tin có cảnh báo định dạng bên dưới");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    const payload = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      role: formData.role,
      active: formData.active,
    };
    if (formData.phone !== undefined) {
      payload.phone = formData.phone.trim() || undefined;
    }
    if (formData.password && formData.password.trim()) {
      payload.password = formData.password.trim();
    }

    try {
      await updateStaffUser(editingMember.id, payload);
      setNotice(`Đã cập nhật thông tin tài khoản ${payload.fullName}`);
      setModalMode(null);
      setEditingMember(null);
      await refresh();
    } catch (reason) {
      setError(reason.message);
      if (reason.message?.toLowerCase().includes("email")) {
        setFieldErrors((prev) => ({ ...prev, email: reason.message }));
      }
    } finally {
      setBusy(false);
    }
  };

  const removeStaff = async (member) => {
    if (!window.confirm(`Xác nhận xóa tài khoản ${member.fullName} (${member.email})?`)) {
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await deleteStaffUser(member.id);
      if (editingMember?.id === member.id) {
        setModalMode(null);
        setEditingMember(null);
      }
      setNotice(result?.message || `Đã xóa tài khoản ${member.fullName}`);
      await refresh();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const query = searchQuery.trim().toLowerCase();
  const filteredStaff = staffList.filter((member) => {
    if (!query) return true;
    return (
      member.fullName?.toLowerCase().includes(query) ||
      member.email?.toLowerCase().includes(query) ||
      member.phone?.toLowerCase().includes(query)
    );
  });

  return (
    <InternalLayout active="staff" isAdmin user={user} onLogout={onLogout}>
      <div className="staff-console-page">
        <header
          className="staff-console-heading"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <h1 className="font-display">Nhân viên</h1>
          <button type="button" className="staff-primary-action" onClick={openCreateModal}>
            Thêm nhân viên
          </button>
        </header>

        {error && !modalMode && (
          <div className="staff-form-error" role="alert">
            <Icon name="alert" className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {notice && !modalMode && (
          <div className="staff-form-notice" role="status">
            <Icon name="check" className="h-5 w-5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        <div className="staff-management-toolbar" style={{ margin: "20px 0 16px" }}>
          <input
            type="search"
            placeholder="Tìm kiếm nhân viên theo họ tên, email, số điện thoại…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        {loading ? (
          <p style={{ padding: "24px 0", color: "#666" }}>Đang tải danh sách nhân viên…</p>
        ) : filteredStaff.length === 0 ? (
          <p style={{ padding: "24px 0", color: "#666" }}>Không tìm thấy nhân viên phù hợp.</p>
        ) : (
          <div className="staff-table-scroll">
            <table className="staff-data-table">
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Email / tài khoản</th>
                  <th>Số điện thoại</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: "right", paddingRight: "20px" }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="staff-data-row">
                    <td>
                      <strong style={{ fontSize: "14px", fontWeight: 600, color: "#111" }}>
                        {member.fullName}
                      </strong>
                    </td>
                    <td>
                      <span style={{ color: "#333", fontSize: "13px" }}>{member.email}</span>
                    </td>
                    <td>
                      <span style={{ color: "#555", fontSize: "13px" }}>
                        {member.phone || "Chưa thiết lập"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          fontSize: "11px",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          background: member.role === "ADMIN" ? "#111" : "#e5e5e0",
                          color: member.role === "ADMIN" ? "#fff" : "#222",
                          fontWeight: 600,
                          letterSpacing: ".04em",
                        }}
                      >
                        {member.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={member.active ? "staff-status-active" : "staff-status-inactive"}
                        style={{
                          fontSize: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: member.active ? "#15803d" : "#9ca3af",
                            display: "inline-block",
                          }}
                        />
                        {member.active ? "Đang hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td>
                      <div
                        className="staff-table-actions"
                        style={{ justifyContent: "flex-end", gap: "12px" }}
                      >
                        <button
                          type="button"
                          className="staff-secondary-action"
                          onClick={() => openEditModal(member)}
                        >
                          Chỉnh sửa
                        </button>
                        {member.id !== user?.id && (
                          <button
                            type="button"
                            className="staff-secondary-action is-danger"
                            onClick={() => removeStaff(member)}
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Thêm nhân viên */}
        {modalMode === "create" && (
          <div className="staff-modal-backdrop" onClick={closeModal}>
            <div className="staff-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="staff-modal-head">
                <h2>Thêm tài khoản</h2>
                <button
                  type="button"
                  className="staff-modal-close"
                  onClick={closeModal}
                  aria-label="Đóng"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>
              <div className="staff-modal-body">
                {error && (
                  <div className="staff-form-error" role="alert">
                    <Icon name="alert" className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <form className="staff-management-form" onSubmit={submitCreate} noValidate>
                  <div className="profile-field staff-management-wide">
                    <span>Vai trò tài khoản</span>
                    <div className="staff-role-selector">
                      <button
                        type="button"
                        className={`staff-role-btn ${formData.role === "STAFF" ? "is-active" : ""}`}
                        onClick={() => handleFieldChange("role", "STAFF")}
                      >
                        <strong>Nhân viên</strong>
                      </button>
                      <button
                        type="button"
                        className={`staff-role-btn ${formData.role === "ADMIN" ? "is-active" : ""}`}
                        onClick={() => handleFieldChange("role", "ADMIN")}
                      >
                        <strong>Quản trị viên</strong>
                      </button>
                    </div>
                  </div>

                  <label className={`profile-field staff-management-wide ${fieldErrors.fullName ? "has-error" : ""}`}>
                    <span>Họ và tên</span>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      onBlur={() => handleFieldBlur("fullName")}
                      placeholder="Nguyễn Văn A"
                      className={fieldErrors.fullName ? "is-invalid" : ""}
                    />
                    {fieldErrors.fullName && (
                      <span className="profile-field-error">
                        <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.fullName}
                      </span>
                    )}
                  </label>

                  <label className={`profile-field ${fieldErrors.email ? "has-error" : ""}`}>
                    <span>Email / tài khoản</span>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={() => handleFieldBlur("email")}
                      placeholder="nhanvien@trendyeye.com"
                      className={fieldErrors.email ? "is-invalid" : ""}
                    />
                    {fieldErrors.email && (
                      <span className="profile-field-error">
                        <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.email}
                      </span>
                    )}
                  </label>

                  <label className={`profile-field ${fieldErrors.phone ? "has-error" : ""}`}>
                    <span>Số điện thoại</span>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      onBlur={() => handleFieldBlur("phone")}
                      placeholder="0901234567"
                      className={fieldErrors.phone ? "is-invalid" : ""}
                    />
                    {fieldErrors.phone && (
                      <span className="profile-field-error">
                        <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.phone}
                      </span>
                    )}
                  </label>

                  <label className={`profile-field staff-management-wide ${fieldErrors.password ? "has-error" : ""}`}>
                    <span>Mật khẩu</span>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      onBlur={() => handleFieldBlur("password")}
                      placeholder="Tối thiểu 8 ký tự"
                      autoComplete="new-password"
                      className={fieldErrors.password ? "is-invalid" : ""}
                    />
                    {fieldErrors.password && (
                      <span className="profile-field-error">
                        <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.password}
                      </span>
                    )}
                  </label>

                  <div
                    className="staff-management-form-actions staff-management-wide"
                    style={{ marginTop: "14px" }}
                  >
                    <button className="staff-primary-action" disabled={busy}>
                      {busy ? "Đang tạo…" : "Tạo tài khoản"}
                    </button>
                    <button
                      type="button"
                      className="staff-secondary-action"
                      onClick={closeModal}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal Chỉnh sửa nhân viên */}
        {modalMode === "edit" && editingMember && (
          <div className="staff-modal-backdrop" onClick={closeModal}>
            <div className="staff-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="staff-modal-head">
                <h2>Chỉnh sửa tài khoản</h2>
                <button
                  type="button"
                  className="staff-modal-close"
                  onClick={closeModal}
                  aria-label="Đóng"
                >
                  <Icon name="close" className="h-4 w-4" />
                </button>
              </div>
              <div className="staff-modal-body">
                {error && (
                  <div className="staff-form-error" role="alert">
                    <Icon name="alert" className="h-5 w-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <form className="staff-management-form" onSubmit={submitEdit} noValidate>
                  <div className="profile-field staff-management-wide">
                    <span>Vai trò tài khoản</span>
                    <div className="staff-role-selector">
                      <button
                        type="button"
                        className={`staff-role-btn ${formData.role === "STAFF" ? "is-active" : ""}`}
                        onClick={() => handleFieldChange("role", "STAFF")}
                        disabled={editingMember.id === user?.id}
                      >
                        <strong>Nhân viên</strong>
                      </button>
                      <button
                        type="button"
                        className={`staff-role-btn ${formData.role === "ADMIN" ? "is-active" : ""}`}
                        onClick={() => handleFieldChange("role", "ADMIN")}
                        disabled={editingMember.id === user?.id}
                      >
                        <strong>Quản trị viên</strong>
                      </button>
                    </div>
                  </div>

                  <label className={`profile-field staff-management-wide ${fieldErrors.fullName ? "has-error" : ""}`}>
                    <span>Họ và tên</span>
                    <input
                      name="fullName"
                      value={formData.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      onBlur={() => handleFieldBlur("fullName")}
                      placeholder="Nguyễn Văn A"
                      className={fieldErrors.fullName ? "is-invalid" : ""}
                    />
                    {fieldErrors.fullName && (
                      <span className="profile-field-error">
                        <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.fullName}
                      </span>
                    )}
                  </label>

                  <label className={`profile-field ${fieldErrors.email ? "has-error" : ""}`}>
                    <span>Email / tài khoản</span>
                    <input
                      name="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e.target.value)}
                      onBlur={() => handleFieldBlur("email")}
                      placeholder="nhanvien@trendyeye.com"
                      className={fieldErrors.email ? "is-invalid" : ""}
                    />
                    {fieldErrors.email && (
                      <span className="profile-field-error">
                        <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.email}
                      </span>
                    )}
                  </label>

                  <label className={`profile-field ${fieldErrors.phone ? "has-error" : ""}`}>
                    <span>Số điện thoại</span>
                    <input
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange("phone", e.target.value)}
                      onBlur={() => handleFieldBlur("phone")}
                      placeholder="Chưa có số điện thoại"
                      className={fieldErrors.phone ? "is-invalid" : ""}
                    />
                    {fieldErrors.phone && (
                      <span className="profile-field-error">
                        <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.phone}
                      </span>
                    )}
                  </label>

                  <label className={`profile-field staff-management-wide ${fieldErrors.password ? "has-error" : ""}`}>
                    <span>Đổi mật khẩu (nếu cần)</span>
                    <input
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleFieldChange("password", e.target.value)}
                      onBlur={() => handleFieldBlur("password")}
                      placeholder="Để trống nếu giữ nguyên mật khẩu"
                      autoComplete="new-password"
                      className={fieldErrors.password ? "is-invalid" : ""}
                    />
                    {fieldErrors.password && (
                      <span className="profile-field-error">
                        <Icon name="alert" className="h-3.5 w-3.5 shrink-0" />
                        {fieldErrors.password}
                      </span>
                    )}
                  </label>

                  <label className="staff-promotion-active staff-management-wide">
                    <input
                      name="active"
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                      disabled={editingMember.id === user?.id}
                    />
                    Đang hoạt động {editingMember.id === user?.id ? "(Tài khoản hiện tại của bạn)" : ""}
                  </label>

                  <div
                    className="staff-management-form-actions staff-management-wide"
                    style={{ marginTop: "14px" }}
                  >
                    <button className="staff-primary-action" disabled={busy}>
                      {busy ? "Đang lưu…" : "Lưu thay đổi"}
                    </button>
                    <button
                      type="button"
                      className="staff-secondary-action"
                      onClick={closeModal}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </InternalLayout>
  );
}
