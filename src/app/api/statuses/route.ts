import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

const createStatusSchema = z.object({
  kind: z.enum(["TEXT", "SNAP"]).default("TEXT"),
  content: z.string().trim().min(1).max(220),
  style: z.enum(["sunset", "ocean", "forest", "neon", "midnight"]).default("sunset"),
  audience: z.enum(["EVERYONE", "CONTACTS"]).default("CONTACTS"),
  expiryHours: z.union([z.literal(1), z.literal(6), z.literal(12), z.literal(24)]).default(24)
});

function unauthorized() {
  return NextResponse.json({ error: "Authentication required." }, { status: 401 });
}

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const now = new Date();

  // Expired rows are invisible immediately and physically removed on the next feed refresh.
  await db.status.deleteMany({ where: { expiresAt: { lte: now } } }).catch(() => undefined);

  const participantRows = await db.conversationParticipant.findMany({
    where: {
      userId: { not: session.userId },
      conversation: { participants: { some: { userId: session.userId } } }
    },
    select: { userId: true }
  });
  const contactIds = [...new Set(participantRows.map((row) => row.userId))];

  const statuses = await db.status.findMany({
    where: {
      expiresAt: { gt: now },
      OR: [
        { userId: session.userId },
        { audience: "EVERYONE" },
        { audience: "CONTACTS", userId: { in: contactIds } }
      ]
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true }
      },
      _count: { select: { views: true, replies: true } },
      views: {
        where: { userId: session.userId },
        select: { id: true },
        take: 1
      }
    }
  });

  return NextResponse.json({
    me: { userId: session.userId, username: session.username },
    statuses: statuses.map((status) => ({
      id: status.id,
      userId: status.userId,
      kind: status.kind,
      content: status.content,
      style: status.style,
      audience: status.audience,
      createdAt: status.createdAt.toISOString(),
      expiresAt: status.expiresAt.toISOString(),
      viewed: status.views.length > 0,
      views: status._count.views,
      replies: status._count.replies,
      user: status.user
    }))
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid status." },
      { status: 400 }
    );
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + parsed.data.expiryHours * 60 * 60 * 1000);

  const status = await db.status.create({
    data: {
      userId: session.userId,
      kind: parsed.data.kind,
      content: parsed.data.content,
      style: parsed.data.style,
      audience: parsed.data.audience,
      expiresAt
    },
    include: {
      user: {
        select: { id: true, username: true, displayName: true, avatarUrl: true }
      }
    }
  });

  return NextResponse.json(
    {
      status: {
        id: status.id,
        userId: status.userId,
        kind: status.kind,
        content: status.content,
        style: status.style,
        audience: status.audience,
        createdAt: status.createdAt.toISOString(),
        expiresAt: status.expiresAt.toISOString(),
        viewed: true,
        views: 0,
        replies: 0,
        user: status.user
      }
    },
    { status: 201 }
  );
}
