"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProductShell } from "@/components/product-shell/ProductShell";
import { Icon } from "@/components/product-shell/Icon";
import { haptic } from "@/lib/haptics";
import styles from "./calls.module.css";

type Tab = "history" | "dial" | "recordings";
const keys = [["1", ""], ["2", "ABC"], ["3", "DEF"], ["4", "GHI"], ["5", "JKL"], ["6", "MNO"], ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"], ["*", ""], ["0", "+"], ["#", ""]];

export default function CallsPage() {
  const search = useSearchParams();
  const suggestedUser = search.get("user") ?? "";
  const [tab, setTab] = useState<Tab>("history");
  const [number, setNumber] = useState(suggestedUser ? `@${suggestedUser}` : "");
  const [consent, setConsent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const stats = useMemo(() => ({ total: 0, minutes: 0, missed: 0, recordings: 0 }), []);

  function choose(next: Tab) {
    haptic("selection");
    setTab(next);
    setNotice(null);
  }

  function requestCall() {
    haptic("medium");
    setNotice("Real voice/video calling needs the WebRTC signaling and TURN service to be configured. No fake call record was created.");
  }

  return (
    <ProductShell title="Calls">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div>
            <small>CALL CENTER</small>
            <h1>Calls without<br />fake activity.</h1>
            <p>Dial pad, consent controls and real call history live here. Empty data stays empty until a real WebRTC call is connected.</p>
          </div>
          <div className={styles.orb}><Icon name="phone" size={36} /><i /><i /></div>
        </section>

        <section className={styles.stats}>
          <article><small>TOTAL</small><strong>{stats.total}</strong><span>Real call records</span></article>
          <article><small>TALK TIME</small><strong>{stats.minutes}m</strong><span>Connected only</span></article>
          <article><small>MISSED</small><strong>{stats.missed}</strong><span>No sample data</span></article>
          <article><small>RECORDINGS</small><strong>{stats.recordings}</strong><span>Consent required</span></article>
        </section>

        {notice && <div className={styles.notice}><Icon name="shield" /><span><strong>Provider setup required</strong><small>{notice}</small></span></div>}

        <section className={styles.panel}>
          <div className={styles.tabs}>
            <button className={tab === "history" ? styles.active : ""} onClick={() => choose("history")}><Icon name="history" size={16} />History</button>
            <button className={tab === "dial" ? styles.active : ""} onClick={() => choose("dial")}><Icon name="phone" size={16} />Dial pad</button>
            <button className={tab === "recordings" ? styles.active : ""} onClick={() => choose("recordings")}><Icon name="file" size={16} />Recordings</button>
          </div>

          {tab === "history" && (
            <div className={styles.recordings}>
              <div className={styles.notice}><Icon name="history" /><span><strong>No call history yet</strong><small>Only real connected, missed or declined calls will appear here after the WebRTC backend is enabled.</small></span></div>
            </div>
          )}

          {tab === "dial" && (
            <div className={styles.dialGrid}>
              <div className={styles.dial}>
                <div className={styles.number}>
                  <small>IPCHAT USERNAME OR NUMBER</small>
                  <strong>{number || "Enter recipient"}</strong>
                  {number && <button onClick={() => { haptic("light"); setNumber((value) => value.slice(0, -1)); }}>⌫</button>}
                </div>
                <div className={styles.keys}>
                  {keys.map(([key, letters]) => (
                    <button key={key} onClick={() => { haptic("light"); setNumber((value) => `${value}${key}`.slice(0, 30)); }}>
                      <strong>{key}</strong><small>{letters}</small>
                    </button>
                  ))}
                </div>
                <button className={styles.call} disabled={!number.trim()} onClick={requestCall}><Icon name="phone" />Request call</button>
              </div>
              <aside>
                <Icon name="shield" size={25} />
                <small>RECORDING SAFETY</small>
                <h2>Never record silently.</h2>
                <p>Recording can become available only after a real in-app call connects and every participant receives a clear notice.</p>
                <label>
                  <input type="checkbox" checked={consent} onChange={(event) => { haptic("selection"); setConsent(event.target.checked); }} />
                  <i />
                  <span><strong>Ask to record after connection</strong><small>Consent is always required</small></span>
                </label>
              </aside>
            </div>
          )}

          {tab === "recordings" && (
            <div className={styles.recordings}>
              <div className={styles.notice}><Icon name="shield" /><span><strong>No recordings</strong><small>IPChat never shows demo recordings. A real recording will appear only after consent and successful upload.</small></span></div>
            </div>
          )}
        </section>
      </div>
    </ProductShell>
  );
}
