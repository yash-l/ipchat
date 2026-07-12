import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { ApiResponse } from "@/lib/api-response";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();

  const message = await db.message.findUnique({ where: { id: params.messageId } });
  if (!message || message.conversationId !== params.id) return ApiResponse.notFound();

  if (message.senderId === session.userId || !message.viewOnce) {
    // Sender doesn't "consume" their own view-once photo; non-view-once photos are reusable.
    return ApiResponse.success({ mediaUrl: message.mediaUrl });
  }
  if (message.viewedAt) return ApiResponse.error("This photo has already been viewed.", 410);

  const mediaUrl = message.mediaUrl;

  // Atomic conditional update: only succeeds if viewedAt is still null at
  // write time. Prevents two concurrent requests both passing the check
  // above and both getting the mediaUrl (TOCTOU race).
  const result = await db.message.updateMany({
    where: { id: message.id, viewedAt: null },
    data: { viewedAt: new Date(), mediaUrl: null }
  });
  if (result.count === 0) return ApiResponse.error("This photo has already been viewed.", 410);

  return ApiResponse.success({ mediaUrl });
}
