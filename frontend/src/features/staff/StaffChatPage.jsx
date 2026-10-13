import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import InternalLayout from "../../shared/components/InternalLayout.jsx";
import Icon from "../../shared/components/Icon.jsx";
import {
  deleteStaffConversation,
  getStaffConversationMessages,
  getStaffConversations,
  sendStaffChatMessage,
  updateStaffConversation,
} from "../../shared/services/api.js";

const FILTER_TABS = [
  { id: "NEED_REPLY", label: "Chờ phản hồi" },
  { id: "OPEN", label: "Đang mở" },
  { id: "CLOSED", label: "Đã đóng" },
  { id: "ALL", label: "Tất cả" },
];

const formatChatTime = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
};

export function StaffChatPage({ user, onLogout }) {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("NEED_REPLY");
  const [search, setSearch] = useState("");
  const messagesRef = useRef(null);

  const refreshList = useCallback(async (isActive = () => true) => {
    const rows = await getStaffConversations();
    if (!isActive()) return rows;
    setConversations(rows);
    setSelectedId((current) => {
      const currentRow = rows.find((row) => row.id === current);
      if (currentRow) return current;
      const unread = rows.find((row) => row.status === "OPEN" && (row.unreadCount > 0 || (row.latestMessage && row.latestMessage.senderUserId === row.customer?.id)));
      return unread?.id || rows[0]?.id || "";
    });
    return rows;
  }, []);

  const refreshMessages = useCallback(async (isActive = () => true) => {
    if (!selectedId) {
      if (isActive()) {
        setConversation(null);
        setMessages([]);
      }
      return;
    }
    const result = await getStaffConversationMessages(selectedId);
    if (isActive()) {
      setConversation(result.conversation);
      setMessages(result.messages);
    }
  }, [selectedId]);

  useEffect(() => {
    let active = true;
    refreshList(() => active)
      .catch((reason) => { if (active) setError(reason.message); })
      .finally(() => { if (active) setLoading(false); });
    const timer = window.setInterval(() => {
      refreshList(() => active).catch((reason) => { if (active) setError(reason.message); });
    }, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [refreshList]);

  useEffect(() => {
    let active = true;
    if (!selectedId) {
      setConversation(null);
      setMessages([]);
      return () => { active = false; };
    }
    refreshMessages(() => active).catch((reason) => { if (active) setError(reason.message); });
    const timer = window.setInterval(() => {
      refreshMessages(() => active).catch((reason) => { if (active) setError(reason.message); });
    }, 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [selectedId, refreshMessages]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const send = async (event) => {
    event.preventDefault();
    const body = text.trim();
    if (!body || !selectedId || conversation?.status !== "OPEN") return;
    setBusy(true);
    setError("");
    try {
      await sendStaffChatMessage(selectedId, body);
      setText("");
      await refreshMessages();
      await refreshList();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async () => {
    if (!conversation) return;
    const nextStatus = conversation.status === "OPEN" ? "CLOSED" : "OPEN";
    try {
      const updated = await updateStaffConversation(conversation.id, nextStatus);
      setConversation((current) => ({ ...current, ...updated }));
      await refreshList();
    } catch (reason) {
      setError(reason.message);
    }
  };

  const handleDelete = async () => {
    if (!conversation) return;
    const targetName = conversation.customer?.fullName || conversation.customer?.email || "cuộc hội thoại này";
    if (!window.confirm(`Xóa vĩnh viễn hội thoại của ${targetName}? Lịch sử tin nhắn sẽ bị xóa.`)) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await deleteStaffConversation(conversation.id);
      setSelectedId("");
      setConversation(null);
      setMessages([]);
      await refreshList();
    } catch (reason) {
      setError(reason.message);
    } finally {
      setBusy(false);
    }
  };

  const filteredConversations = useMemo(() => {
    let list = [...conversations];

    if (activeTab === "NEED_REPLY") {
      list = list.filter((item) => {
        if (item.status !== "OPEN") return false;
        if (item.unreadCount > 0) return true;
        return item.latestMessage && item.latestMessage.senderUserId === item.customer?.id;
      });
    } else if (activeTab === "OPEN") {
      list = list.filter((item) => item.status === "OPEN");
    } else if (activeTab === "CLOSED") {
      list = list.filter((item) => item.status === "CLOSED");
    }

    const q = search.trim().toLocaleLowerCase("vi");
    if (q) {
      list = list.filter((item) => {
        const name = item.customer?.fullName || "";
        const email = item.customer?.email || "";
        const phone = item.customer?.phone || "";
        const msg = item.latestMessage?.body || "";
        return `${name} ${email} ${phone} ${msg}`.toLocaleLowerCase("vi").includes(q);
      });
    }

    return list;
  }, [conversations, activeTab, search]);

  const selected = conversations.find((item) => item.id === selectedId);

  return (
    <InternalLayout active="chat" isAdmin={user?.role === "ADMIN"} user={user} onLogout={onLogout}>
      <header className="internal-page-heading">
        <h1 className="font-display">Chăm sóc khách hàng</h1>
      </header>

      {error && <p className="staff-form-error" role="alert">{error}</p>}

      <section className="staff-chat-layout">
        <aside className="staff-chat-inbox">
          <div className="staff-chat-inbox-header">
            <h2>Hội thoại</h2>
          </div>

          <div className="staff-chat-tabs">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`staff-chat-tab ${activeTab === tab.id ? "is-active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="staff-chat-search-wrap">
            <Icon name="search" className="staff-chat-search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email, tin nhắn..."
            />
          </div>

          <div className="staff-chat-list">
            {loading ? (
              <p className="staff-chat-empty-list">Đang tải hội thoại</p>
            ) : filteredConversations.length ? (
              filteredConversations.map((item) => {
                const isCustomerMsg = item.latestMessage && item.latestMessage.senderUserId === item.customer?.id;
                const isWaiting = item.status === "OPEN" && (item.unreadCount > 0 || isCustomerMsg);

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`staff-chat-item ${selectedId === item.id ? "is-active" : ""}${item.unreadCount ? " has-unread" : ""}`}
                    onClick={() => {
                      setError("");
                      setSelectedId(item.id);
                    }}
                  >
                    <div className="staff-chat-item-header">
                      <strong>{item.customer?.fullName || item.customer?.email || "Khách hàng"}</strong>
                      <time>{formatChatTime(item.lastMessageAt || item.latestMessage?.createdAt)}</time>
                    </div>

                    <div className="staff-chat-item-body">
                      <span>
                        {item.latestMessage
                          ? isCustomerMsg
                            ? item.latestMessage.body
                            : `Bạn: ${item.latestMessage.body}`
                          : "Chưa có tin nhắn"}
                      </span>
                    </div>

                    <div className="staff-chat-item-footer">
                      {item.status === "OPEN" ? (
                        isWaiting ? (
                          <span className="staff-chat-badge is-waiting">Chờ phản hồi</span>
                        ) : (
                          <span className="staff-chat-badge is-open">Đang mở</span>
                        )
                      ) : (
                        <span className="staff-chat-badge is-closed">Đã đóng</span>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="staff-chat-empty-list">Không tìm thấy hội thoại phù hợp</p>
            )}
          </div>
        </aside>

        <div className="staff-chat-thread">
          {selected ? (
            <>
              <header className="staff-chat-thread-head">
                <div>
                  <h2>{selected.customer?.fullName || "Khách hàng"}</h2>
                  <span>{selected.customer?.email || ""} · {selected.customer?.phone || "Chưa có số điện thoại"}</span>
                </div>
                <div className="staff-chat-thread-actions">
                  <button type="button" className="staff-secondary-action" onClick={toggleStatus}>
                    {conversation?.status === "CLOSED" ? "Mở hội thoại" : "Đóng hội thoại"}
                  </button>
                  <button type="button" className="staff-secondary-action is-danger" disabled={busy} onClick={handleDelete}>
                    Xóa
                  </button>
                </div>
              </header>

              <div className="staff-chat-messages" ref={messagesRef}>
                {messages.map((message) => (
                  <article key={message.id} className={message.senderRole === "CUSTOMER" ? "from-customer" : "from-staff"}>
                    <span>{message.body}</span>
                    <time>{new Date(message.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</time>
                  </article>
                ))}
              </div>

              {conversation?.status === "CLOSED" ? (
                <div className="staff-chat-closed-banner">
                  <Icon name="check" className="h-4 w-4" />
                  <span>Hội thoại đã đóng. Bấm “Mở hội thoại” nếu muốn tiếp tục trao đổi.</span>
                </div>
              ) : (
                <form className="staff-chat-compose" onSubmit={send}>
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    maxLength={4000}
                    placeholder="Nhập tin nhắn phản hồi khách hàng"
                  />
                  <button
                    className="staff-primary-action"
                    disabled={busy || !text.trim()}
                  >
                    {busy ? "ĐANG GỬI…" : "GỬI TIN NHẮN"}
                  </button>
                </form>
              )}
            </>
          ) : (
            <div className="staff-chat-empty">
              {loading ? "Đang tải hội thoại" : "Chọn một hội thoại để xem tin nhắn"}
            </div>
          )}
        </div>
      </section>
    </InternalLayout>
  );
}
