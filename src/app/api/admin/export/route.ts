import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { exportDataSchema } from "@/lib/validators";
import { parseBody } from "@/lib/parse-body";
import { ApiResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/redis";

/**
 * Fulfils a data access request. Does NOT let an admin pull arbitrary user
 * data on demand — requires an existing DataAccessRequest row with status
 * APPROVED, and writes an audit log entry on every export.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const allowed = await rateLimit(`ratelimit:admin:export:${admin.userId}`, 20, 3600);
  if (!allowed) return ApiResponse.rateLimited("Too many exports in the last hour.");

  const parsed = await parseBody(req, exportDataSchema);
  if (!parsed.ok) return parsed.response;
  const { requestId } = parsed.data;

  const request = await db.dataAccessRequest.findUnique({ where: { id: requestId } });
  if (!request) return ApiResponse.notFound("Request not found");
  if (request.status !== "APPROVED") {
    return ApiResponse.error(`Request is ${request.status}, not APPROVED. Approve it before exporting.`, 409);
  }

  const targetUser = await db.user.findUnique({
    where: { id: request.targetUserId },
    select: { id: true, username: true, displayName: true, phoneLast4: true, createdAt: true, lastSeenAt: true, isBanned: true }
  });

  // Message metadata only — not decrypted content, since content is expected
  // to be E2E-encrypted client-side once that layer is wired up. Adjust this
  // projection to match your actual legal/compliance obligations. Capped at
  // 500 rows; for larger exports, add cursor pagination like other routes.
  const messages = await db.message.findMany({
    where: { senderId: request.targetUserId },
    select: { id: true, conversationId: true, type: true, createdAt: true, deletedAt: true },
    orderBy: { createdAt: "desc" },
    take: 500
  });

  await db.dataAccessRequest.update({ where: { id: requestId }, data: { status: "FULFILLED", fulfilledAt: new Date() } });

  await writeAuditLog({
    actorId: admin.userId,
    action: "DATA_EXPORT",
    targetType: "User",
    targetId: request.targetUserId,
    metadata: { requestId, legalReference: request.legalReference, reason: request.reason }
  });

  return ApiResponse.success({ user: targetUser, messages });
}
