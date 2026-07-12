import crypto from "crypto";

const PREFIX = "ipchat:v1";
const IV_BYTES = 12;

function decodeKey(secret: string): Buffer {
  const trimmed = secret.trim();
  const key = /^[a-f0-9]{64}$/i.test(trimmed) ? Buffer.from(trimmed, "hex") : Buffer.from(trimmed, "base64");

  if (key.length !== 32) {
    throw new Error("MESSAGE_ENCRYPTION_KEY must be a 32-byte key encoded as 64 hex characters or base64.");
  }

  return key;
}

function getEncryptionKey(): Buffer {
  const configured = process.env.MESSAGE_ENCRYPTION_KEY;
  if (configured) return decodeKey(configured);

  if (process.env.NODE_ENV === "production") {
    throw new Error("MESSAGE_ENCRYPTION_KEY is required in production.");
  }

  // Local-development fallback only. Production must use a dedicated key.
  return crypto.createHash("sha256").update(process.env.JWT_SECRET ?? "ipchat-local-development-key").digest();
}

export function encryptMessageContent(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(":");
}

export function decryptMessageContent(value: string | null): string | null {
  if (!value || !value.startsWith(`${PREFIX}:`)) return value;

  const parts = value.split(":");
  if (parts.length !== 5) return "[Unable to decrypt message]";

  try {
    const [, , ivPart, tagPart, ciphertextPart] = parts;
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivPart, "base64url"));
    decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextPart, "base64url")),
      decipher.final()
    ]).toString("utf8");
  } catch {
    return "[Unable to decrypt message]";
  }
}
