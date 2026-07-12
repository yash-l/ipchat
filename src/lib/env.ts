import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be >=32 chars (openssl rand -hex 32)"),
  PHONE_HASH_SECRET: z.string().min(32, "PHONE_HASH_SECRET must be >=32 chars"),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  SMS_PROVIDER_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development")
});

// Fails fast at boot (import this once from a server entrypoint) instead of
// failing on the first request that happens to touch a missing var.
export const env = schema.parse(process.env);
