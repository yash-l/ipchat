import { NextRequest } from "next/server";
import { verifyOtp, hashPhone, lastFourDigits } from "@/lib/otp";
import { removeAdminOtpByPhone } from "@/lib/admin-otp";
import { createSession, setSessionCookie } from "@/lib/session";
import { db } from "@/lib/db";
import { verifyOtpSchema } from "@/lib/validators";
import { parseBody } from "@/lib/parse-body";
import { ApiResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/redis";

const resultMessages: Record<string, string> = {
  expired_or_missing: "Code expired or not found. Request a new one.",
  too_many_attempts: "Too many incorrect attempts. Request a new code.",
  incorrect: "Incorrect code. Please try again."
};

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, verifyOtpSchema);
  if (!parsed.ok) return parsed.response;
  const { phone, code, username } = parsed.data;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipOk = await rateLimit(`ratelimit:verify:ip:${ip}`, 20, 600);
  if (!ipOk) return ApiResponse.rateLimited();

  const phoneHash = hashPhone(phone);
  let user = await db.user.findUnique({ where: { phoneHash } });

  if (!user) {
    // First validate without consuming so a new user can choose a username
    // without needing a second OTP.
    const firstCheck = await verifyOtp(phone, code, { consume: false });
    if (firstCheck !== "ok") return ApiResponse.error(resultMessages[firstCheck], 400);

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

    const consumeResult = await verifyOtp(phone, code);
    if (consumeResult !== "ok") return ApiResponse.error(resultMessages[consumeResult], 400);

    const ownerPhone = process.env.OWNER_PHONE_E164?.trim();
    user = await db.user.create({
      data: {
        username,
        displayName: username,
        phoneHash,
        phoneLast4: lastFourDigits(phone),
        role: ownerPhone && phone === ownerPhone ? "ADMIN" : "USER"
      }
    });
  } else {
    const result = await verifyOtp(phone, code);
    if (result !== "ok") return ApiResponse.error(resultMessages[result], 400);

    if (user.isBanned) {
      return ApiResponse.forbidden("This account is suspended. Contact support if you believe this is a mistake.");
    }

    const ownerPhone = process.env.OWNER_PHONE_E164?.trim();
    const shouldBeAdmin = Boolean(ownerPhone && phone === ownerPhone);
    user = await db.user.update({
      where: { id: user.id },
      data: {
        lastSeenAt: new Date(),
        ...(shouldBeAdmin && user.role !== "ADMIN" ? { role: "ADMIN" as const } : {})
      }
    });
  }

  await removeAdminOtpByPhone(phone).catch(() => undefined);

  const token = await createSession({ userId: user.id, role: user.role, username: user.username });
  await setSessionCookie(token);

  return ApiResponse.success({
    user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role }
  });
}
