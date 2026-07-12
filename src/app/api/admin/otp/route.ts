import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-guard";
import { listAdminOtps, markAdminOtpSent, removeAdminOtp } from "@/lib/admin-otp";
import { writeAuditLog } from "@/lib/audit";
import { ApiResponse } from "@/lib/api-response";
import { rateLimit } from "@/lib/redis";

const actionSchema = z.object({
  phoneHash: z.string().regex(/^[a-f0-9]{64}$/i),
  phoneLast4: z.string().regex(/^\d{4}$/),
  action: z.enum(["mark_sent", "dismiss"])
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const records = await listAdminOtps();
  return ApiResponse.success({ records });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return ApiResponse.forbidden();

  const allowed = await rateLimit(`ratelimit:admin:otp:${admin.userId}`, 120, 3600);
  if (!allowed) return ApiResponse.rateLimited();

  const body = await req.json().catch(() => null);
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) return ApiResponse.error("Invalid OTP action.", 400);

  const { phoneHash, phoneLast4, action } = parsed.data;

  if (action === "mark_sent") {
    const record = await markAdminOtpSent(phoneHash);
    if (!record) return ApiResponse.notFound("OTP expired or no longer exists.");
  } else {
    await removeAdminOtp(phoneHash);
  }

  await writeAuditLog({
    actorId: admin.userId,
    action: action === "mark_sent" ? "OTP_MARKED_SENT" : "OTP_DISMISSED",
    targetType: "OtpRequest",
    targetId: phoneHash,
    metadata: { phoneLast4 }
  });

  return ApiResponse.success({});
}
