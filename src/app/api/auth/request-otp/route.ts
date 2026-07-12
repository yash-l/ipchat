import { NextRequest } from "next/server";
import { issueOtp, hashPhone, lastFourDigits } from "@/lib/otp";
import { saveAdminOtp } from "@/lib/admin-otp";
import { rateLimit } from "@/lib/redis";
import { requestOtpSchema } from "@/lib/validators";
import { parseBody } from "@/lib/parse-body";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

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

  if (deliveryMode === "ADMIN_PORTAL") {
    await saveAdminOtp(phone, code);

    // Bootstrap/recovery path for the owner account: before any admin session
    // exists, the owner can read this short-lived code from private Render logs.
    if (process.env.OWNER_PHONE_E164?.trim() === phone) {
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
  // Integrate the selected provider here before enabling SMS mode in production.
  // This intentionally fails closed instead of pretending an SMS was delivered.
  void phone;
  void message;
  throw new Error("SMS provider integration is not configured.");
}
