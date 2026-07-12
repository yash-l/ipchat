import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME, REVOKED_PREFIX } from "@/lib/session";
import { redis } from "@/lib/redis";

export const config = {
  matcher: [
    "/chat/:path*", "/admin/:path*", "/status/:path*", "/stories/:path*",
    "/calls/:path*", "/contacts/:path*", "/channels/:path*", "/groups/:path*",
    "/profile/:path*", "/search/:path*", "/saved/:path*", "/archive/:path*",
    "/notifications/:path*", "/camera/:path*", "/media/:path*", "/settings/:path*",
    "/devices/:path*", "/qr/:path*", "/invite/:path*"
  ]
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.sessionId && (await redis.exists(`${REVOKED_PREFIX}${session.sessionId}`)) > 0) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }

  if (req.nextUrl.pathname.startsWith("/admin") && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  return NextResponse.next();
}
