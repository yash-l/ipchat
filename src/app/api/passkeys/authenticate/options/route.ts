import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { redis, rateLimit } from "@/lib/redis";
import { ApiResponse } from "@/lib/api-response";
import { getRpId } from "@/lib/passkey";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await rateLimit(`ratelimit:passkey:options:${ip}`, 30, 600))) return ApiResponse.rateLimited();
  const options = await generateAuthenticationOptions({
    rpID: getRpId(req),
    userVerification: "required",
    allowCredentials: []
  });
  const flowId = randomUUID();
  await redis.set(`passkey:auth:${flowId}`, options.challenge, { ex: 300 });
  return ApiResponse.success({ flowId, options });
}
