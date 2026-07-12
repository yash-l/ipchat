import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ApiResponse } from "@/lib/api-response";

export async function GET() {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();
  const passkeys = await db.passkey.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } });
  return ApiResponse.success({ passkeys: passkeys.map((key) => ({ id: key.id, name: key.name, deviceType: key.deviceType, backedUp: key.backedUp, createdAt: key.createdAt, lastUsedAt: key.lastUsedAt })) });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();
  const body = await req.json().catch(() => null) as { id?: string } | null;
  if (!body?.id) return ApiResponse.error("Passkey id is required.", 400);
  const result = await db.passkey.deleteMany({ where: { id: body.id, userId: session.userId } });
  if (!result.count) return ApiResponse.notFound("Passkey not found.");
  return ApiResponse.success({ deleted: true });
}
