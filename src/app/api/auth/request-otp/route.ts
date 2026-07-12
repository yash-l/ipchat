import { NextRequest } from "next/server";
import { issueOtp, hashPhone } from "@/lib/otp";
import { saveAdminOtp } from "@/lib/admin-otp";
import { rateLimit } from "@/lib/redis";
import { requestOtpSchema } from "@/lib/validators";
import { parseBody } from "@/lib/parse-body";
import { ApiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const parsed=await parseBody(req,requestOtpSchema); if(!parsed.ok)return parsed.response;
  const {phone}=parsed.data; const phoneHash=hashPhone(phone);
  const ip=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()??"unknown";
  const [phoneOk,ipOk]=await Promise.all([rateLimit(`ratelimit:otp:phone:${phoneHash}`,3,600),rateLimit(`ratelimit:otp:ip:${ip}`,10,600)]);
  if(!phoneOk||!ipOk)return ApiResponse.rateLimited("Too many codes requested. Please wait a few minutes.");
  const code=await issueOtp(phone); const mode=process.env.OTP_DELIVERY_MODE?.trim().toUpperCase();
  if(mode==="ADMIN_PORTAL"){ await saveAdminOtp(phone,code); logger.info("OTP queued for manual admin delivery",{phoneHash}); return ApiResponse.success({delivery:"manual"}); }
  if(process.env.NODE_ENV!=="production"){ logger.info("Development OTP issued",{phoneHash}); return ApiResponse.success({delivery:"development"}); }
  if(process.env.SMS_PROVIDER_API_KEY){ return ApiResponse.error("SMS provider integration is not configured.",503); }
  logger.warn("No OTP delivery provider configured",{phoneHash}); return ApiResponse.error("OTP delivery is temporarily unavailable. Please contact the administrator.",503);
}
