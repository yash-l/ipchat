import { NextRequest } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { ApiResponse } from "@/lib/api-response";
import { getExpectedOrigin, getRpId, transportsToString } from "@/lib/passkey";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();
  const challenge = await redis.get<string>(`passkey:register:${session.userId}`);
  if (!challenge) return ApiResponse.error("Passkey setup expired. Start again.", 400);

  const body = await req.json().catch(() => null) as { response?: any; name?: string } | null;
  if (!body?.response) return ApiResponse.error("Passkey response is missing.", 400);

  const verification = await verifyRegistrationResponse({
    response: body.response,
    expectedChallenge: challenge,
    expectedOrigin: getExpectedOrigin(req),
    expectedRPID: getRpId(req),
    requireUserVerification: true
  });
  if (!verification.verified || !verification.registrationInfo) return ApiResponse.error("Passkey verification failed.", 400);

  const info: any = verification.registrationInfo;
  const credential = info.credential ?? {
    id: info.credentialID,
    publicKey: info.credentialPublicKey,
    counter: info.counter,
    transports: body.response.response?.transports
  };

  await db.passkey.create({
    data: {
      userId: session.userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter || 0),
      transports: transportsToString(credential.transports || body.response.response?.transports),
      deviceType: info.credentialDeviceType || null,
      backedUp: Boolean(info.credentialBackedUp),
      name: body.name?.trim().slice(0, 40) || "This device"
    }
  });
  await redis.del(`passkey:register:${session.userId}`);
  return ApiResponse.success({ created: true });
}
