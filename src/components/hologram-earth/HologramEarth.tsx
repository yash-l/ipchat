"use client";

import { useEffect, useMemo, useRef } from "react";
import styles from "./hologram-earth.module.css";

type HologramEarthProps = {
  compact?: boolean;
  label?: string;
  latitude?: number | null;
  longitude?: number | null;
  interactive?: boolean;
  showTelemetry?: boolean;
};

type Tilt = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function HologramEarth({
  compact = false,
  label = "GLOBAL PRIVATE NETWORK",
  latitude = null,
  longitude = null,
  interactive = true,
  showTelemetry = true
}: HologramEarthProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<Tilt>({ x: -4, y: 8 });
  const currentRef = useRef<Tilt>({ x: -4, y: 8 });
  const pointerRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const marker = useMemo(() => {
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return { x: 393, y: 246, active: false };
    }

    // Equirectangular projection, visually constrained to the hologram sphere.
    const normalizedX = clamp((longitude + 180) / 360, 0.08, 0.92);
    const normalizedY = clamp((90 - latitude) / 180, 0.1, 0.9);
    return {
      x: 120 + normalizedX * 360,
      y: 120 + normalizedY * 360,
      active: true
    };
  }, [latitude, longitude]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    let frame = 0;
    let running = true;
    const animate = () => {
      if (!running) return;
      const current = currentRef.current;
      const target = targetRef.current;
      current.x += (target.x - current.x) * 0.075;
      current.y += (target.y - current.y) * 0.075;
      node.style.setProperty("--tilt-x", `${current.x.toFixed(3)}deg`);
      node.style.setProperty("--tilt-y", `${current.y.toFixed(3)}deg`);
      frame = window.requestAnimationFrame(animate);
    };

    frame = window.requestAnimationFrame(animate);
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };
  }, []);

  function updateFromPointer(clientX: number, clientY: number) {
    if (!interactive || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((clientY - rect.top) / rect.height, 0, 1);
    targetRef.current = {
      x: (0.5 - y) * 18,
      y: (x - 0.5) * 24
    };
  }

  return (
    <div
      ref={rootRef}
      className={`${styles.root} ${compact ? styles.compact : ""} ${interactive ? styles.interactive : ""}`}
      onPointerDown={(event) => {
        if (!interactive) return;
        pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (!interactive) return;
        if (pointerRef.current && pointerRef.current.id !== event.pointerId) return;
        updateFromPointer(event.clientX, event.clientY);
      }}
      onPointerUp={(event) => {
        if (pointerRef.current?.id === event.pointerId) pointerRef.current = null;
        targetRef.current = { x: -4, y: 8 };
      }}
      onPointerCancel={() => {
        pointerRef.current = null;
        targetRef.current = { x: -4, y: 8 };
      }}
      onPointerLeave={() => {
        if (!pointerRef.current) targetRef.current = { x: -4, y: 8 };
      }}
      aria-label="Interactive holographic world globe"
      role="img"
    >
      <div className={styles.ambient} />
      <div className={styles.hudRingOuter}><i /><i /><i /><i /></div>
      <div className={styles.hudRingMiddle} />
      <div className={styles.hudRingInner} />

      <div className={styles.stage}>
        <svg className={styles.earth} viewBox="0 0 600 600" aria-hidden="true">
          <defs>
            <radialGradient id="earthCore" cx="35%" cy="27%" r="75%">
              <stop offset="0%" stopColor="#9af7ff" stopOpacity=".34" />
              <stop offset="22%" stopColor="#25dfff" stopOpacity=".2" />
              <stop offset="58%" stopColor="#1368e8" stopOpacity=".18" />
              <stop offset="100%" stopColor="#03142c" stopOpacity=".94" />
            </radialGradient>
            <linearGradient id="landStroke" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#d6ffff" />
              <stop offset=".36" stopColor="#55f5ff" />
              <stop offset="1" stopColor="#3979ff" />
            </linearGradient>
            <linearGradient id="scanGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#8affff" stopOpacity="0" />
              <stop offset=".49" stopColor="#8affff" stopOpacity=".08" />
              <stop offset=".5" stopColor="#ffffff" stopOpacity=".85" />
              <stop offset=".51" stopColor="#42eaff" stopOpacity=".12" />
              <stop offset="1" stopColor="#42eaff" stopOpacity="0" />
            </linearGradient>
            <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="microGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <clipPath id="sphereClip"><circle cx="300" cy="300" r="190" /></clipPath>
            <pattern id="scanlines" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M0 1.5H5" stroke="#8fffff" strokeOpacity=".08" strokeWidth="1" />
            </pattern>
          </defs>

          <g className={styles.shadowOrbit}>
            <ellipse cx="300" cy="310" rx="266" ry="83" />
            <ellipse cx="300" cy="310" rx="246" ry="68" />
          </g>

          <circle className={styles.coreHalo} cx="300" cy="300" r="215" />
          <circle className={styles.sphere} cx="300" cy="300" r="190" fill="url(#earthCore)" />

          <g clipPath="url(#sphereClip)">
            <rect x="105" y="105" width="390" height="390" fill="url(#scanlines)" />

            <g className={styles.graticule}>
              <ellipse cx="300" cy="300" rx="190" ry="52" />
              <ellipse cx="300" cy="300" rx="190" ry="102" />
              <ellipse cx="300" cy="300" rx="190" ry="148" />
              <ellipse cx="300" cy="300" rx="52" ry="190" />
              <ellipse cx="300" cy="300" rx="102" ry="190" />
              <ellipse cx="300" cy="300" rx="148" ry="190" />
              <path d="M111 300H489" />
              <path d="M300 111V489" />
            </g>

            <g className={styles.continents} filter="url(#microGlow)">
              <path d="M167 192l29-25 42-8 31 9 12 18-13 18-25 4-9 17-22 4-6 22-22 8-20-12-5-23-18-12 7-18Z" />
              <path d="M224 257l22 7 18 21-1 25 18 21-8 23 9 21-17 28-13 33-20-8-5-29-15-21 3-31-15-27 8-35 16-28Z" />
              <path d="M294 172l31-18 48 5 22 16 41 2 17 20-12 20-31 2-16 18-26-6-18 13-25-7-16-22-23-5 8-38Z" />
              <path d="M334 242l37 3 27 24 3 37-17 23-8 41-25 31-24-18-11-41-16-26 6-36 28-38Z" />
              <path d="M409 352l31 7 18 25-14 22-31 3-19-20 15-37Z" />
              <path d="M403 205l17-13 24 9-5 18-22 3-14-17Z" />
            </g>

            <g className={styles.networkLines}>
              <path d="M188 235C254 198 318 201 394 247" />
              <path d="M245 347C304 303 355 299 432 365" />
              <path d="M223 255C271 307 312 341 364 384" />
              <path d="M342 219C323 276 330 330 385 371" />
              <circle cx="188" cy="235" r="3" />
              <circle cx="245" cy="347" r="3" />
              <circle cx="342" cy="219" r="3" />
              <circle cx="394" cy="247" r="3" />
              <circle cx="432" cy="365" r="3" />
              <circle cx="364" cy="384" r="3" />
            </g>

            <rect className={styles.scanBeam} x="100" y="95" width="400" height="90" fill="url(#scanGradient)" />
            <path className={styles.specular} d="M180 152C232 111 324 99 389 145" />
          </g>

          <circle className={styles.sphereOutline} cx="300" cy="300" r="190" />
          <circle className={styles.sphereOutlineFaint} cx="300" cy="300" r="203" />

          <g
            className={`${styles.marker} ${marker.active ? styles.markerActive : ""}`}
            transform={`translate(${marker.x} ${marker.y})`}
            filter="url(#softGlow)"
          >
            <circle r="18" className={styles.markerWave} />
            <circle r="9" className={styles.markerOuter} />
            <circle r="3.5" className={styles.markerCore} />
            <path d="M0 10V51" className={styles.markerStem} />
          </g>
        </svg>

        <div className={styles.equatorBeam} />
        <div className={styles.verticalBeam} />
      </div>

      <div className={styles.reticle}><span /><span /><span /><span /></div>

      {showTelemetry && (
        <>
          <div className={`${styles.telemetry} ${styles.telemetryLeft}`}>
            <small>SESSION GRID</small>
            <strong>ONLINE</strong>
            <span><i /> encrypted channel</span>
          </div>
          <div className={`${styles.telemetry} ${styles.telemetryRight}`}>
            <small>LOCATION LAYER</small>
            <strong>{marker.active ? "ACTIVE" : "PRIVATE"}</strong>
            <span>{marker.active ? "permission granted" : "no coordinates shared"}</span>
          </div>
        </>
      )}

      <div className={styles.label}><i />{label}</div>
      {interactive && <div className={styles.dragHint}>DRAG TO INSPECT</div>}
    </div>
  );
}
