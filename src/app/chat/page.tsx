"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./chat.module.css";
import { haptic } from "@/lib/haptics";

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

type MePayload = { userId?: string; username?: string; role?: "USER" | "ADMIN" };
type ConversationsPayload = { conversations?: ConversationSummary[]; conversation?: { id: string }; error?: string };
type MessagesPayload = { messages?: Message[]; message?: Message; mediaUrl?: string; error?: string };

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function Icon({ name }: { name: "search" | "compose" | "camera" | "plus" | "send" | "back" | "phone" | "video" | "more" | "smile" | "logout" | "shield" }) {
  const paths: Record<typeof name, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
    compose: <><path d="M14.5 4.5 19.5 9.5 9 20H4v-5L14.5 4.5Z"/><path d="m12.5 6.5 5 5"/></>,
    camera: <><path d="M4 8h3l1.5-2h7L17 8h3v10H4Z"/><circle cx="12" cy="13" r="3.2"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    send: <path d="m4 4 17 8-17 8 3.2-8L4 4Zm3.2 8H21"/>,
    back: <><path d="m14.5 5-7 7 7 7"/></>,
    phone: <path d="M7.2 3.5 10 7.7 8.3 9.4c1.3 2.7 3.5 4.8 6.2 6.2l1.7-1.7 4.3 2.8-.8 3.1c-.3 1.1-1.4 1.8-2.5 1.6C9.8 20.2 3.8 14.2 2.6 6.8 2.4 5.7 3.1 4.6 4.2 4.3l3-.8Z"/>,
    video: <><rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/></>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    smile: <><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c1.8 2 5.2 2 7 0M9 9.5h.01M15 9.5h.01"/></>,
    logout: <><path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9"/></>,
    shield: <path d="M12 3 5 6v5c0 4.8 2.8 8.2 7 10 4.2-1.8 7-5.2 7-10V6l-7-3Zm-3 9 2 2 4-4"/>
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function initials(name?: string) {
  const value = name?.trim() || "?";
  const pieces = value.split(/\s+/).filter(Boolean);
  return (pieces.length > 1 ? `${pieces[0][0]}${pieces[1][0]}` : value.slice(0, 2)).toUpperCase();
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatListTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return formatTime(value);
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [openPhoto, setOpenPhoto] = useState<{ messageId: string; url: string } | null>(null);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [search, setSearch] = useState("");
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/me");
      const data = await readJson<MePayload>(response);
      if (!response.ok || !data?.userId) {
        router.push("/login");
        return;
      }
      setMyUserId(data.userId);
      setMyUsername(data.username ?? "");
    })();
  }, [router]);

  const loadConversations = useCallback(async () => {
    const response = await fetch("/api/conversations", { cache: "no-store" });
    const data = await readJson<ConversationsPayload>(response);
    if (!response.ok) {
      setError(data?.error ?? "Unable to load conversations.");
      return;
    }
    setConversations(data?.conversations ?? []);
  }, []);

  const loadMessages = useCallback(async (conversationId: string, quiet = false) => {
    if (!quiet) setLoadingMessages(true);
    const response = await fetch(`/api/conversations/${conversationId}/messages`, { cache: "no-store" });
    const data = await readJson<MessagesPayload>(response);
    if (!response.ok) {
      setError(data?.error ?? "Unable to load messages.");
      if (!quiet) setLoadingMessages(false);
      return;
    }
    setMessages([...(data?.messages ?? [])].reverse());
    if (!quiet) setLoadingMessages(false);
  }, []);

  useEffect(() => { void loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeId) return;
    void loadMessages(activeId);
    const timer = window.setInterval(() => void loadMessages(activeId, true), 3500);
    return () => window.clearInterval(timer);
  }, [activeId, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, activeId]);

  async function startConversation(event: React.FormEvent) {
    event.preventDefault();
    const username = newChatUsername.trim().replace(/^@/, "");
    if (!username) return;
    setError(null);
    const response = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username })
    });
    const data = await readJson<ConversationsPayload>(response);
    if (!response.ok || !data?.conversation?.id) {
      setError(data?.error ?? "Unable to start chat.");
      return;
    }
    setNewChatUsername("");
    setShowNewChat(false);
    await loadConversations();
    setActiveId(data.conversation.id);
  }

  async function sendMessage(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!activeId || !content || sending) return;

    haptic("light");
    haptic("light");
    setSending(true);
    setError(null);
    setDraft("");

    const response = await fetch(`/api/conversations/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "TEXT", content })
    });
    const data = await readJson<MessagesPayload>(response);

    if (!response.ok) {
      setDraft(content);
      setError(data?.error ?? "Message was not sent.");
      setSending(false);
      return;
    }

    if (data?.message) setMessages((current) => [...current, data.message as Message]);
    else await loadMessages(activeId, true);
    setSending(false);
    void loadConversations();
  }

  async function openViewOnce(message: Message) {
    if (!activeId) return;
    const response = await fetch(`/api/conversations/${activeId}/messages/${message.id}/view`, { method: "POST" });
    const data = await readJson<MessagesPayload>(response);
    if (response.ok && data?.mediaUrl) {
      setOpenPhoto({ messageId: message.id, url: data.mediaUrl });
      window.setTimeout(() => {
        setOpenPhoto(null);
        void loadMessages(activeId, true);
      }, 5000);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.push("/login");
    router.refresh();
  }

  const active = conversations.find((conversation) => conversation.id === activeId);
  const activeOther = active?.participants.find((participant) => participant.user.id !== myUserId)?.user;

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const other = conversation.participants.find((participant) => participant.user.id !== myUserId)?.user;
      return `${other?.displayName ?? ""} ${other?.username ?? ""}`.toLowerCase().includes(query);
    });
  }, [conversations, myUserId, search]);

  return (
    <main className={`${styles.shell} ${activeId ? styles.hasActive : ""}`}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.brandRow}>
            <div>
              <span className={styles.eyebrow}>IPCHAT</span>
              <h1>Messages</h1>
            </div>
            <button className={styles.roundButton} type="button" onClick={() => { haptic("selection"); setShowNewChat((value) => !value); }} aria-label="New chat">
              <Icon name="compose" />
            </button>
          </div>

          <label className={styles.searchBox}>
            <Icon name="search" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" />
          </label>
        </div>

        <div className={styles.momentRail}>
          <button className={styles.myMoment} type="button" title="Moments coming soon">
            <span className={styles.avatarRing}><span className={styles.storyAvatar}>{initials(myUsername)}</span><b>+</b></span>
            <small>Your story</small>
          </button>
          {conversations.slice(0, 6).map((conversation) => {
            const other = conversation.participants.find((participant) => participant.user.id !== myUserId)?.user;
            return (
              <button key={`moment-${conversation.id}`} className={styles.moment} type="button" onClick={() => setActiveId(conversation.id)}>
                <span className={styles.avatarRing}><span className={styles.storyAvatar}>{initials(other?.displayName)}</span></span>
                <small>{other?.displayName?.split(" ")[0] ?? "Friend"}</small>
              </button>
            );
          })}
        </div>

        {showNewChat && (
          <form className={styles.newChatCard} onSubmit={startConversation}>
            <div>
              <strong>New message</strong>
              <span>Start with a username</span>
            </div>
            <div className={styles.newChatInput}>
              <span>@</span>
              <input value={newChatUsername} onChange={(event) => setNewChatUsername(event.target.value)} placeholder="username" autoFocus />
              <button type="submit" aria-label="Start chat"><Icon name="send" /></button>
            </div>
          </form>
        )}

        {error && <button className={styles.errorBanner} type="button" onClick={() => setError(null)}>{error}<span>×</span></button>}

        <div className={styles.conversationList}>
          {filteredConversations.length === 0 ? (
            <div className={styles.emptyList}>
              <div><Icon name="compose" /></div>
              <strong>No chats yet</strong>
              <span>Tap the compose button to start one.</span>
            </div>
          ) : filteredConversations.map((conversation) => {
            const other = conversation.participants.find((participant) => participant.user.id !== myUserId)?.user;
            const last = conversation.messages[0];
            return (
              <button
                key={conversation.id}
                className={`${styles.conversationItem} ${conversation.id === activeId ? styles.active : ""}`}
                type="button"
                onClick={() => setActiveId(conversation.id)}
              >
                <span className={styles.contactAvatar}>{initials(other?.displayName)}</span>
                <span className={styles.conversationText}>
                  <span className={styles.conversationName}>{other?.displayName ?? "Conversation"}</span>
                  <span className={styles.conversationPreview}>{last ? (last.type === "PHOTO" ? "📷 Photo" : last.content) : "Say hello 👋"}</span>
                </span>
                <span className={styles.conversationMeta}>
                  <time>{formatListTime(last?.createdAt)}</time>
                  {last && <i>✓</i>}
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.profileBar}>
          <span className={styles.profileAvatar}>{initials(myUsername)}</span>
          <span><strong>@{myUsername || "account"}</strong><small>Protected account</small></span>
          <button type="button" onClick={() => void logout()} aria-label="Log out"><Icon name="logout" /></button>
        </div>
      </aside>

      <section className={styles.thread}>
        {active ? (
          <>
            <header className={styles.threadHeader}>
              <button type="button" className={styles.mobileBack} onClick={() => setActiveId(null)} aria-label="Back to chats"><Icon name="back" /></button>
              <span className={styles.headerAvatar}>{initials(activeOther?.displayName)}</span>
              <div className={styles.headerIdentity}>
                <strong>{activeOther?.displayName ?? "Conversation"}</strong>
                <span><i /> @{activeOther?.username ?? "user"}</span>
              </div>
              <div className={styles.headerActions}>
                <button type="button" title="Voice call" onClick={() => { haptic("medium"); router.push("/calls"); }}><Icon name="phone" /></button>
                <button type="button" title="Video call" onClick={() => { haptic("medium"); router.push("/calls"); }}><Icon name="video" /></button>
                <button type="button" title="More"><Icon name="more" /></button>
              </div>
            </header>

            <div className={styles.messageArea}>
              <div className={styles.privacyChip}><Icon name="shield" /> Messages are protected in storage</div>
              <div className={styles.dayDivider}><span>Today</span></div>

              {loadingMessages && messages.length === 0 ? (
                <div className={styles.messageSkeletons}><span/><span/><span/></div>
              ) : messages.length === 0 ? (
                <div className={styles.emptyThread}>
                  <span className={styles.largeAvatar}>{initials(activeOther?.displayName)}</span>
                  <h2>{activeOther?.displayName}</h2>
                  <p>@{activeOther?.username}</p>
                  <small>Send a message to start the conversation.</small>
                </div>
              ) : messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  mine={message.senderId === myUserId}
                  onOpenViewOnce={() => void openViewOnce(message)}
                />
              ))}
              <div ref={endRef} />
            </div>

            <form className={styles.composer} onSubmit={sendMessage}>
              <button type="button" className={styles.composerIcon} title="Attachments coming soon" disabled><Icon name="plus" /></button>
              <button type="button" className={styles.cameraButton} title="Camera upload coming soon" disabled><Icon name="camera" /></button>
              <div className={styles.composerField}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value.slice(0, 4000))}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="iMessage"
                  rows={1}
                />
                <button type="button" title="Emoji picker coming soon" disabled><Icon name="smile" /></button>
              </div>
              <button className={`${styles.sendButton} ${draft.trim() ? styles.ready : ""}`} disabled={!draft.trim() || sending} aria-label="Send message">
                <Icon name="send" />
              </button>
            </form>
          </>
        ) : (
          <div className={styles.welcomePane}>
            <div className={styles.welcomeOrb}>
              <span>IP</span>
              <i /><i /><i />
            </div>
            <h2>Your conversations</h2>
            <p>Select a chat or start a new one. Private, simple and made for fast everyday messaging.</p>
            <button type="button" onClick={() => setShowNewChat(true)}><Icon name="compose" /> New message</button>
          </div>
        )}
      </section>

      <nav className={styles.mobileNav}>
        <button className={styles.navActive} type="button" onClick={() => { haptic("selection"); setActiveId(null); }}><span>💬</span><small>Chats</small></button>
        <Link href="/calls" onClick={() => haptic("selection")}><span>☎</span><small>Calls</small></Link>
        <Link href="/status" onClick={() => haptic("selection")}><span>◌</span><small>Status</small></Link>
        <Link href="/settings" onClick={() => haptic("selection")}><span>⚙</span><small>Settings</small></Link>
      </nav>

      {openPhoto && (
        <div className={styles.viewOnceOverlay} onClick={() => setOpenPhoto(null)}>
          <div className={styles.viewOnceTop}><span>View once</span><button type="button" onClick={() => setOpenPhoto(null)}>×</button></div>
          <div className={styles.viewOnceFrame}>
            <img src={openPhoto.url} alt="View once" />
            <div className={styles.viewOnceProgress} />
          </div>
          <p>This photo disappears after viewing.</p>
        </div>
      )}
    </main>
  );
}

function MessageBubble({ message, mine, onOpenViewOnce }: { message: Message; mine: boolean; onOpenViewOnce: () => void }) {
  if (message.type === "PHOTO") {
    return (
      <div className={`${styles.messageRow} ${mine ? styles.mine : ""}`}>
        {message.viewOnce && message.viewedAt ? (
          <div className={`${styles.messageBubble} ${mine ? styles.outgoing : styles.incoming} ${styles.openedPhoto}`}>
            <span>◉</span> Photo opened
          </div>
        ) : (
          <button className={styles.viewOnceBubble} type="button" onClick={onOpenViewOnce}>
            <span className={styles.snapRing}><Icon name="camera" /></span>
            <span><strong>View once photo</strong><small>Tap to open</small></span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.messageRow} ${mine ? styles.mine : ""}`}>
      <div className={`${styles.messageBubble} ${mine ? styles.outgoing : styles.incoming}`}>
        <span className={styles.messageText}>{message.content}</span>
        <span className={styles.messageMeta}>{formatTime(message.createdAt)} {mine && <b>✓✓</b>}</span>
      </div>
    </div>
  );
}
