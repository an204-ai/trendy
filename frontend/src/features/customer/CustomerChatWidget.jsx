import { useCallback, useEffect, useRef, useState } from "react";
import { getCustomerConversation, sendCustomerChatMessage } from "../../shared/services/api.js";

export default function CustomerChatWidget({ user }) {
  const [open, setOpen] = useState(false);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(null);

  const refresh = useCallback(async () => {
    const result = await getCustomerConversation();
    setConversation(result.conversation);
    setMessages(result.messages || []);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    const load = async () => {
      try {
        const result = await getCustomerConversation();
        if (active) { setConversation(result.conversation); setMessages(result.messages || []); setError(""); }
      } catch (reason) { if (active) setError(reason.message); }
    };
    load();
    const timer = window.setInterval(load, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [open]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    setBusy(true); setError("");
    try {
      await sendCustomerChatMessage(text.trim());
      setText("");
      await refresh();
    } catch (reason) { setError(reason.message); }
    finally { setBusy(false); }
  };

  if (!user || user.role !== "CUSTOMER") return null;
  return <div className="customer-chat-widget">
    {open && <section className="customer-chat-panel" aria-label="Trò chuyện với Trendy">
      <header><strong>Hỗ trợ khách hàng</strong><button type="button" onClick={() => setOpen(false)} aria-label="Đóng trò chuyện">Đóng</button></header>
      <div className="customer-chat-messages" ref={messagesRef}>
        {messages.length ? messages.map((message) => <article key={message.id} className={message.senderRole === "CUSTOMER" ? "from-customer" : "from-staff"}><p>{message.body}</p><time>{new Date(message.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</time></article>) : <p className="customer-chat-empty">Gửi tin nhắn để bắt đầu trò chuyện với nhân viên.</p>}
      </div>
      {error && <p className="customer-chat-error" role="alert">{error}</p>}
      <form onSubmit={send}><textarea value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} placeholder="Nhập tin nhắn" aria-label="Tin nhắn" /><button className="staff-primary-action" disabled={busy || !text.trim()}>{busy ? "ĐANG GỬI…" : "GỬI"}</button></form>
    </section>}
    <button className="customer-chat-launch" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>{open ? "Đóng hỗ trợ" : "Trò chuyện"}</button>
  </div>;
}
