"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Step = "phone" | "otp" | "username";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) return setError(data.error);
    setStep("otp");
  }

  async function submitOtp(code: string, chosenUsername?: string) {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, username: chosenUsername })
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data.details?.newAccount) {
        setStep("username");
        return;
      }
      setError(data.error);
      return;
    }
    router.push("/chat");
  }

  function handleDigitChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
    if (next.every((d) => d.length === 1)) submitOtp(next.join(""));
  }

  return (
    <div className="auth-shell">
      <form
        className="card auth-card"
        onSubmit={
          step === "phone"
            ? requestOtp
            : step === "username"
              ? (e) => {
                  e.preventDefault();
                  submitOtp(digits.join(""), username);
                }
              : (e) => e.preventDefault()
        }
      >
        {step === "phone" && (
          <>
            <h1 className="auth-title">Sign in</h1>
            <p className="auth-subtitle">
              We'll text you a 6-digit code. Your number is only ever stored as a one-way hash — not in
              plaintext.
            </p>
            <input
              className="input input-mono"
              placeholder="+14155551234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoFocus
            />
            {error && <span className="field-error">{error}</span>}
            <button className="btn btn-accent" disabled={loading || !phone}>
              {loading ? "Sending…" : "Send code"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <h1 className="auth-title">Enter code</h1>
            <p className="auth-subtitle">Sent to {phone}. Expires in 5 minutes.</p>
            <div className="otp-input">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  className="input input-mono otp-digit"
                  value={d}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  inputMode="numeric"
                  maxLength={1}
                  autoFocus={i === 0}
                />
              ))}
            </div>
            {error && <span className="field-error">{error}</span>}
            {loading && <span className="auth-subtitle">Verifying…</span>}
            <button type="button" className="btn btn-ghost" onClick={() => setStep("phone")}>
              Use a different number
            </button>
          </>
        )}

        {step === "username" && (
          <>
            <h1 className="auth-title">Choose a username</h1>
            <p className="auth-subtitle">
              This is what other people see and search for — your phone number is never shown.
            </p>
            <input
              className="input"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            {error && <span className="field-error">{error}</span>}
            <button className="btn btn-accent" disabled={loading || !username}>
              {loading ? "Creating…" : "Create account"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
