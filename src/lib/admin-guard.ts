import { getSession, SessionPayload } from "./session";

/** Returns the session if it belongs to an admin, otherwise null. Use at the top of every /api/admin/* route. */
export async function requireAdmin(): Promise<SessionPayload | null> {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return null;
  return session;
}
