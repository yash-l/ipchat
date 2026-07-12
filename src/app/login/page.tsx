"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Step = "phone" | "otp" | "username";
type Delivery = "manual" | "sms" | "development" | null;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [username, setUsername] = useState("");
  const [delivery, setDelivery] = useState<Delivery>(null);
  const [secondsLeft, setSecondsLeft] = useState(300);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step !== "otp" && step !== "username") return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [step]);

  async function requestCode() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to request code.");
      setDelivery((data.delivery as Delivery) ?? null);
      setDigits(["", "", "", "", "", ""]);
      setSecondsLeft(300);
      setStep("otp");
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
    setError(null);
    setLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, username: chosenUsername })
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.details?.newAccount) {
          if (step === "username") setError(data.error ?? "Choose a different username.");
          setStep("username");
          return;
        }
        throw new Error(data.error ?? "Verification failed.");
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
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const code = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (code.length !== 6) return;
    event.preventDefault();
    const next = code.split("");
    setDigits(next);
    void submitOtp(code);
  }

  const countdown = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}`;

  return (
    <div className="auth-shell">
      <form
        className="card auth-card"
        onSubmit={
          step === "phone"
            ? requestOtp
            : step === "username"
              ? (event) => {
                  event.preventDefault();
                  void submitOtp(digits.join(""), username);
                }
              : (event) => event.preventDefault()
        }
      >
        <div className="admin-v2-brand" style={{ padding: 0 }}>
          <div className="admin-v2-logo">IP</div>
          <div><strong>IPChat</strong><span>Private web messenger</span></div>
        </div>

        {step === "phone" && (
          <>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Enter your number in international format. It is stored only as a one-way hash.</p>
            <input
              className="input input-mono"
              placeholder="+917069316260"
              value={phone}
              onChange={(event) => setPhone(event.target.value.trim())}
              inputMode="tel"
              autoComplete="tel"
              autoFocus
            />
            {error && <span className="field-error">{error}</span>}
            <button className="btn btn-accent" disabled={loading || !phone}>
              {loading ? "Requesting…" : "Request login code"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <h1 className="auth-title">Enter verification code</h1>
            <p className="auth-subtitle">Requested for {phone}. Code expires in {countdown}.</p>
            {delivery === "manual" && (
              <div className="delivery-note">
                <strong>Request received</strong>
                The administrator will send your code manually. Keep this page open.
              </div>
            )}
            <div className="otp-input">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { inputsRef.current[index] = element; }}
                  className="input input-mono otp-digit"
                  value={digit}
                  onChange={(event) => handleDigitChange(index, event.target.value)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={handlePaste}
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            {error && <span className="field-error">{error}</span>}
            {loading && <span className="auth-subtitle">Verifying…</span>}
            <div className="auth-inline-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep("phone")}>Change number</button>
              <button type="button" className="btn btn-ghost" disabled={loading || secondsLeft > 240} onClick={() => void requestCode()}>Resend</button>
            </div>
          </>
        )}

        {step === "username" && (
          <>
            <h1 className="auth-title">Choose your username</h1>
            <p className="auth-subtitle">This is your public identity. Your phone number is never shown to other users.</p>
            <input
              className="input"
              placeholder="username"
              value={username}
              onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20))}
              autoComplete="username"
              autoFocus
            />
            {error && <span className="field-error">{error}</span>}
            <button className="btn btn-accent" disabled={loading || username.length < 3}>
              {loading ? "Creating account…" : "Create account"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
