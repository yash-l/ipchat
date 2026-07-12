import { NextRequest } from "next/server";
import { issueOtp, hashPhone } from "@/lib/otp";
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
  if (!phoneOk || !ipOk) return ApiResponse.rateLimited("Too many codes requested. Please wait a few minutes.");

  const code = await issueOtp(phone);

  // SMS provider is pluggable via sendSms() below. Until SMS_PROVIDER_API_KEY
  // is set, the code is logged in dev only so the flow is testable for free.
  if (process.env.NODE_ENV !== "production") {
    logger.info("dev OTP issued", { phone, code });
  } else if (process.env.SMS_PROVIDER_API_KEY) {
    await sendSms(phone, `Your verification code is ${code}. It expires in 5 minutes.`);
  } else {
    logger.warn("SMS_PROVIDER_API_KEY not set — OTP generated but not sent", { phoneHash });
  }

  return ApiResponse.success({});
}

async function sendSms(phone: string, message: string) {
  // Placeholder for your SMS provider's HTTP API (Twilio-like shape):
  // await fetch("https://api.your-sms-provider.com/send", {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${process.env.SMS_PROVIDER_API_KEY}` },
  //   body: JSON.stringify({ to: phone, body: message })
  // });
}
