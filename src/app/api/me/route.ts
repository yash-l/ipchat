import { getSession } from "@/lib/session";
import { ApiResponse } from "@/lib/api-response";

export async function GET() {
  const session = await getSession();
  if (!session) return ApiResponse.unauthorized();
  return ApiResponse.success({ userId: session.userId, username: session.username, role: session.role });
}
