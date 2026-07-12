"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Tab = "overview" | "otp" | "users" | "requests" | "audit";

type DashboardStats = {
  users: number;
  conversations: number;
  messages: number;
  pendingRequests: number;
  bannedUsers: number;
};

type AuditEntry = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  actor: { username: string };
};

type AdminOtp = {
  phoneHash: string;
  phone: string;
  phoneLast4: string;
  code: string;
  status: "PENDING" | "SENT";
  createdAt: string;
  expiresAt: string;
  sentAt: string | null;
};

type AdminUser = {
  id: string;
  username: string;
  displayName: string;
  phoneLast4: string;
  avatarUrl: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
  lastSeenAt: string;
  isBanned: boolean;
  _count: { memberships: number; sentMessages: number; dataRequestsAboutMe: number };
};

type UserConversation = {
  id: string;
  isGroup: boolean;
  title: string | null;
  createdAt: string;
  participants: { id: string; username: string; displayName: string }[];
  lastMessage: { id: string; type: string; createdAt: string; deletedAt: string | null } | null;
};

type UserDetail = AdminUser;

type AdminMessage = {
  id: string;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  createdAt: string;
  deletedAt: string | null;
  sender: { id: string; username: string; displayName: string };
};

type OpenConversation = {
  id: string;
  title: string | null;
  isGroup: boolean;
  participants: { id: string; username: string; displayName: string }[];
};

