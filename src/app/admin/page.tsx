"use client";

import { useEffect, useState, useCallback } from "react";

interface DataRequest {
  id: string;
  status: "PENDING" | "APPROVED" | "DENIED" | "FULFILLED";
  reason: string;
  legalReference: string | null;
  createdAt: string;
  targetUser: { username: string; displayName: string };
  requestedBy: { username: string };
}
interface AuditEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  actor: { username: string };
}

type Tab = "requests" | "audit";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("requests");
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [form, setForm] = useState({ targetUsername: "", reason: "", legalReference: "" });
  const [exportResult, setExportResult] = useState<unknown>(null);

  const loadRequests = useCallback(async () => {
    const res = await fetch("/api/admin/requests");
    const data = await res.json();
    setRequests(data.requests ?? []);
  }, []);

  const loadLogs = useCallback(async () => {
    const res = await fetch("/api/admin/audit-log");
    const data = await res.json();
    setLogs(data.logs ?? []);
  }, []);

  useEffect(() => {
    loadRequests();
    loadLogs();
  }, [loadRequests, loadLogs]);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      setForm({ targetUsername: "", reason: "", legalReference: "" });
      loadRequests();
      loadLogs();
    }
  }

  async function approve(id: string) {
    await fetch(`/api/admin/requests/${id}/approve`, { method: "PATCH" });
    loadRequests();
    loadLogs();
  }
  async function deny(id: string) {
    await fetch(`/api/admin/requests/${id}/deny`, { method: "PATCH" });
    loadRequests();
    loadLogs();
  }
  async function exportData(id: string) {
    const res = await fetch("/api/admin/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id })
    });
    const data = await res.json();
    setExportResult(data);
    loadRequests();
    loadLogs();
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">⬡ Admin</div>
        <div className={`admin-nav-item ${tab === "requests" ? "active" : ""}`} onClick={() => setTab("requests")}>
          Data access requests
        </div>
        <div className={`admin-nav-item ${tab === "audit" ? "active" : ""}`} onClick={() => setTab("audit")}>
          Audit log
        </div>
      </aside>

      <main className="admin-main">
        {tab === "requests" && (
          <>
            <h1 className="admin-page-title">Data access requests</h1>
            <p className="admin-page-subtitle">
              No account data can be exported without an approved request here. Every create / approve / deny
              / export action is written to the audit log automatically.
            </p>

            <form
              className="card"
              style={{ padding: 20, marginBottom: 24, display: "grid", gap: 12, maxWidth: 520 }}
              onSubmit={submitRequest}
            >
              <input
                className="input"
                placeholder="Target username"
                value={form.targetUsername}
                onChange={(e) => setForm({ ...form, targetUsername: e.target.value })}
              />
              <input
                className="input"
                placeholder="Legal reference (subpoena / case number) — optional"
                value={form.legalReference}
                onChange={(e) => setForm({ ...form, legalReference: e.target.value })}
              />
              <textarea
                className="input"
                placeholder="Reason for this request (required, min 10 chars)"
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
              <button className="btn" style={{ background: "var(--admin-accent)", color: "#fff" }}>
                Create request
              </button>
            </form>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Reason</th>
                  <th>Legal ref</th>
                  <th>Status</th>
                  <th>Requested by</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>@{r.targetUser.username}</td>
                    <td>{r.reason}</td>
                    <td className="mono">{r.legalReference ?? "—"}</td>
                    <td>
                      <span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span>
                    </td>
                    <td>@{r.requestedBy.username}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      {r.status === "PENDING" && (
                        <>
                          <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => approve(r.id)}>
                            Approve
                          </button>
                          <button className="btn btn-ghost" style={{ padding: "6px 10px" }} onClick={() => deny(r.id)}>
                            Deny
                          </button>
                        </>
                      )}
                      {r.status === "APPROVED" && (
                        <button className="btn btn-accent" style={{ padding: "6px 10px" }} onClick={() => exportData(r.id)}>
                          Export
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {typeof exportResult === "object" && exportResult !== null && (
              <pre
                className="card mono"
                style={{ padding: 16, marginTop: 20, fontSize: 12, overflowX: "auto" }}
              >
                {JSON.stringify(exportResult, null, 2)}
              </pre>
            )}
          </>
        )}

        {tab === "audit" && (
          <>
            <h1 className="admin-page-title">Audit log</h1>
            <p className="admin-page-subtitle">Immutable record of every admin action. Nothing here can be deleted.</p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="mono">{new Date(l.createdAt).toLocaleString()}</td>
                    <td>@{l.actor.username}</td>
                    <td>{l.action}</td>
                    <td className="mono">
                      {l.targetType}:{l.targetId.slice(0, 8)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </main>
    </div>
  );
}
