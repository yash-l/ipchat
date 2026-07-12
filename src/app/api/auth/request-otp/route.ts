import { NextRequest } from "next/server";
import { issueOtp, hashPhone, lastFourDigits } from "@/lib/otp";
import { saveAdminOtp } from "@/lib/admin-otp";
import { rateLimit } from "@/lib/redis";
import { requestOtpSchema } from "@/lib/validators";
import { parseBody } from "@/lib/parse-body";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

function normalizePhone(value?: string): string {
  return (value ?? "").replace(/\D/g, "");
}

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, requestOtpSchema);
  if (!parsed.ok) return parsed.response;
  const { phone } = parsed.data;

  const phoneHash = hashPhone(phone);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  const [phoneOk, ipOk] = await Promise.all([
    rateLimit(`ratelimit:otp:phone:${phoneHash}`, 3, 600),
    rateLimit(`ratelimit:otp:ip:${ip}`, 10, 600)
  ]);
  if (!phoneOk || !ipOk) {
    return ApiResponse.rateLimited("Too many codes requested. Please wait a few minutes.");
  }

  const code = await issueOtp(phone);
  const deliveryMode = process.env.OTP_DELIVERY_MODE?.trim().toUpperCase();
  const ownerPhone = process.env.OWNER_PHONE_E164?.trim();
  const isOwnerPhone = Boolean(ownerPhone && normalizePhone(ownerPhone) === normalizePhone(phone));

  if (deliveryMode === "ADMIN_PORTAL") {
    await saveAdminOtp(phone, code);

    if (isOwnerPhone) {
      logger.warn("Owner bootstrap OTP issued", { phoneLast4: lastFourDigits(phone), code });
    } else {
      logger.info("OTP queued for manual admin delivery", { phoneHash });
    }

    return ApiResponse.success({ delivery: "manual" });
  }

  if (process.env.NODE_ENV !== "production") {
    logger.info("dev OTP issued", { phone, code });
    return ApiResponse.success({ delivery: "development" });
  }

  if (process.env.SMS_PROVIDER_API_KEY) {
    await sendSms(phone, `Your IPChat verification code is ${code}. It expires in 5 minutes.`);
    return ApiResponse.success({ delivery: "sms" });
  }

  logger.warn("No OTP delivery provider configured", { phoneHash });
  return ApiResponse.error("OTP delivery is temporarily unavailable. Please contact the administrator.", 503);
}

async function sendSms(phone: string, message: string) {
  void phone;
  void message;
  throw new Error("SMS provider integration is not configured.");
}
