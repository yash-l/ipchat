"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductShell } from "@/components/product-shell/ProductShell";
import { Icon } from "@/components/product-shell/Icon";
import { haptic } from "@/lib/haptics";
import styles from "./status.module.css";

type Tab = "status" | "snaps" | "mine";
type StatusKind = "TEXT" | "SNAP";
type StatusAudience = "EVERYONE" | "CONTACTS";
type StyleName = "sunset" | "ocean" | "forest" | "neon" | "midnight";

type StatusItem = {
  id: string;
  userId: string;
  kind: StatusKind;
  content: string;
  style: StyleName;
  audience: StatusAudience;
  createdAt: string;
  expiresAt: string;
  viewed: boolean;
  views: number;
  replies: number;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

type FeedPayload = {
  me?: { userId: string; username: string };
  statuses?: StatusItem[];
  error?: string;
};

type CreatePayload = { status?: StatusItem; error?: string };

const STYLE_OPTIONS: Array<{ id: StyleName; label: string }> = [
  { id: "sunset", label: "Sunset" },
  { id: "ocean", label: "Ocean" },
  { id: "forest", label: "Forest" },
  { id: "neon", label: "Neon" },
  { id: "midnight", label: "Midnight" }
];

const AUDIENCES: Array<{ id: StatusAudience; label: string; copy: string }> = [
  { id: "EVERYONE", label: "Everyone", copy: "Visible to all IPChat users." },
  { id: "CONTACTS", label: "Contacts", copy: "Visible only to people who share a conversation with you." }
];

const EXPIRIES = [1, 6, 12, 24] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function expiresIn(value: string, now = Date.now()) {
  const remaining = Math.max(0, new Date(value).getTime() - now);
  const hours = Math.floor(remaining / 3_600_000);
  const minutes = Math.floor((remaining % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${Math.max(1, minutes)}m left`;
}

function timeAgo(value: string, now = Date.now()) {
  const elapsed = Math.max(0, now - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function StatusPage() {
  const [tab, setTab] = useState<Tab>("status");
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [myUserId, setMyUserId] = useState("");
  const [viewer, setViewer] = useState<StatusItem | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [kind, setKind] = useState<StatusKind>("TEXT");
  const [content, setContent] = useState("");
  const [styleName, setStyleName] = useState<StyleName>("sunset");
  const [audience, setAudience] = useState<StatusAudience>("CONTACTS");
  const [expiryHours, setExpiryHours] = useState<(typeof EXPIRIES)[number]>(24);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [clock, setClock] = useState(Date.now());

  const loadStatuses = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    const response = await fetch("/api/statuses", { cache: "no-store" });
    const data = await readJson<FeedPayload>(response);
    if (!response.ok || !data) {
      setError(data?.error ?? "Unable to load status feed.");
      if (!quiet) setLoading(false);
      return;
    }
    setMyUserId(data.me?.userId ?? "");
    setStatuses(data.statuses ?? []);
    setError(null);
    if (!quiet) setLoading(false);
  }, []);

  useEffect(() => {
    void loadStatuses();
    const refresh = window.setInterval(() => void loadStatuses(true), 30_000);
    const tick = window.setInterval(() => setClock(Date.now()), 15_000);
    return () => {
      window.clearInterval(refresh);
      window.clearInterval(tick);
    };
  }, [loadStatuses]);

  useEffect(() => {
    setStatuses((current) => current.filter((item) => new Date(item.expiresAt).getTime() > clock));
    if (viewer && new Date(viewer.expiresAt).getTime() <= clock) {
      setViewer(null);
      setNotice("That status expired and was removed.");
    }
  }, [clock, viewer]);

  const activeStatuses = useMemo(
    () => statuses.filter((item) => new Date(item.expiresAt).getTime() > clock),
    [statuses, clock]
  );
  const otherStatuses = useMemo(
    () => activeStatuses.filter((item) => item.userId !== myUserId && item.kind === "TEXT"),
    [activeStatuses, myUserId]
  );
  const snaps = useMemo(
    () => activeStatuses.filter((item) => item.userId !== myUserId && item.kind === "SNAP"),
    [activeStatuses, myUserId]
  );
  const mine = useMemo(
    () => activeStatuses.filter((item) => item.userId === myUserId),
    [activeStatuses, myUserId]
  );
  const myStats = useMemo(
    () => ({
      views: mine.reduce((sum, item) => sum + item.views, 0),
      replies: mine.reduce((sum, item) => sum + item.replies, 0),
      active: mine.length
    }),
    [mine]
  );

  function selectTab(next: Tab) {
    haptic("selection");
    setTab(next);
    setNotice(null);
  }

  function resetCreator() {
    setKind("TEXT");
    setContent("");
    setStyleName("sunset");
    setAudience("CONTACTS");
    setExpiryHours(24);
  }

  function openCreator(nextKind: StatusKind = "TEXT") {
    haptic("medium");
    setKind(nextKind);
    setCreatorOpen(true);
    setError(null);
    setNotice(null);
  }

  async function publishStatus() {
    if (!content.trim() || publishing) return;
    setPublishing(true);
    setError(null);

    const response = await fetch("/api/statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        content: content.trim(),
        style: styleName,
        audience,
        expiryHours
      })
    });
    const data = await readJson<CreatePayload>(response);

    if (!response.ok || !data?.status) {
      setError(data?.error ?? "Unable to publish status.");
      setPublishing(false);
      return;
    }

    haptic("success");
    setStatuses((current) => [data.status as StatusItem, ...current]);
    setCreatorOpen(false);
    setTab("mine");
    setNotice(`Published. It will disappear automatically after ${expiryHours} hour${expiryHours === 1 ? "" : "s"}.`);
    resetCreator();
    setPublishing(false);
  }

  async function openStatus(item: StatusItem) {
    haptic("medium");
    setViewer(item);
    setReply("");
    setNotice(null);

    if (item.userId === myUserId || item.viewed) return;
    const response = await fetch(`/api/statuses/${item.id}/view`, { method: "POST" });
    const data = await readJson<{ views?: number }>(response);
    if (response.ok) {
      setStatuses((current) => current.map((status) => (
        status.id === item.id
          ? { ...status, viewed: true, views: data?.views ?? status.views + 1 }
          : status
      )));
    }
  }

  async function sendReply() {
    if (!viewer || !reply.trim() || sendingReply) return;
    setSendingReply(true);
    const response = await fetch(`/api/statuses/${viewer.id}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: reply.trim() })
    });
    const data = await readJson<{ replies?: number; error?: string }>(response);
    if (!response.ok) {
      setError(data?.error ?? "Unable to send reply.");
      setSendingReply(false);
      return;
    }
    haptic("success");
    setStatuses((current) => current.map((status) => (
      status.id === viewer.id ? { ...status, replies: data?.replies ?? status.replies + 1 } : status
    )));
    setReply("");
    setNotice("Reply sent privately.");
    setSendingReply(false);
  }

  async function deleteStatus(id: string) {
    haptic("warning");
    const response = await fetch(`/api/statuses/${id}`, { method: "DELETE" });
    const data = await readJson<{ error?: string }>(response);
    if (!response.ok) {
      setError(data?.error ?? "Unable to delete status.");
      return;
    }
    setStatuses((current) => current.filter((item) => item.id !== id));
    if (viewer?.id === id) setViewer(null);
    setNotice("Status deleted.");
  }

  return (
    <ProductShell title="Status">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <small>MOMENTS</small>
            <h1>Status and snaps.<br />Real, private, temporary.</h1>
            <p>
              Publish a real status, choose its audience and set when it disappears. Expired posts are hidden immediately and removed from the database on feed refresh.
            </p>
            <div className={styles.heroActions}>
              <button onClick={() => openCreator("TEXT")}><Icon name="plus" size={17} /> New status</button>
              <button onClick={() => openCreator("SNAP")}><Icon name="camera" size={17} /> New snap</button>
            </div>
          </div>
          <div className={styles.orbit}>
            <span>24H</span><i>1H</i><i>6H</i><i>12H</i>
          </div>
        </section>

        <section className={styles.stats}>
          <article><small>ACTIVE</small><strong>{myStats.active}</strong><span>Your live posts</span></article>
          <article><small>VIEWS</small><strong>{myStats.views}</strong><span>Unique viewers</span></article>
          <article><small>REPLIES</small><strong>{myStats.replies}</strong><span>Private responses</span></article>
        </section>

        {(error || notice) && (
          <button className={`${styles.banner} ${error ? styles.bannerError : ""}`} onClick={() => { setError(null); setNotice(null); }}>
            <span>{error ?? notice}</span><b>×</b>
          </button>
        )}

        <section className={styles.panel}>
          <div className={styles.tabs}>
            <button className={tab === "status" ? styles.active : ""} onClick={() => selectTab("status")}><Icon name="sparkles" size={16} /> Status</button>
            <button className={tab === "snaps" ? styles.active : ""} onClick={() => selectTab("snaps")}><Icon name="camera" size={16} /> Snaps</button>
            <button className={tab === "mine" ? styles.active : ""} onClick={() => selectTab("mine")}><Icon name="user" size={16} /> My status</button>
          </div>

          {loading ? (
            <div className={styles.loading}><span /><span /><span /></div>
          ) : tab === "status" ? (
            <Feed
              items={otherStatuses}
              emptyTitle="No active statuses"
              emptyCopy="When people publish a status, it will appear here until it expires."
              onOpen={openStatus}
            />
          ) : tab === "snaps" ? (
            <Feed
              items={snaps}
              snapMode
              emptyTitle="No active snaps"
              emptyCopy="Snaps from your circle will appear here and disappear at their selected expiry time."
              onOpen={openStatus}
            />
          ) : (
            <Mine
              items={mine}
              stats={myStats}
              onCreate={() => openCreator("TEXT")}
              onDelete={deleteStatus}
              onOpen={openStatus}
            />
          )}
        </section>

        {creatorOpen && (
          <div className={styles.overlay} onMouseDown={() => setCreatorOpen(false)}>
            <section className={styles.creator} onMouseDown={(event) => event.stopPropagation()}>
              <header>
                <div><small>NEW {kind === "SNAP" ? "SNAP" : "STATUS"}</small><h2>Share a moment</h2></div>
                <button onClick={() => setCreatorOpen(false)} aria-label="Close creator">×</button>
              </header>

              <div className={styles.kindSwitch}>
                <button className={kind === "TEXT" ? styles.selected : ""} onClick={() => { haptic("selection"); setKind("TEXT"); }}><Icon name="edit" size={15} /> Status</button>
                <button className={kind === "SNAP" ? styles.selected : ""} onClick={() => { haptic("selection"); setKind("SNAP"); }}><Icon name="camera" size={15} /> Snap</button>
              </div>

              <textarea
                className={styles[styleName]}
                value={content}
                onChange={(event) => setContent(event.target.value.slice(0, 220))}
                placeholder={kind === "SNAP" ? "Write your snap…" : "What’s happening?"}
                autoFocus
              />

              <div className={styles.optionBlock}>
                <div><span><Icon name="palette" size={16} /></span><div><strong>Style</strong><small>Every style button changes the live preview.</small></div></div>
                <div className={styles.styleChoices}>
                  {STYLE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      className={`${styles[option.id]} ${styleName === option.id ? styles.chosen : ""}`}
                      onClick={() => { haptic("selection"); setStyleName(option.id); }}
                      aria-label={option.label}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.optionBlock}>
                <div><span><Icon name="users" size={16} /></span><div><strong>Audience</strong><small>{AUDIENCES.find((item) => item.id === audience)?.copy}</small></div></div>
                <select value={audience} onChange={(event) => { haptic("selection"); setAudience(event.target.value as StatusAudience); }}>
                  {AUDIENCES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </div>

              <div className={styles.optionBlock}>
                <div><span><Icon name="history" size={16} /></span><div><strong>Auto-delete</strong><small>Status disappears automatically after this duration.</small></div></div>
                <div className={styles.expiryChoices}>
                  {EXPIRIES.map((hours) => (
                    <button key={hours} className={expiryHours === hours ? styles.chosen : ""} onClick={() => { haptic("selection"); setExpiryHours(hours); }}>{hours}h</button>
                  ))}
                </div>
              </div>

              <footer>
                <small>{content.length}/220</small>
                <button disabled={!content.trim() || publishing} onClick={() => void publishStatus()}>
                  <Icon name="send" size={16} /> {publishing ? "Publishing…" : `Publish · ${expiryHours}h`}
                </button>
              </footer>
            </section>
          </div>
        )}

        {viewer && (
          <div className={styles.viewer}>
            <div className={styles.progress}><i /></div>
            <header>
              <span>{initials(viewer.user.displayName)}</span>
              <div><strong>{viewer.user.displayName}</strong><small>@{viewer.user.username} · {timeAgo(viewer.createdAt, clock)} · {expiresIn(viewer.expiresAt, clock)}</small></div>
              <button onClick={() => setViewer(null)} aria-label="Close status">×</button>
            </header>
            <main className={styles[viewer.style]}><h2>{viewer.content}</h2></main>
            {viewer.userId === myUserId ? (
              <footer className={styles.ownerFooter}>
                <span><Icon name="eye" size={15} /> {viewer.views} views · {viewer.replies} replies</span>
                <button onClick={() => void deleteStatus(viewer.id)}><Icon name="trash" size={16} /> Delete now</button>
              </footer>
            ) : (
              <footer className={styles.replyFooter}>
                <input value={reply} onChange={(event) => setReply(event.target.value.slice(0, 500))} placeholder={`Reply to ${viewer.user.displayName.split(" ")[0]}…`} />
                <button disabled={!reply.trim() || sendingReply} onClick={() => void sendReply()}><Icon name="send" size={18} /></button>
              </footer>
            )}
          </div>
        )}
      </div>
    </ProductShell>
  );
}

