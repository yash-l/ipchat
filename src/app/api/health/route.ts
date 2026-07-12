import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";

export async function GET() {
  const result: Record<string, string> = {};

  try {
    await db.$queryRaw`SELECT 1`;
    result.database = "ok";
  } catch (err) {
    result.database = `error: ${(err as Error).message}`;
  }

  try {
    await redis.set("health:check", Date.now(), { ex: 30 });
    await redis.get("health:check");
    result.redis = "ok";
  } catch (err) {
    result.redis = `error: ${(err as Error).message}`;
  }

  const healthy = result.database === "ok" && result.redis === "ok";
  return NextResponse.json(result, { status: healthy ? 200 : 500 });
}
