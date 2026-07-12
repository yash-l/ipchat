import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Prevents exhausting Neon's free-tier connection limit during Next.js dev
// hot-reload, which otherwise creates a new PrismaClient on every save.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// Render restarts containers periodically; Prisma cleans up its own
// connections on process exit, but an explicit hook makes shutdown
// deterministic instead of relying on that implicit behavior.
if (typeof process !== "undefined") {
  process.once("beforeExit", async () => {
    await db.$disconnect();
  });
}
