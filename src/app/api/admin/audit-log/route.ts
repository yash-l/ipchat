import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { paginationSchema } from "@/lib/validators";
import { parseQuery } from "@/lib/parse-body";
import { ApiResponse } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const { cursor, take } = parseQuery(req, paginationSchema);
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: { actor: { select: { username: true } } }
  });

  const nextCursor = logs.length === take ? logs[logs.length - 1].id : null;
  return ApiResponse.success({ logs, nextCursor });
}
