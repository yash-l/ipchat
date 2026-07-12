import { Redis } from "@upstash/redis";
import { env } from "./env";

// Upstash's REST client — no persistent socket, so it works fine inside
// serverless functions (Vercel/Render) on the free tier, unlike a raw
// ioredis/TCP client which can leak connections across invocations.
export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN
});

// INCR then EXPIRE as two separate round-trips leaves a window where, if the
// process dies or Redis blips between the calls, the key survives with no
// TTL. A Lua script runs atomically on the Redis server, closing that gap.
const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return current
`;

/** Atomic fixed-window rate limiter. Returns true if the action is allowed. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const count = (await redis.eval(RATE_LIMIT_SCRIPT, [key], [windowSeconds])) as number;
  return count <= limit;
}
