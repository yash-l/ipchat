import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { createMessageSchema, paginationSchema } from "@/lib/validators";
import { parseBody, parseQuery } from "@/lib/parse-body";
import { ApiResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/redis";

async function assertParticipant(conversationId: string, userId: string) {
  const membership = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } }
  });
  return !!membership;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();
  if (!(await assertParticipant(params.id, session.userId))) return ApiResponse.forbidden();

  const { cursor, take } = parseQuery(req, paginationSchema);

  const messages = await db.message.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {})
  });

  // A view-once photo that's already been viewed shows as "opened", not
  // exposed forever.
  type MessageRow = (typeof messages)[number];
  const shaped = messages.map((m: MessageRow) => ({
    ...m,
    mediaUrl: m.viewOnce && m.viewedAt ? null : m.mediaUrl,
    content: m.deletedAt ? null : m.content
  }));

  const nextCursor = messages.length === take ? messages[messages.length - 1].id : null;
  return ApiResponse.success({ messages: shaped, nextCursor });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();
  if (!(await assertParticipant(params.id, session.userId))) return ApiResponse.forbidden();

  const allowed = await rateLimit(`ratelimit:messages:send:${session.userId}`, 60, 60);
  if (!allowed) return ApiResponse.rateLimited("Sending too fast — please slow down.");

  const parsed = await parseBody(req, createMessageSchema);
  if (!parsed.ok) return parsed.response;
  const { type, content, mediaUrl, viewOnce } = parsed.data;

  const message = await db.message.create({
    data: {
      conversationId: params.id,
      senderId: session.userId,
      type,
      content: type === "PHOTO" ? null : content,
      mediaUrl: type === "PHOTO" ? mediaUrl : null,
      viewOnce: type === "PHOTO" ? !!viewOnce : false
    }
  });

  return ApiResponse.success({ message }, 201);
}
