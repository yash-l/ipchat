import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const allowedModes = new Set(["off", "approximate", "precise"]);

function cleanText(value: unknown, max: number): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
}

function cleanCoordinate(value: unknown, min: number, max: number): number | null | undefined {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) return undefined;
  return value;
}

export async function GET() {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();

  const sessions = await db.loginSession.findMany({
    where: { userId: session.userId },
    orderBy: [{ revokedAt: "asc" }, { lastSeenAt: "desc" }],
    take: 30,
    select: {
      id: true,
      deviceLabel: true,
      deviceType: true,
      browser: true,
      os: true,
      timezone: true,
      language: true,
      screen: true,
      latitude: true,
      longitude: true,
      accuracy: true,
      locationMode: true,
      createdAt: true,
      lastSeenAt: true,
      revokedAt: true
    }
  });

  return ApiResponse.success({
    currentSessionId: session.sessionId ?? null,
    registryUpgradeRequired: !session.sessionId,
    sessions: sessions.map((item) => ({
      ...item,
      current: item.id === session.sessionId
    }))
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();
  if (!session.sessionId) {
    return ApiResponse.error("Sign out and sign in once to activate the new session registry.", 409);
  }

  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  const locationMode = typeof body.locationMode === "string" && allowedModes.has(body.locationMode)
    ? body.locationMode
    : undefined;

  const latitude = cleanCoordinate(body.latitude, -90, 90);
  const longitude = cleanCoordinate(body.longitude, -180, 180);
  const accuracy = cleanCoordinate(body.accuracy, 0, 1000000);

  const updated = await db.loginSession.updateMany({
    where: { id: session.sessionId, userId: session.userId, revokedAt: null },
    data: {
      timezone: cleanText(body.timezone, 80),
      language: cleanText(body.language, 30),
      screen: cleanText(body.screen, 40),
      platform: cleanText(body.platform, 80),
      locationMode,
      ...(latitude !== undefined ? { latitude } : {}),
      ...(longitude !== undefined ? { longitude } : {}),
      ...(accuracy !== undefined ? { accuracy } : {}),
      lastSeenAt: new Date()
    }
  });

  if (!updated.count) return ApiResponse.notFound("Session not found or already revoked.");
  return ApiResponse.success({ updated: true });
}