function Feed({
  items,
  snapMode = false,
  emptyTitle,
  emptyCopy,
  onOpen
}: {
  items: StatusItem[];
  snapMode?: boolean;
  emptyTitle: string;
  emptyCopy: string;
  onOpen: (item: StatusItem) => void;
}) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} copy={emptyCopy} icon={snapMode ? "camera" : "sparkles"} />;
  }

  return (
    <div className={snapMode ? styles.snaps : styles.feed}>
      {items.map((item) => (
        <button key={item.id} className={snapMode ? styles[item.style] : styles.feedCard} onClick={() => void onOpen(item)}>
          {snapMode ? (
            <>
              <span className={styles.snapCamera}><Icon name="camera" size={18} /></span>
              <div><strong>{item.user.displayName}</strong><small>{item.viewed ? "Viewed" : "New snap"} · {expiresIn(item.expiresAt)}</small></div>
            </>
          ) : (
            <>
              <div className={`${styles.visual} ${styles[item.style]}`}><strong>{item.content}</strong><span><Icon name="eye" size={13} /> {item.views}</span></div>
              <footer><i>{initials(item.user.displayName)}</i><div><strong>{item.user.displayName}</strong><small>@{item.user.username} · {timeAgo(item.createdAt)} · {expiresIn(item.expiresAt)}</small></div><b>{item.viewed ? "VIEWED" : "NEW"}</b></footer>
            </>
          )}
        </button>
      ))}
    </div>
  );
}

