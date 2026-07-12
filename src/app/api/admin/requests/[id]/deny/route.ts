import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { ApiResponse } from "@/lib/api-response";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const request = await db.dataAccessRequest.findUnique({ where: { id: params.id } });
  if (!request) return ApiResponse.notFound();
  if (request.status !== "PENDING") return ApiResponse.error(`Request is already ${request.status}`, 409);

  const updated = await db.dataAccessRequest.update({
    where: { id: params.id },
    data: { status: "DENIED" }
  });

  await writeAuditLog({
    actorId: admin.userId,
    action: "DATA_REQUEST_DENIED",
    targetType: "User",
    targetId: request.targetUserId,
    metadata: { requestId: request.id }
  });

  return ApiResponse.success({ request: updated });
}
