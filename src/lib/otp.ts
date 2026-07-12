import crypto from "crypto";
import { redis } from "./redis";

const OTP_TTL_SECONDS = 5 * 60;
const MAX_ATTEMPTS = 5;

function getSecret(): string {
  const secret = process.env.PHONE_HASH_SECRET;
  if (!secret) {
    throw new Error(
      "PHONE_HASH_SECRET is not set. Generate one with `openssl rand -hex 32` and add it to your .env"
    );
  }
  return secret;
}

/** Deterministic, keyed hash of a phone number. Never store raw phone numbers. */
export function hashPhone(phoneE164: string): string {
  return crypto.createHmac("sha256", getSecret()).update(phoneE164).digest("hex");
}

export function lastFourDigits(phoneE164: string): string {
  return phoneE164.replace(/\D/g, "").slice(-4);
}

function hashCode(code: string, phoneHash: string): string {
  // Salting with the phoneHash means two users who happen to get the same
  // 6-digit code don't produce the same stored value.
  return crypto.createHash("sha256").update(`${code}:${phoneHash}:${getSecret()}`).digest("hex");
}

function otpKey(phoneHash: string): string {
  return `otp:${phoneHash}`;
}

export function generateOtpCode(): string {
  // 6-digit code, zero-padded. crypto.randomInt is CSPRNG-backed.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Creates and stores a new OTP for a phone number, returns the plaintext code to send via SMS. */
export async function issueOtp(phoneE164: string): Promise<string> {
  const phoneHash = hashPhone(phoneE164);
  const code = generateOtpCode();
  const record = JSON.stringify({ codeHash: hashCode(code, phoneHash), attempts: 0 });
  await redis.set(otpKey(phoneHash), record, { ex: OTP_TTL_SECONDS });
  return code;
}

export type OtpVerifyResult = "ok" | "expired_or_missing" | "too_many_attempts" | "incorrect";

export async function verifyOtp(phoneE164: string, code: string): Promise<OtpVerifyResult> {
  const phoneHash = hashPhone(phoneE164);
  const key = otpKey(phoneHash);
  const raw = await redis.get<string>(key);
  if (!raw) return "expired_or_missing";

  const record = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (record.attempts >= MAX_ATTEMPTS) {
    await redis.del(key);
    return "too_many_attempts";
  }

  if (record.codeHash !== hashCode(code, phoneHash)) {
    record.attempts += 1;
    await redis.set(key, JSON.stringify(record), { ex: OTP_TTL_SECONDS });
    return "incorrect";
  }

  await redis.del(key); // one-time use
  return "ok";
}
