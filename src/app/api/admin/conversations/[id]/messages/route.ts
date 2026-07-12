import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import { ApiResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/redis";
import { decryptMessageContent } from "@/lib/message-crypto";

const accessSchema = z.object({
  reason: z.string().trim().min(5, "A reason of at least 5 characters is required.").max(500)
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const allowed = await rateLimit(`ratelimit:admin:conversation-view:${admin.userId}`, 100, 3600);
  if (!allowed) return ApiResponse.rateLimited("Too many admin data-access requests. Please slow down.");

  const body = await req.json().catch(() => null);
  const parsed = accessSchema.safeParse(body);
  if (!parsed.success) return ApiResponse.error(parsed.error.issues[0]?.message ?? "A reason is required.", 400);

  const conversation = await db.conversation.findUnique({
    where: { id: params.id },
    include: {
      participants: {
        include: {
          user: { select: { id: true, username: true, displayName: true } }
        }
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 250,
        include: {
          sender: { select: { id: true, username: true, displayName: true } }
        }
      }
    }
  });

  if (!conversation) return ApiResponse.notFound("Conversation not found.");

  await writeAuditLog({
    actorId: admin.userId,
    action: "ADMIN_CONVERSATION_VIEWED",
    targetType: "Conversation",
    targetId: conversation.id,
    metadata: {
      reason: parsed.data.reason,
      participantUsernames: conversation.participants.map(({ user }) => user.username),
      messageCountReturned: conversation.messages.length
    }
  });

  const messages = conversation.messages
    .map((message) => ({
      ...message,
      content: message.deletedAt ? null : decryptMessageContent(message.content),
      mediaUrl: message.viewOnce && message.viewedAt ? null : message.mediaUrl
    }))
    .reverse();

  return ApiResponse.success({
    conversation: {
      id: conversation.id,
      title: conversation.title,
      isGroup: conversation.isGroup,
      participants: conversation.participants.map(({ user }) => user)
    },
    messages
  });
}
