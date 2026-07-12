import { NextRequest } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import { ApiResponse } from "@/lib/api-response";
import { getRpId, stringToTransports } from "@/lib/passkey";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();
  const user = await db.user.findUnique({ where: { id: session.userId }, include: { passkeys: true } });
  if (!user) return ApiResponse.unauthorized();

  const options = await generateRegistrationOptions({
    rpName: "IPChat",
    rpID: getRpId(req),
    userName: user.username,
    userDisplayName: user.displayName,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required"
    },
    excludeCredentials: user.passkeys.map((key) => ({
      id: key.credentialId,
      transports: stringToTransports(key.transports)
    }))
  });

  await redis.set(`passkey:register:${user.id}`, options.challenge, { ex: 300 });
  return ApiResponse.success({ options });
}
