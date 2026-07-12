import { clearSessionCookie, getSession, revokeSessionId } from "@/lib/session";
import { db } from "@/lib/db";
import { ApiResponse } from "@/lib/api-response";

export async function POST() {
  const session = await getSession();
  if (session?.sessionId) {
    await Promise.all([
      db.loginSession.updateMany({
        where: { id: session.sessionId, userId: session.userId, revokedAt: null },
        data: { revokedAt: new Date() }
      }),
      revokeSessionId(session.sessionId)
    ]).catch(() => undefined);
  }

  clearSessionCookie();
  return ApiResponse.success({});
}
