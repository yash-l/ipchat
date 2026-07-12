import { NextRequest } from "next/server";
import { verifyOtp, hashPhone, lastFourDigits } from "@/lib/otp";
import { createSession, setSessionCookie } from "@/lib/session";
import { db } from "@/lib/db";
import { verifyOtpSchema } from "@/lib/validators";
import { parseBody } from "@/lib/parse-body";
import { ApiResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/redis";

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, verifyOtpSchema);
  if (!parsed.ok) return parsed.response;
  const { phone, code, username } = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipOk = await rateLimit(`ratelimit:verify:ip:${ip}`, 20, 600);
  if (!ipOk) return ApiResponse.rateLimited();

  const result = await verifyOtp(phone, code);
  if (result !== "ok") {
    const messages: Record<string, string> = {
      expired_or_missing: "Code expired or not found. Request a new one.",
      too_many_attempts: "Too many incorrect attempts. Request a new code.",
      incorrect: "Incorrect code. Please try again."
    };
    return ApiResponse.error(messages[result], 400);
  }

  const phoneHash = hashPhone(phone);
  let user = await db.user.findUnique({ where: { phoneHash } });

  if (!user) {
    // First-time login — username required for new accounts (the identifier
    // other users see; the phone number itself is never shown/searchable).
    if (!username) {
      return ApiResponse.error(
        "New account: pick a username (3-20 chars, letters/numbers/underscore).",
        422,
        { newAccount: true }
      );
    }

    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return ApiResponse.error("That username is taken.", 409, { newAccount: true });
    }

    user = await db.user.create({
      data: { username, displayName: username, phoneHash, phoneLast4: lastFourDigits(phone) }
    });
  } else {
    await db.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } });
  }

  const token = await createSession({ userId: user.id, role: user.role, username: user.username });
  await setSessionCookie(token);

  return ApiResponse.success({
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role }
  });
}
