"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WorldGlobe } from "@/components/world-globe/WorldGlobe";
import styles from "./login.module.css";

type Step = "phone" | "otp" | "username";
type Delivery = "manual" | "sms" | "development" | null;
type ApiPayload = {
  error?: string;
  delivery?: Delivery;
  details?: { newAccount?: boolean };
  user?: { role?: "USER" | "ADMIN" };
};
type Country = { code: string; name: string; flag: string; dial: string; maxDigits: number };

const COUNTRIES: Country[] = [
  { code: "IN", name: "India", flag: "🇮🇳", dial: "+91", maxDigits: 10 },
  { code: "US", name: "United States", flag: "🇺🇸", dial: "+1", maxDigits: 10 },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1", maxDigits: 10 },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "+44", maxDigits: 10 },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", dial: "+971", maxDigits: 9 },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61", maxDigits: 9 }
];

async function readPayload(response: Response): Promise<ApiPayload> {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text) as ApiPayload; } catch { return {}; }
}

function BrandMark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M39.8 9.2 33.7 38c-.5 2-1.9 2.5-3.5 1.6l-9.3-6.9-4.5 4.4c-.5.5-.9.9-1.8.9l.6-9.5 17.4-15.7c.8-.7-.2-1.1-1.2-.4L9.9 26.1.6 23.2c-2-.6-2.1-2 .4-3L37.4 6.1c1.7-.6 3.2.4 2.4 3.1Z" fill="currentColor" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7.5 10V7.8a4.5 4.5 0 0 1 9 0V10m-10 0h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [countryCode, setCountryCode] = useState("IN");
  const [nationalNumber, setNationalNumber] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [username, setUsername] = useState("");
  const [delivery, setDelivery] = useState<Delivery>(null);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const country = useMemo(() => COUNTRIES.find((item) => item.code === countryCode) ?? COUNTRIES[0], [countryCode]);
  const phone = `${country.dial}${nationalNumber}`;
  const maskedPhone = nationalNumber ? `${country.dial} •••••• ${nationalNumber.slice(-4).padStart(4, "•")}` : country.dial;

  useEffect(() => {
    if (step !== "otp" && step !== "username") return;
    const timer = window.setInterval(() => setSecondsLeft((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  async function requestCode() {
    setError(null);
    if (nationalNumber.length < Math.min(7, country.maxDigits)) {
      setError("Enter a valid mobile number.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await readPayload(response);
      if (!response.ok) throw new Error(data.error ?? `Unable to request code (${response.status}).`);
      setDelivery(data.delivery ?? null);
      setDigits(["", "", "", "", "", ""]);
      setSecondsLeft(300);
      setStep("otp");
      window.setTimeout(() => inputsRef.current[0]?.focus(), 100);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to request code.");
    } finally {
      setLoading(false);
    }
  }

  async function requestOtp(event: React.FormEvent) {
    event.preventDefault();
    await requestCode();
  }

  async function submitOtp(code: string, chosenUsername?: string) {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, username: chosenUsername })
      });
      const data = await readPayload(response);
      if (!response.ok) {
        if (data.details?.newAccount) {
          if (step === "username") setError(data.error ?? "Choose a different username.");
          setStep("username");
          return;
        }
        throw new Error(data.error ?? `Verification failed (${response.status}).`);
      }
      router.push(data.user?.role === "ADMIN" ? "/admin" : "/chat");
      router.refresh();
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
    if (next.every((digit) => digit.length === 1)) void submitOtp(next.join(""));
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) inputsRef.current[index - 1]?.focus();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const code = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) return;
    event.preventDefault();
    setDigits(code.split(""));
    void submitOtp(code);
  }

  function changeNumber() {
    setStep("phone");
    setDigits(["", "", "", "", "", ""]);
    setError(null);
  }

  const countdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <main className={styles.shell}>
      <section className={styles.hero} aria-hidden="true">
        <div className={styles.aurora} />
        <div className={styles.grid} />
        <div className={styles.heroCopy}>
          <div className={styles.brandLine}>
            <span className={styles.heroLogo}><BrandMark /></span>
            <span><strong>IPChat</strong><small>Private messenger</small></span>
          </div>
          <p className={styles.kicker}>CONNECTED. PRIVATE. YOURS.</p>
          <h1>Your world,<br />one private conversation away.</h1>
          <p className={styles.heroDescription}>
            A fast, expressive messenger with private identity, disappearing moments and owner-controlled safety.
          </p>
          <div className={styles.heroTrust}>
            <span><i /> Protected storage</span>
            <span><i /> Private phone identity</span>
            <span><i /> Audited safety access</span>
          </div>
        </div>
        <div className={styles.globeStage}><WorldGlobe label="Global private network" /></div>
      </section>

      <section className={styles.panel}>
        <form
          className={styles.card}
          onSubmit={
            step === "phone" ? requestOtp :
            step === "username" ? (event) => { event.preventDefault(); void submitOtp(digits.join(""), username); } :
            (event) => event.preventDefault()
          }
        >
          <div className={styles.mobileBrand}>
            <div className={styles.logo}><BrandMark /></div>
            <div><strong>IPChat</strong><span>Private messenger</span></div>
          </div>

          {step === "phone" && (
            <div className={styles.step} key="phone">
              <div className={styles.heading}>
                <span className={styles.stepPill}>Welcome</span>
                <h2>Sign in securely</h2>
                <p>Select your country and enter your mobile number. Your number is never shown to other users.</p>
              </div>

              <label className={styles.fieldLabel} htmlFor="country">Country</label>
              <div className={styles.countryField}>
                <span className={styles.countryFlag}>{country.flag}</span>
                <select id="country" value={countryCode} onChange={(event) => { setCountryCode(event.target.value); setNationalNumber(""); }}>
                  {COUNTRIES.map((item) => (
                    <option key={item.code} value={item.code}>{item.name} ({item.dial})</option>
                  ))}
                </select>
                <span className={styles.selectArrow}>⌄</span>
              </div>

              <label className={styles.fieldLabel} htmlFor="phone">Mobile number</label>
              <div className={styles.phoneField}>
                <span className={styles.dialCode}>{country.dial}</span>
                <input
                  id="phone"
                  placeholder="98765 43210"
                  value={nationalNumber}
                  onChange={(event) => { setNationalNumber(event.target.value.replace(/\D/g, "").slice(0, country.maxDigits)); setError(null); }}
                  inputMode="tel"
                  autoComplete="tel-national"
                  autoFocus
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}
              <button className={styles.primaryButton} disabled={loading || nationalNumber.length < 7}>
                {loading ? <span className={styles.spinner} /> : "Continue"}
              </button>
              <div className={styles.securityNote}>
                <LockIcon />
                <span>Phone number hidden from everyone except secure verification systems.</span>
              </div>
            </div>
          )}

          {step === "otp" && (
            <div className={styles.step} key="otp">
              <button type="button" className={styles.backButton} onClick={changeNumber}>← Change number</button>
              <div className={styles.heading}>
                <span className={styles.stepPill}>Verification</span>
                <h2>Enter your code</h2>
                <p>We requested a 6-digit code for <strong>{maskedPhone}</strong>.</p>
              </div>

              {delivery === "manual" && (
                <div className={styles.deliveryNote}>
                  <span className={styles.deliveryDot} />
                  <div><strong>Request received</strong><small>The administrator will send your code manually.</small></div>
                </div>
              )}

              <div className={styles.otpRow}>
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { inputsRef.current[index] = element; }}
                    className={styles.otpDigit}
                    value={digit}
                    onChange={(event) => handleDigitChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={handlePaste}
                    inputMode="numeric"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={1}
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </div>

              <div className={styles.timer}>Code expires in <strong>{countdown}</strong></div>
              {error && <div className={styles.error}>{error}</div>}
              {loading && <div className={styles.verifying}><span className={styles.spinnerDark} /> Verifying code…</div>}
              <button type="button" className={styles.textButton} disabled={loading || secondsLeft > 240} onClick={() => void requestCode()}>
                Resend code
              </button>
            </div>
          )}

          {step === "username" && (
            <div className={styles.step} key="username">
              <div className={styles.heading}>
                <span className={styles.stepPill}>Almost done</span>
                <h2>Create your private identity</h2>
                <p>Your username is public. Your phone number stays private.</p>
              </div>
              <label className={styles.fieldLabel} htmlFor="username">Username</label>
              <div className={styles.usernameField}>
                <span>@</span>
                <input
                  id="username"
                  placeholder="yourname"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))}
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <small className={styles.hint}>3–20 characters · letters, numbers and underscore</small>
              {error && <div className={styles.error}>{error}</div>}
              <button className={styles.primaryButton} disabled={loading || username.length < 3}>
                {loading ? <span className={styles.spinner} /> : "Create account"}
              </button>
            </div>
          )}
          <p className={styles.footerNote}>By continuing, you agree to use IPChat responsibly.</p>
        </form>
      </section>
    </main>
  );
}
