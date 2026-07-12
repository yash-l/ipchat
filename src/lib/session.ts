import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";

const COOKIE_NAME = "session";
const SESSION_TTL = "30d";
const ISSUER = "messenger-app";
const AUDIENCE = "messenger-app-users";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set. Generate one with `openssl rand -hex 32`.");
  }
  return new TextEncoder().encode(secret);
}

const sessionPayloadSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
  username: z.string().min(1)
});

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime(SESSION_TTL)
    .sign(getSecretKey());
}

export async function setSessionCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

/** Verifies signature, alg, issuer, audience, and expiry, then validates the
 *  payload shape at runtime — a cryptographically valid but malformed/stale
 *  token (e.g. from an older schema) is rejected rather than trusted as-is. */
async function verify(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE
    });
    const parsed = sessionPayloadSchema.safeParse(payload);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verify(token);
}

/** For middleware (edge runtime) — verifies a raw token string without next/headers. */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  return verify(token);
}

export { COOKIE_NAME };
