import { useCallback, useEffect, useRef, useState } from "react";
import InternalLayout from "../../shared/components/InternalLayout.jsx";
import { getStaffConversationMessages, getStaffConversations, sendStaffChatMessage, updateStaffConversation } from "../../shared/services/api.js";

export function StaffChatPage({ user, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);

  const refreshList = useCallback(async (isActive = () => true) => {
    const rows = await getStaffConversations();
    if (!isActive()) return rows;
    setConversations(rows);
    setSelectedId((current) => {
      const unread = rows.find((row) => row.status === "OPEN" && row.unreadCount > 0);
      const currentRow = rows.find((row) => row.id === current);
      if (unread && (!currentRow || !currentRow.unreadCount)) return unread.id;
      return currentRow ? current : unread?.id || rows[0]?.id || "";
    });
    return rows;
  }, []);
  const refreshMessages = useCallback(async (isActive = () => true) => {
    if (!selectedId) { if (isActive()) { setConversation(null); setMessages([]); } return; }
    const result = await getStaffConversationMessages(selectedId);
    if (isActive()) { setConversation(result.conversation); setMessages(result.messages); }
  }, [selectedId]);

  useEffect(() => {
    let active = true;
    refreshList(() => active).catch((reason) => { if (active) setError(reason.message); }).finally(() => { if (active) setLoading(false); });
    const timer = window.setInterval(() => { refreshList(() => active).catch((reason) => { if (active) setError(reason.message); }); }, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [refreshList]);
  useEffect(() => {
    let active = true;
    if (!selectedId) { setConversation(null); setMessages([]); return () => { active = false; }; }
    refreshMessages(() => active).catch((reason) => { if (active) setError(reason.message); });
    const timer = window.setInterval(() => { refreshMessages(() => active).catch((reason) => { if (active) setError(reason.message); }); }, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [selectedId, refreshMessages]);
  useEffect(() => { if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight; }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || !selectedId || conversation?.status !== "OPEN") return;
    setBusy(true); setError("");
    try { await sendStaffChatMessage(selectedId, body); setText(""); await refreshMessages(); await refreshList(); }
    catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };
  const toggleStatus = async () => {
    if (!conversation) return;
    try { const updated = await updateStaffConversation(conversation.id, conversation.status === "OPEN" ? "CLOSED" : "OPEN"); setConversation((current) => ({ ...current, ...updated })); await refreshList(); }
    catch (reason) { setError(reason.message); }
  };
  const selected = conversations.find((item) => item.id === selectedId);

  return <InternalLayout active="chat" isAdmin={user?.role === "ADMIN"} user={user} onLogout={onLogout}>
    <header className="internal-page-heading staff-chat-page-heading"><h1 className="font-display">Chăm sóc khách hàng</h1><button className="staff-secondary-action" onClick={() => { setLoading(true); setError(""); refreshList().catch((reason) => setError(reason.message)).finally(() => setLoading(false)); }}>Làm mới</button></header>
    {error && <p className="staff-form-error" role="alert">{error}</p>}
    <section className="staff-chat-layout">
      <aside className="staff-chat-inbox"><h2>Hội thoại</h2>{loading ? <p>Đang tải</p> : conversations.length ? conversations.map((item) => <button key={item.id} className={`${selectedId === item.id ? "is-active" : ""}${item.unreadCount ? " has-unread" : ""}`} onClick={() => { setError(""); setSelectedId(item.id); }}><strong>{item.customer?.fullName || item.customer?.email || "Khách hàng"}</strong><span>{item.latestMessage?.body || "Chưa có tin nhắn"}</span><small>{item.status === "OPEN" ? "Đang mở" : "Đã đóng"}{item.unreadCount ? " · Tin mới" : ""}</small></button>) : <p>Chưa có hội thoại</p>}</aside>
      <div className="staff-chat-thread">
        {selected ? <>
          <header className="staff-chat-thread-head"><div><h2>{selected.customer?.fullName || "Khách hàng"}</h2><span>{selected.customer?.email || ""} · {selected.customer?.phone || "Chưa có số điện thoại"}</span></div><button className="staff-secondary-action" onClick={toggleStatus}>{conversation?.status === "CLOSED" ? "Mở hội thoại" : "Đóng hội thoại"}</button></header>
          <div className="staff-chat-messages" ref={messagesRef}>{messages.map((message) => <article key={message.id} className={message.senderRole === "CUSTOMER" ? "from-customer" : "from-staff"}><span>{message.body}</span><time>{new Date(message.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</time></article>)}</div>
          <form className="staff-chat-compose" onSubmit={send}><textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} placeholder="Nhập tin nhắn" disabled={conversation?.status !== "OPEN"} /><button className="staff-primary-action" disabled={busy || !text.trim() || conversation?.status !== "OPEN"}>{busy ? "ĐANG GỬI…" : "GỬI TIN NHẮN"}</button></form>
        </> : <div className="staff-chat-empty">{loading ? "Đang tải hội thoại" : "Chọn một hội thoại để xem tin nhắn"}</div>}
      </div>
    </section>
  </InternalLayout>;
}
