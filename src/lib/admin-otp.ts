import { redis } from "./redis";
import { hashPhone, lastFourDigits } from "./otp";

const OTP_INDEX_KEY = "admin:otp:index";
const OTP_TTL_SECONDS = 5 * 60;

export type AdminOtpStatus = "PENDING" | "SENT";

export interface AdminOtpRecord {
  phoneHash: string;
  phone: string;
  phoneLast4: string;
  code: string;
  status: AdminOtpStatus;
  createdAt: string;
  expiresAt: string;
  sentAt: string | null;
}

function recordKey(phoneHash: string): string {
  return `admin:otp:record:${phoneHash}`;
}

export async function saveAdminOtp(phone: string, code: string): Promise<void> {
  const phoneHash = hashPhone(phone);
  const now = Date.now();
  const record: AdminOtpRecord = {
    phoneHash,
    phone,
    phoneLast4: lastFourDigits(phone),
    code,
    status: "PENDING",
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + OTP_TTL_SECONDS * 1000).toISOString(),
    sentAt: null
  };

  await Promise.all([
    redis.set(recordKey(phoneHash), record, { ex: OTP_TTL_SECONDS }),
    redis.sadd(OTP_INDEX_KEY, phoneHash)
  ]);
}

export async function listAdminOtps(): Promise<AdminOtpRecord[]> {
  const hashes = await redis.smembers<string[]>(OTP_INDEX_KEY);
  if (hashes.length === 0) return [];

  const records = await Promise.all(hashes.map((phoneHash) => redis.get<AdminOtpRecord>(recordKey(phoneHash))));
  const now = Date.now();
  const staleHashes: string[] = [];
  const active: AdminOtpRecord[] = [];

  records.forEach((record, index) => {
    if (!record || new Date(record.expiresAt).getTime() <= now) {
      staleHashes.push(hashes[index]);
      return;
    }
    active.push(record);
  });

  if (staleHashes.length > 0) {
    await redis.srem(OTP_INDEX_KEY, ...staleHashes);
  }

  return active.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function markAdminOtpSent(phoneHash: string): Promise<AdminOtpRecord | null> {
  const key = recordKey(phoneHash);
  const record = await redis.get<AdminOtpRecord>(key);
  if (!record) {
    await redis.srem(OTP_INDEX_KEY, phoneHash);
    return null;
  }

  const ttl = await redis.ttl(key);
  if (ttl <= 0) {
    await removeAdminOtp(phoneHash);
    return null;
  }

  const updated: AdminOtpRecord = {
    ...record,
    status: "SENT",
    sentAt: new Date().toISOString()
  };

  await redis.set(key, updated, { ex: ttl });
  return updated;
}

export async function removeAdminOtp(phoneHash: string): Promise<void> {
  await Promise.all([redis.del(recordKey(phoneHash)), redis.srem(OTP_INDEX_KEY, phoneHash)]);
}

export async function removeAdminOtpByPhone(phone: string): Promise<void> {
  await removeAdminOtp(hashPhone(phone));
}
