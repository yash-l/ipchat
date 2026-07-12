import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { ApiResponse } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      username: true,
      displayName: true,
      phoneLast4: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      lastSeenAt: true,
      isBanned: true,
      memberships: {
        orderBy: { joinedAt: "desc" },
        include: {
          conversation: {
            include: {
              participants: {
                include: {
                  user: { select: { id: true, username: true, displayName: true } }
                }
              },
              messages: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { id: true, type: true, createdAt: true, deletedAt: true }
              }
            }
          }
        }
      },
      _count: {
        select: {
          memberships: true,
          sentMessages: true,
          dataRequestsAboutMe: true
        }
      }
    }
  });

  if (!user) return ApiResponse.notFound("User not found.");

  await writeAuditLog({
    actorId: admin.userId,
    action: "ADMIN_USER_PROFILE_VIEWED",
    targetType: "User",
    targetId: user.id,
    metadata: { username: user.username }
  });

  const conversations = user.memberships.map(({ conversation }) => ({
    id: conversation.id,
    isGroup: conversation.isGroup,
    title: conversation.title,
    createdAt: conversation.createdAt,
    participants: conversation.participants.map(({ user: participant }) => participant),
    lastMessage: conversation.messages[0] ?? null
  }));

  const { memberships: _memberships, ...safeUser } = user;
  return ApiResponse.success({ user: safeUser, conversations });
}