type DataRequest = {
  id: string;
  status: "PENDING" | "APPROVED" | "DENIED" | "FULFILLED";
  reason: string;
  legalReference: string | null;
  createdAt: string;
  targetUser: { username: string; displayName: string };
  requestedBy: { username: string };
};

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...(options?.headers ?? {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "Request failed.");
  return data as T;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function timeLeft(expiresAt: string, now: number): string {
  const seconds = Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentAudit, setRecentAudit] = useState<AuditEntry[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [otps, setOtps] = useState<AdminOtp[]>([]);
  const [now, setNow] = useState(Date.now());
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [userConversations, setUserConversations] = useState<UserConversation[]>([]);
  const [accessReason, setAccessReason] = useState("");
  const [openConversation, setOpenConversation] = useState<OpenConversation | null>(null);
  const [openMessages, setOpenMessages] = useState<AdminMessage[]>([]);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [requestForm, setRequestForm] = useState({ targetUsername: "", reason: "", legalReference: "" });
  const [exportResult, setExportResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotice = useCallback((type: "success" | "error", text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const loadDashboard = useCallback(async () => {
    const data = await api<{ stats: DashboardStats; recentAudit: AuditEntry[] }>("/api/admin/dashboard");
    setStats(data.stats);
    setRecentAudit(data.recentAudit);
  }, []);

  const loadOtps = useCallback(async () => {
    const data = await api<{ records: AdminOtp[] }>("/api/admin/otp");
    setOtps(data.records);
  }, []);

  const loadUsers = useCallback(async (search = "") => {
    const data = await api<{ users: AdminUser[] }>(`/api/admin/users?q=${encodeURIComponent(search)}`);
    setUsers(data.users);
  }, []);

  const loadRequests = useCallback(async () => {
    const data = await api<{ requests: DataRequest[] }>("/api/admin/requests");
    setRequests(data.requests ?? []);
  }, []);

  const loadLogs = useCallback(async () => {
    const data = await api<{ logs: AuditEntry[] }>("/api/admin/audit-log");
    setLogs(data.logs ?? []);
  }, []);

  useEffect(() => {
    Promise.all([loadDashboard(), loadRequests(), loadLogs()]).catch((error: Error) => {
      showNotice("error", error.message);
    });
  }, [loadDashboard, loadLogs, loadRequests, showNotice]);

  useEffect(() => {
    if (tab === "otp") {
      loadOtps().catch((error: Error) => showNotice("error", error.message));
      const refresh = window.setInterval(() => loadOtps().catch(() => undefined), 5000);
      const clock = window.setInterval(() => setNow(Date.now()), 1000);
      return () => {
        window.clearInterval(refresh);
        window.clearInterval(clock);
      };
    }
    if (tab === "users" && users.length === 0) {
      loadUsers().catch((error: Error) => showNotice("error", error.message));
    }
    return undefined;
  }, [loadOtps, loadUsers, showNotice, tab, users.length]);

  const navItems: { id: Tab; label: string; badge?: number }[] = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "otp", label: "OTP Inbox", badge: otps.filter((otp) => otp.status === "PENDING").length },
      { id: "users", label: "Users & chats" },
      { id: "requests", label: "Legal access", badge: stats?.pendingRequests },
      { id: "audit", label: "Audit trail" }
    ],
    [otps, stats?.pendingRequests]
  );

  async function searchUsers(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await loadUsers(query);
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  async function openUser(userId: string) {
    setLoading(true);
    setOpenConversation(null);
    setOpenMessages([]);
    try {
      const data = await api<{ user: UserDetail; conversations: UserConversation[] }>(`/api/admin/users/${userId}`);
      setSelectedUser(data.user);
      setUserConversations(data.conversations);
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Unable to open user.");
    } finally {
      setLoading(false);
    }
  }

  async function viewConversation(conversationId: string) {
    if (accessReason.trim().length < 5) {
      showNotice("error", "Enter a clear reason of at least 5 characters before opening private messages.");
      return;
    }

    setLoading(true);
    try {
      const data = await api<{ conversation: OpenConversation; messages: AdminMessage[] }>(
        `/api/admin/conversations/${conversationId}/messages`,
        { method: "POST", body: JSON.stringify({ reason: accessReason.trim() }) }
      );
      setOpenConversation(data.conversation);
      setOpenMessages(data.messages);
      showNotice("success", "Conversation opened and the access was recorded in the audit trail.");
      await Promise.all([loadLogs(), loadDashboard()]);
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Unable to open conversation.");
    } finally {
      setLoading(false);
    }
  }

  async function otpAction(otp: AdminOtp, action: "mark_sent" | "dismiss") {
    try {
      await api("/api/admin/otp", {
        method: "PATCH",
        body: JSON.stringify({ phoneHash: otp.phoneHash, phoneLast4: otp.phoneLast4, action })
      });
      await loadOtps();
      showNotice("success", action === "mark_sent" ? "OTP marked as sent." : "OTP removed.");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "OTP action failed.");
    }
  }

  async function copyOtp(otp: AdminOtp) {
    try {
      await navigator.clipboard.writeText(otp.code);
      showNotice("success", `OTP ${otp.code} copied.`);
    } catch {
      showNotice("error", "Clipboard permission was blocked. Long-press the code to copy it.");
    }
  }

  async function submitRequest(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await api("/api/admin/requests", { method: "POST", body: JSON.stringify(requestForm) });
      setRequestForm({ targetUsername: "", reason: "", legalReference: "" });
      await Promise.all([loadRequests(), loadLogs(), loadDashboard()]);
      showNotice("success", "Legal access request created.");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Unable to create request.");
    } finally {
      setLoading(false);
    }
  }

  async function requestAction(id: string, action: "approve" | "deny") {
    try {
      await api(`/api/admin/requests/${id}/${action}`, { method: "PATCH" });
      await Promise.all([loadRequests(), loadLogs(), loadDashboard()]);
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Action failed.");
    }
  }

  async function exportData(id: string) {
    try {
      const data = await api<unknown>("/api/admin/export", {
        method: "POST",
        body: JSON.stringify({ requestId: id })
      });
      setExportResult(data);
      await Promise.all([loadRequests(), loadLogs(), loadDashboard()]);
      showNotice("success", "Authorized export generated and audited.");
    } catch (error) {
      showNotice("error", error instanceof Error ? error.message : "Export failed.");
    }
  }

  return (
    <div className="admin-shell admin-v2-shell">
      <aside className="admin-sidebar admin-v2-sidebar">
        <div className="admin-v2-brand">
          <div className="admin-v2-logo">IP</div>
          <div>
            <strong>IPChat</strong>
            <span>Owner Control Center</span>
          </div>
        </div>

        <nav className="admin-v2-nav" aria-label="Admin navigation">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-nav-item ${tab === item.id ? "active" : ""}`}
              onClick={() => setTab(item.id)}
            >
              <span>{item.label}</span>
              {Boolean(item.badge) && <span className="admin-nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="admin-v2-security">
          <span className="admin-live-dot" />
          Protected admin session
          <small>Private-data access is reason-gated and audited.</small>
        </div>
      </aside>

      <main className="admin-main admin-v2-main">
        <header className="admin-v2-topbar">
          <div>
            <p className="admin-v2-eyebrow">Secure operations</p>
            <h1>{navItems.find((item) => item.id === tab)?.label}</h1>
          </div>
          <div className="admin-v2-status"><span className="admin-live-dot" /> Live</div>
        </header>

        {notice && <div className={`admin-notice ${notice.type}`}>{notice.text}</div>}
        {loading && <div className="admin-loading-bar" />}

        {tab === "overview" && (
          <section>
            <div className="admin-metric-grid">
              <Metric label="Users" value={stats?.users ?? 0} helper="Registered accounts" />
              <Metric label="Conversations" value={stats?.conversations ?? 0} helper="Private and group threads" />
              <Metric label="Messages" value={stats?.messages ?? 0} helper="Active, non-deleted messages" />
              <Metric label="Pending legal requests" value={stats?.pendingRequests ?? 0} helper="Waiting for review" attention />
              <Metric label="Suspended users" value={stats?.bannedUsers ?? 0} helper="Restricted accounts" />
            </div>

            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>Recent admin activity</h2>
                  <p>Every sensitive admin action appears here.</p>
                </div>
                <button className="btn btn-ghost" onClick={() => setTab("audit")}>View all</button>
              </div>
              <AuditTable logs={recentAudit} />
            </div>
          </section>
        )}

        {tab === "otp" && (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Manual OTP delivery</h2>
                <p>Copy the code, send it through your Telegram webpage, then mark it sent. Codes disappear after 5 minutes.</p>
              </div>
              <button className="btn btn-ghost" onClick={() => loadOtps()}>Refresh</button>
            </div>

            {otps.length === 0 ? (
              <Empty title="No active OTP requests" text="New login requests will appear here automatically." />
            ) : (
              <div className="otp-grid">
                {otps.map((otp) => (
                  <article className="otp-card" key={otp.phoneHash}>
                    <div className="otp-card-top">
                      <div>
                        <span className={`otp-status ${otp.status.toLowerCase()}`}>{otp.status}</span>
                        <h3>{otp.phone}</h3>
                        <p>Requested {formatDate(otp.createdAt)}</p>
                      </div>
                      <div className="otp-timer">{timeLeft(otp.expiresAt, now)}</div>
                    </div>
                    <button type="button" className="otp-code" onClick={() => copyOtp(otp)} title="Copy OTP">
                      {otp.code}
                    </button>
                    <div className="otp-actions">
                      <button className="btn btn-accent" onClick={() => copyOtp(otp)}>Copy OTP</button>
                      <button className="btn btn-ghost" onClick={() => otpAction(otp, "mark_sent")}>Mark sent</button>
                      <button className="btn btn-ghost" onClick={() => otpAction(otp, "dismiss")}>Dismiss</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "users" && (
          <section className="admin-user-layout">
            <div className="admin-panel admin-user-directory">
              <div className="admin-panel-header compact">
                <div>
                  <h2>User directory</h2>
                  <p>Search by username, display name, or last four phone digits.</p>
                </div>
              </div>
              <form className="admin-search" onSubmit={searchUsers}>
                <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users" />
                <button className="btn btn-accent" disabled={loading}>Search</button>
              </form>
              <div className="admin-user-list">
                {users.map((user) => (
                  <button
                    type="button"
                    key={user.id}
                    className={`admin-user-row ${selectedUser?.id === user.id ? "selected" : ""}`}
                    onClick={() => openUser(user.id)}
                  >
                    <div className="avatar">{user.displayName.slice(0, 1).toUpperCase()}</div>
                    <div className="admin-user-row-copy">
                      <strong>{user.displayName}</strong>
                      <span>@{user.username} · ••••{user.phoneLast4}</span>
                    </div>
                    <div className="admin-user-row-meta">
                      <span>{user._count.sentMessages} msgs</span>
                      {user.role === "ADMIN" && <em>ADMIN</em>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-panel admin-user-detail">
              {!selectedUser ? (
                <Empty title="Select a user" text="Open a profile to review account information and conversations." />
              ) : (
                <>
                  <div className="admin-profile-header">
                    <div className="avatar large">{selectedUser.displayName.slice(0, 1).toUpperCase()}</div>
                    <div>
                      <h2>{selectedUser.displayName}</h2>
                      <p>@{selectedUser.username} · phone ending {selectedUser.phoneLast4}</p>
                    </div>
                    <span className={`account-state ${selectedUser.isBanned ? "banned" : "active"}`}>
                      {selectedUser.isBanned ? "Suspended" : selectedUser.role}
                    </span>
                  </div>

                  <div className="admin-profile-stats">
                    <div><span>Messages</span><strong>{selectedUser._count.sentMessages}</strong></div>
                    <div><span>Chats</span><strong>{selectedUser._count.memberships}</strong></div>
                    <div><span>Joined</span><strong>{formatDate(selectedUser.createdAt)}</strong></div>
                    <div><span>Last seen</span><strong>{formatDate(selectedUser.lastSeenAt)}</strong></div>
                  </div>

                  <div className="admin-access-gate">
                    <label htmlFor="access-reason">Reason required before opening private messages</label>
                    <textarea
                      id="access-reason"
                      className="input"
                      rows={2}
                      value={accessReason}
                      onChange={(event) => setAccessReason(event.target.value)}
                      placeholder="Example: abuse report review, support investigation, or legal case reference"
                    />
                  </div>

                  <div className="admin-conversation-list">
                    {userConversations.length === 0 ? (
                      <Empty title="No conversations" text="This user has not started a chat yet." />
                    ) : (
                      userConversations.map((conversation) => {
                        const names = conversation.participants.map((participant) => `@${participant.username}`).join(", ");
                        return (
                          <div className="admin-conversation-row" key={conversation.id}>
                            <div>
                              <strong>{conversation.title ?? names}</strong>
                              <span>
                                {conversation.isGroup ? "Group" : "Direct"} · {conversation.lastMessage ? `Last activity ${formatDate(conversation.lastMessage.createdAt)}` : "No messages"}
                              </span>
                            </div>
                            <button className="btn btn-ghost" onClick={() => viewConversation(conversation.id)}>Open</button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {openConversation && (
                    <div className="admin-message-viewer">
                      <div className="admin-message-viewer-header">
                        <div>
                          <h3>{openConversation.title ?? openConversation.participants.map((p) => `@${p.username}`).join(", ")}</h3>
                          <p>{openMessages.length} messages returned · access recorded</p>
                        </div>
                        <button className="btn btn-ghost" onClick={() => { setOpenConversation(null); setOpenMessages([]); }}>Close</button>
                      </div>
                      <div className="admin-message-list">
                        {openMessages.map((message) => (
                          <article className="admin-message" key={message.id}>
                            <div className="admin-message-meta">
                              <strong>@{message.sender.username}</strong>
                              <span>{formatDate(message.createdAt)}</span>
                            </div>
                            {message.deletedAt ? (
                              <p className="admin-message-deleted">Message deleted</p>
                            ) : message.type === "PHOTO" ? (
                              message.mediaUrl ? <a href={message.mediaUrl} target="_blank" rel="noreferrer">Open attached photo</a> : <p>Photo unavailable</p>
                            ) : (
                              <p>{message.content}</p>
                            )}
                          </article>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {tab === "requests" && (
          <section>
            <div className="admin-panel">
              <div className="admin-panel-header">
                <div>
                  <h2>Legal and formal data access</h2>
                  <p>Use this workflow for exports or formal disclosures. Direct conversation viewing remains separately reason-gated and audited.</p>
                </div>
              </div>
              <form className="admin-request-form" onSubmit={submitRequest}>
                <input className="input" placeholder="Target username" value={requestForm.targetUsername} onChange={(event) => setRequestForm({ ...requestForm, targetUsername: event.target.value })} />
                <input className="input" placeholder="Case / legal reference (optional)" value={requestForm.legalReference} onChange={(event) => setRequestForm({ ...requestForm, legalReference: event.target.value })} />
                <textarea className="input" rows={3} placeholder="Reason (required)" value={requestForm.reason} onChange={(event) => setRequestForm({ ...requestForm, reason: event.target.value })} />
                <button className="btn btn-accent" disabled={loading}>Create request</button>
              </form>
            </div>

            <div className="admin-panel">
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>User</th><th>Reason</th><th>Reference</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id}>
                        <td>@{request.targetUser.username}</td>
                        <td>{request.reason}</td>
                        <td className="mono">{request.legalReference ?? "—"}</td>
                        <td><span className={`badge badge-${request.status.toLowerCase()}`}>{request.status}</span></td>
                        <td className="admin-table-actions">
                          {request.status === "PENDING" && (
                            <>
                              <button className="btn btn-ghost" onClick={() => requestAction(request.id, "approve")}>Approve</button>
                              <button className="btn btn-ghost" onClick={() => requestAction(request.id, "deny")}>Deny</button>
                            </>
                          )}
                          {request.status === "APPROVED" && <button className="btn btn-accent" onClick={() => exportData(request.id)}>Export</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {exportResult !== null && <pre className="admin-export-preview">{JSON.stringify(exportResult, null, 2)}</pre>}
            </div>
          </section>
        )}

        {tab === "audit" && (
          <section className="admin-panel">
            <div className="admin-panel-header">
              <div>
                <h2>Full audit trail</h2>
                <p>Admin data access and operational actions are recorded with actor, target, and timestamp.</p>
              </div>
              <button className="btn btn-ghost" onClick={() => loadLogs()}>Refresh</button>
            </div>
            <AuditTable logs={logs} />
          </section>
        )}
      </main>
    </div>
  );
}

function Metric({ label, value, helper, attention = false }: { label: string; value: number; helper: string; attention?: boolean }) {
  return (
    <article className={`admin-metric ${attention && value > 0 ? "attention" : ""}`}>
      <span>{label}</span>
      <strong>{value.toLocaleString()}</strong>
      <small>{helper}</small>
    </article>
  );
}

function AuditTable({ logs }: { logs: AuditEntry[] }) {
  if (logs.length === 0) return <Empty title="No audit activity" text="Sensitive admin actions will appear here." />;
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th></tr></thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="mono">{formatDate(log.createdAt)}</td>
              <td>@{log.actor.username}</td>
              <td>{log.action.replaceAll("_", " ")}</td>
              <td className="mono">{log.targetType}:{log.targetId.slice(0, 10)}…</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="admin-empty">
      <div className="admin-empty-icon">◇</div>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
