import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, COOKIE_NAME } from "@/lib/session";
export const config = { matcher: ["/chat/:path*","/calls/:path*","/status/:path*","/settings/:path*","/admin/:path*"] };
export async function middleware(req: NextRequest) {
  const token=req.cookies.get(COOKIE_NAME)?.value;
  const session=token?await verifySessionToken(token):null;
  if(!session){const url=new URL("/login",req.url);url.searchParams.set("next",req.nextUrl.pathname);return NextResponse.redirect(url)}
  if(req.nextUrl.pathname.startsWith("/admin")&&session.role!=="ADMIN")return NextResponse.redirect(new URL("/chat",req.url));
  return NextResponse.next();
}
