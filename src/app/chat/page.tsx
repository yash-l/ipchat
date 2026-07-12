"use client";

import { useEffect, useState, useCallback } from "react";

interface Participant {
  user: { id: string; username: string; displayName: string; avatarUrl: string | null };
}
interface ConversationSummary {
  id: string;
  isGroup: boolean;
  title: string | null;
  participants: Participant[];
  messages: { content: string | null; type: string; createdAt: string }[];
}
interface Message {
  id: string;
  senderId: string;
  type: "TEXT" | "PHOTO";
  content: string | null;
  mediaUrl: string | null;
  viewOnce: boolean;
  viewedAt: string | null;
  createdAt: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [openPhoto, setOpenPhoto] = useState<{ messageId: string; url: string } | null>(null);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setMyUserId(d.userId ?? null))
      .catch(() => {});
  }, []);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/conversations");
    const data = await res.json();
    setConversations(data.conversations ?? []);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    const data = await res.json();
    setMessages(data.messages ?? []);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (activeId) loadMessages(activeId);
  }, [activeId, loadMessages]);

  async function startConversation(e: React.FormEvent) {
    e.preventDefault();
    if (!newChatUsername) return;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newChatUsername })
    });
    const data = await res.json();
    if (res.ok) {
      setNewChatUsername("");
      await loadConversations();
      setActiveId(data.conversation.id);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !draft.trim()) return;
    await fetch(`/api/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TEXT", content: draft })
    });
    setDraft("");
    loadMessages(activeId);
  }

  async function openViewOnce(message: Message) {
    if (!activeId) return;
    const res = await fetch(`/api/conversations/${activeId}/messages/${message.id}/view`, {
      method: "POST"
    });
    const data = await res.json();
    if (res.ok && data.mediaUrl) {
      setOpenPhoto({ messageId: message.id, url: data.mediaUrl });
      setTimeout(() => {
        setOpenPhoto(null);
        loadMessages(activeId);
      }, 5000);
    }
  }

  const active = conversations.find((c) => c.id === activeId);
  const activeOther = active?.participants.find((p) => p.user.id !== myUserId)?.user;

  return (
    <div className="chat-shell">
      <aside className="chat-list">
        <div className="chat-list-header">
          <span className="chat-list-title">Chats</span>
        </div>
        <form onSubmit={startConversation} style={{ padding: "12px 16px", display: "flex", gap: 8 }}>
          <input
            className="input"
            placeholder="Start chat with username"
            value={newChatUsername}
            onChange={(e) => setNewChatUsername(e.target.value)}
          />
          <button className="btn btn-accent" style={{ padding: "10px 14px" }}>
            +
          </button>
        </form>
        <div className="chat-list-items">
          {conversations.map((c) => {
            const other = c.participants.find((p) => p.user.id !== myUserId)?.user;
            const last = c.messages[0];
            return (
              <div
                key={c.id}
                className={`chat-list-item ${c.id === activeId ? "active" : ""}`}
                onClick={() => setActiveId(c.id)}
              >
                <div className="avatar">{(other?.displayName ?? "?")[0].toUpperCase()}</div>
                <div className="chat-list-meta">
                  <div className="chat-list-name">{other?.displayName ?? "Conversation"}</div>
                  <div className="chat-list-preview">
                    {last ? (last.type === "PHOTO" ? "📷 Photo" : last.content) : "No messages yet"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <section className="thread">
        {active ? (
          <>
            <div className="thread-header">
              <div className="avatar">{(activeOther?.displayName ?? "?")[0].toUpperCase()}</div>
              <strong>{activeOther?.displayName}</strong>
            </div>
            <div className="thread-messages">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  mine={m.senderId === myUserId}
                  onOpenViewOnce={() => openViewOnce(m)}
                />
              ))}
            </div>
            <form className="thread-composer" onSubmit={sendMessage}>
              <input
                className="input"
                placeholder="Message"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="btn btn-accent">Send</button>
            </form>
          </>
        ) : (
          <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--text-dim)" }}>
            Select a chat to get started
          </div>
        )}
      </section>

      {openPhoto && (
        <div className="viewonce-overlay" onClick={() => setOpenPhoto(null)}>
          <div className="viewonce-ring">
            <img src={openPhoto.url} alt="One-time photo" />
            <span className="viewonce-countdown">disappearing…</span>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  onOpenViewOnce
}: {
  message: Message;
  mine: boolean;
  onOpenViewOnce: () => void;
}) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (message.type === "PHOTO") {
    return (
      <div className={`bubble-row ${mine ? "mine" : ""}`}>
        {message.viewOnce && message.viewedAt ? (
          <div className="bubble theirs" style={{ color: "var(--text-dim)", fontStyle: "italic" }}>
            Photo opened
          </div>
        ) : (
          <div className="viewonce-bubble" onClick={onOpenViewOnce}>
            📷 View once photo — tap to open
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bubble-row ${mine ? "mine" : ""}`}>
      <div className={`bubble ${mine ? "mine" : "theirs"}`}>
        {message.content}
        <div className="bubble-time">{time}</div>
      </div>
    </div>
  );
}
