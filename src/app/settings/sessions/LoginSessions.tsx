"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HologramEarth } from "@/components/hologram-earth/HologramEarth";
import { Icon } from "@/components/product-shell/Icon";
import { ProductShell } from "@/components/product-shell/ProductShell";
import styles from "./sessions.module.css";

type SessionItem = {
  id: string;
  deviceLabel: string;
  deviceType: string;
  browser: string;
  os: string;
  timezone: string | null;
  language: string | null;
  screen: string | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  locationMode: string | null;
  createdAt: string;
  lastSeenAt: string;
  revokedAt: string | null;
  current: boolean;
};

type SessionsPayload = {
  currentSessionId?: string | null;
  registryUpgradeRequired?: boolean;
  sessions?: SessionItem[];
  error?: string;
};

async function readJson<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function deviceIcon(type: string) {
  return type === "Mobile" || type === "Tablet" ? "phone" : "devices";
}

export function LoginSessions() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  const current = useMemo(
    () => sessions.find((item) => item.id === currentSessionId || item.current) ?? null,
    [currentSessionId, sessions]
  );

  const load = useCallback(async () => {
    const response = await fetch("/api/sessions", { cache: "no-store" });
    const data = await readJson<SessionsPayload>(response);
    if (!response.ok || !data) {
      setError(data?.error ?? "Unable to load login sessions.");
      setLoading(false);
      return;
    }
    setSessions(data.sessions ?? []);
    setCurrentSessionId(data.currentSessionId ?? null);
    setUpgradeRequired(Boolean(data.registryUpgradeRequired));
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    if (loading || upgradeRequired) return;
    const metadata = {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      screen: `${window.screen.width}×${window.screen.height} @${window.devicePixelRatio || 1}x`,
      platform: navigator.platform || "Browser"
    };
    void fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metadata)
    }).then(() => load()).catch(() => undefined);
  }, [loading, upgradeRequired, load]);

  function requestLocation(mode: "approximate" | "precise") {
    setError(null);
    setSyncing(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      setSyncing(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = mode === "approximate"
          ? Number(position.coords.latitude.toFixed(2))
          : position.coords.latitude;
        const longitude = mode === "approximate"
          ? Number(position.coords.longitude.toFixed(2))
          : position.coords.longitude;

        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locationMode: mode,
            latitude,
            longitude,
            accuracy: position.coords.accuracy,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language
          })
        });
        const data = await readJson<{ error?: string }>(response);
        if (!response.ok) setError(data?.error ?? "Unable to save session location.");
        await load();
        setSyncing(false);
      },
      (geoError) => {
        setError(
          geoError.code === geoError.PERMISSION_DENIED
            ? "Location permission was denied. Open browser site settings to change it."
            : "Your location could not be read. Check GPS/network access and try again."
        );
        setSyncing(false);
      },
      { enableHighAccuracy: mode === "precise", timeout: 12000, maximumAge: mode === "precise" ? 0 : 300000 }
    );
  }

  async function clearLocation() {
    setSyncing(true);
    const response = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationMode: "off", latitude: null, longitude: null, accuracy: null })
    });
    if (!response.ok) {
      const data = await readJson<{ error?: string }>(response);
      setError(data?.error ?? "Unable to clear location.");
    }
    await load();
    setSyncing(false);
  }

  async function revoke(id: string) {
    setError(null);
    const response = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
    const data = await readJson<{ current?: boolean; error?: string }>(response);
    if (!response.ok) {
      setError(data?.error ?? "Unable to revoke session.");
      return;
    }
    if (data?.current) {
      router.push("/login");
      router.refresh();
      return;
    }
    await load();
  }

  return (
    <ProductShell title="Login sessions">
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.copy}>
            <span className={styles.eyebrow}>SESSION COMMAND CENTER</span>
            <h1>Your account<br />across the world.</h1>
            <p>
              Inspect active browsers, trusted devices and location permission from one cinematic, privacy-first control center.
            </p>
            <div className={styles.metrics}>
              <div><small>ACTIVE</small><strong>{sessions.filter((item) => !item.revokedAt).length}</strong></div>
              <div><small>CURRENT</small><strong>{current?.deviceType ?? "—"}</strong></div>
              <div><small>LOCATION</small><strong>{current?.locationMode ?? "off"}</strong></div>
            </div>
          </div>

          <div className={styles.globeWrap}>
            <HologramEarth
              compact
              latitude={current?.latitude ?? null}
              longitude={current?.longitude ?? null}
              label={current?.locationMode && current.locationMode !== "off" ? "CURRENT SESSION LOCATED" : "LOCATION LAYER PRIVATE"}
              interactive
              showTelemetry
            />
          </div>
        </section>

        {upgradeRequired && (
          <section className={styles.upgradeNotice}>
            <span><Icon name="info" size={18} /></span>
            <div>
              <strong>One fresh sign-in required</strong>
              <p>Your current token was created before session tracking was added. Sign out and sign in once; future sessions will appear here automatically.</p>
            </div>
            <button type="button" onClick={() => void fetch("/api/auth/logout", { method: "POST" }).then(() => router.push("/login"))}>
              Sign out
            </button>
          </section>
        )}

        <section className={styles.controlGrid}>
          <article className={styles.locationCard}>
            <div className={styles.cardTop}>
              <span className={styles.locationIcon}><Icon name="globe" size={21} /></span>
              <div><small>SESSION LOCATION</small><h2>Choose the precision</h2></div>
            </div>
            <p>Location is attached only to the current login session after your browser grants permission.</p>
            <div className={styles.locationActions}>
              <button type="button" onClick={() => requestLocation("approximate")} disabled={syncing || upgradeRequired}>
                <Icon name="globe" size={16} /> Approximate
              </button>
              <button type="button" onClick={() => requestLocation("precise")} disabled={syncing || upgradeRequired}>
                <Icon name="settings" size={16} /> Precise
              </button>
              <button type="button" onClick={() => void clearLocation()} disabled={syncing || upgradeRequired}>
                <Icon name="block" size={16} /> Off
              </button>
            </div>
            {current?.latitude != null && current?.longitude != null && (
              <div className={styles.coordinateLine}>
                <span><small>LAT</small><strong>{current.latitude.toFixed(current.locationMode === "precise" ? 4 : 2)}</strong></span>
                <span><small>LON</small><strong>{current.longitude.toFixed(current.locationMode === "precise" ? 4 : 2)}</strong></span>
                <span><small>ACCURACY</small><strong>±{Math.round(current.accuracy ?? 0)}m</strong></span>
              </div>
            )}
          </article>

          <article className={styles.privacyCard}>
            <span><Icon name="shield" size={24} /></span>
            <small>PRIVACY GUARANTEE</small>
            <h2>Visible to you, not your contacts.</h2>
            <p>Session location is never placed in a chat, status or public profile. Revoking a session blocks its signed token through Redis.</p>
          </article>
        </section>

        {error && <div className={styles.error}><Icon name="info" size={17} /> {error}</div>}

        <section className={styles.sessionsCard}>
          <div className={styles.sectionHeading}>
            <div><span>TRUSTED ACCESS</span><h2>Login sessions</h2></div>
            <button type="button" onClick={() => void load()} disabled={loading}><Icon name="history" size={15} /> Refresh</button>
          </div>

          {loading ? (
            <div className={styles.skeletons}><i /><i /><i /></div>
          ) : sessions.length === 0 ? (
            <div className={styles.empty}><Icon name="devices" size={28} /><strong>No registered sessions yet</strong><small>Sign in again to register this device.</small></div>
          ) : (
            <div className={styles.sessionList}>
              {sessions.map((item) => (
                <article key={item.id} className={`${item.current ? styles.current : ""} ${item.revokedAt ? styles.revoked : ""}`}>
                  <span className={styles.deviceIcon}><Icon name={deviceIcon(item.deviceType)} size={20} /></span>
                  <div className={styles.identity}>
                    <div>
                      <strong>{item.deviceLabel}</strong>
                      {item.current && <b>CURRENT</b>}
                      {item.revokedAt && <b className={styles.revokedTag}>REVOKED</b>}
                    </div>
                    <small>{item.deviceType} · {item.timezone ?? "Timezone not synced"} · {item.language ?? "Language unknown"}</small>
                    <span>
                      <i /> Last active {formatDate(item.lastSeenAt)}
                      {item.locationMode && item.locationMode !== "off" ? ` · ${item.locationMode} location` : " · location off"}
                    </span>
                  </div>
                  <div className={styles.sessionMeta}>
                    <small>Signed in</small>
                    <strong>{formatDate(item.createdAt)}</strong>
                  </div>
                  {!item.revokedAt && (
                    <button type="button" onClick={() => void revoke(item.id)}>
                      {item.current ? "Sign out" : "Revoke"}
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </ProductShell>
  );
}