function Mine({
  items,
  stats,
  onCreate,
  onDelete,
  onOpen
}: {
  items: StatusItem[];
  stats: { active: number; views: number; replies: number };
  onCreate: () => void;
  onDelete: (id: string) => void;
  onOpen: (item: StatusItem) => void;
}) {
  return (
    <div className={styles.mineArea}>
      <section className={styles.insights}>
        <div><small>YOUR STATUS</small><h2>Live insights</h2><p>Counts update from real views and replies.</p></div>
        <div className={styles.insightStats}>
          <span><small>Active</small><strong>{stats.active}</strong></span>
          <span><small>Views</small><strong>{stats.views}</strong></span>
          <span><small>Replies</small><strong>{stats.replies}</strong></span>
        </div>
        <button onClick={onCreate}><Icon name="plus" size={16} /> Post new</button>
      </section>

      {items.length === 0 ? (
        <EmptyState title="No active status" copy="Create one and choose 1, 6, 12 or 24 hours before it auto-deletes." icon="user" />
      ) : (
        <div className={styles.mineList}>
          {items.map((item) => (
            <article key={item.id}>
              <button className={`${styles.minePreview} ${styles[item.style]}`} onClick={() => void onOpen(item)}><strong>{item.content}</strong></button>
              <div><strong>{item.kind === "SNAP" ? "Snap" : "Status"}</strong><small>{expiresIn(item.expiresAt)} · {item.views} views · {item.replies} replies</small></div>
              <button className={styles.deleteButton} onClick={() => void onDelete(item.id)}><Icon name="trash" size={16} /></button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ title, copy, icon }: { title: string; copy: string; icon: string }) {
  return (
    <div className={styles.empty}>
      <span><Icon name={icon} size={24} /></span>
      <strong>{title}</strong>
      <p>{copy}</p>
    </div>
  );
}
