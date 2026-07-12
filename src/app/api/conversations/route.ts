import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { createConversationSchema } from "@/lib/validators";
import { parseBody } from "@/lib/parse-body";
import { ApiResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/redis";

export async function GET() {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();

  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId: session.userId } } },
    include: {
      participants: { include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 }
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return ApiResponse.success({ conversations });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();

  const allowed = await rateLimit(`ratelimit:conversations:create:${session.userId}`, 20, 3600);
  if (!allowed) return ApiResponse.rateLimited();

  const parsed = await parseBody(req, createConversationSchema);
  if (!parsed.ok) return parsed.response;
  const { username } = parsed.data;

  const other = await db.user.findUnique({ where: { username } });
  if (!other) return ApiResponse.notFound("User not found");
  if (other.id === session.userId) return ApiResponse.error("Can't start a conversation with yourself");

  const existing = await db.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId: session.userId } } },
        { participants: { some: { userId: other.id } } }
      ]
    }
  });
  if (existing) return ApiResponse.success({ conversation: existing });

  const conversation = await db.conversation.create({
    data: { isGroup: false, participants: { create: [{ userId: session.userId }, { userId: other.id }] } }
  });

  return ApiResponse.success({ conversation }, 201);
}
