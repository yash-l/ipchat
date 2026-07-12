import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { ApiResponse } from "@/lib/api-response";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const [users, conversations, messages, pendingRequests, bannedUsers, recentAudit] = await Promise.all([
    db.user.count(),
    db.conversation.count(),
    db.message.count({ where: { deletedAt: null } }),
    db.dataAccessRequest.count({ where: { status: "PENDING" } }),
    db.user.count({ where: { isBanned: true } }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actor: { select: { username: true } } }
    })
  ]);

  return ApiResponse.success({
    stats: { users, conversations, messages, pendingRequests, bannedUsers },
    recentAudit
  });
}
