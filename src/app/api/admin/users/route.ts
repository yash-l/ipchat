import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { ApiResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const allowed = await rateLimit(`ratelimit:admin:user-search:${admin.userId}`, 180, 3600);
  if (!allowed) return ApiResponse.rateLimited();

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  const digits = q.replace(/\D/g, "").slice(-4);
  const filters: Prisma.UserWhereInput[] = q
    ? [
        { username: { contains: q, mode: "insensitive" } },
        { displayName: { contains: q, mode: "insensitive" } }
      ]
    : [];

  if (digits) filters.push({ phoneLast4: { contains: digits } });

  const users = await db.user.findMany({
    where: filters.length > 0 ? { OR: filters } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      username: true,
      displayName: true,
      phoneLast4: true,
      avatarUrl: true,
      role: true,
      createdAt: true,
      lastSeenAt: true,
      isBanned: true,
      _count: {
        select: {
          memberships: true,
          sentMessages: true,
          dataRequestsAboutMe: true
        }
      }
    }
  });

  return ApiResponse.success({ users });
}
