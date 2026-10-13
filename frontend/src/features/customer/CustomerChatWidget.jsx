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
      <form onSubmit={send}><input type="text" value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} placeholder="Nhập tin nhắn" aria-label="Tin nhắn" /><button className="staff-primary-action" disabled={busy || !text.trim()}>{busy ? "ĐANG GỬI…" : "GỬI"}</button></form>
    </section>}
    <button className="customer-chat-launch" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Đóng hỗ trợ" : "Trò chuyện hỗ trợ"} title={open ? "Đóng hỗ trợ" : "Trò chuyện hỗ trợ"}>
      {open ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      )}
    </button>
  </div>;
}
