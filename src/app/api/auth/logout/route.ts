import { clearSessionCookie } from "@/lib/session";
import { ApiResponse } from "@/lib/api-response";

export async function POST() {
  clearSessionCookie();
  return ApiResponse.success({});
}
