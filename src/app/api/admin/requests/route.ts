import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { createDataRequestSchema, paginationSchema } from "@/lib/validators";
import { parseBody, parseQuery } from "@/lib/parse-body";
import { ApiResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const { cursor, take } = parseQuery(req, paginationSchema);
  const requests = await db.dataAccessRequest.findMany({
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      targetUser: { select: { username: true, displayName: true } },
      requestedBy: { select: { username: true } }
    }
  });

  const nextCursor = requests.length === take ? requests[requests.length - 1].id : null;
  return ApiResponse.success({ requests, nextCursor });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const allowed = await rateLimit(`ratelimit:admin:requests:${admin.userId}`, 30, 3600);
  if (!allowed) return ApiResponse.rateLimited();

  const parsed = await parseBody(req, createDataRequestSchema);
  if (!parsed.ok) return parsed.response;
  const { targetUsername, reason, legalReference } = parsed.data;

  const targetUser = await db.user.findUnique({ where: { username: targetUsername } });
  if (!targetUser) return ApiResponse.notFound("User not found");

  const request = await db.dataAccessRequest.create({
    data: { requestedById: admin.userId, targetUserId: targetUser.id, reason, legalReference: legalReference || null }
  });

  await writeAuditLog({
    actorId: admin.userId,
    action: "DATA_REQUEST_CREATED",
    targetType: "User",
    targetId: targetUser.id,
    metadata: { requestId: request.id, reason, legalReference }
  });

  return ApiResponse.success({ request }, 201);
}
