import { ApiResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { clearSessionCookie, getSession, revokeSessionId } from "@/lib/session";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();

  const target = await db.loginSession.findFirst({
    where: { id: params.id, userId: session.userId, revokedAt: null },
    select: { id: true }
  });
  if (!target) return ApiResponse.notFound("Active session not found.");

  await db.loginSession.update({
    where: { id: target.id },
    data: { revokedAt: new Date() }
  });
  await revokeSessionId(target.id);

  const current = target.id === session.sessionId;
  if (current) clearSessionCookie();
  return ApiResponse.success({ revoked: true, current });
}
