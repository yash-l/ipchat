import { NextRequest } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { redis, rateLimit } from "@/lib/redis";
import { ApiResponse } from "@/lib/api-response";
import { createSession, setSessionCookie } from "@/lib/session";
import { parseDeviceInfo } from "@/lib/device-info";
import { getExpectedOrigin, getRpId, stringToTransports } from "@/lib/passkey";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`ratelimit:passkey:verify:${ip}`, 20, 600))) return ApiResponse.rateLimited();
  const body = await req.json().catch(() => null) as { flowId?: string; response?: any } | null;
  if (!body?.flowId || !body.response?.id) return ApiResponse.error("Passkey response is incomplete.", 400);
  const challenge = await redis.get<string>(`passkey:auth:${body.flowId}`);
  if (!challenge) return ApiResponse.error("Passkey request expired. Try again.", 400);

  const passkey = await db.passkey.findUnique({ where: { credentialId: body.response.id }, include: { user: true } });
  if (!passkey || passkey.user.isBanned) return ApiResponse.error("Passkey is not available for this account.", 403);

  const verification = await verifyAuthenticationResponse({
    response: body.response,
    expectedChallenge: challenge,
    expectedOrigin: getExpectedOrigin(req),
    expectedRPID: getRpId(req),
    requireUserVerification: true,
    authenticator: {
      credentialID: passkey.credentialId,
      credentialPublicKey: new Uint8Array(passkey.publicKey),
      counter: Number(passkey.counter),
      transports: stringToTransports(passkey.transports)
    }
  });
  if (!verification.verified) return ApiResponse.error("Passkey verification failed.", 401);

  const userAgent = req.headers.get("user-agent") || "Unknown browser";
  const device = parseDeviceInfo(userAgent);
  const loginSession = await db.loginSession.create({
    data: { userId: passkey.user.id, userAgent, deviceLabel: device.deviceLabel, deviceType: device.deviceType, browser: device.browser, os: device.os }
  });
  await db.passkey.update({ where: { id: passkey.id }, data: { counter: BigInt(verification.authenticationInfo.newCounter), lastUsedAt: new Date() } });
  await redis.del(`passkey:auth:${body.flowId}`);

  const token = await createSession({ userId: passkey.user.id, role: passkey.user.role, username: passkey.user.username, sessionId: loginSession.id });
  await setSessionCookie(token);
  return ApiResponse.success({ user: { role: passkey.user.role, username: passkey.user.username } });
}
