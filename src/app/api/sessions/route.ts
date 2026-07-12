import { NextRequest } from "next/server";
import { ApiResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { createSession, getSession, setSessionCookie } from "@/lib/session";
import { parseDeviceInfo } from "@/lib/device-info";

const allowedModes = new Set(["off", "approximate", "precise"]);
const cleanText = (v: unknown, max: number) => typeof v === "string" && v.trim() ? v.trim().slice(0,max) : undefined;
function coord(v:unknown,min:number,max:number):number|null|undefined { if(v===null)return null; if(typeof v!=="number"||!Number.isFinite(v)||v<min||v>max)return undefined; return v; }

async function ensureRegistry(req?: NextRequest) {
  const session = await getSession();
  if (!session) return null;
  if (session.sessionId) return session;
  const ua = req?.headers.get("user-agent") ?? "Legacy session";
  const d = parseDeviceInfo(ua);
  const row = await db.loginSession.create({ data: { userId: session.userId, userAgent: ua, deviceLabel: d.deviceLabel, deviceType: d.deviceType, browser: d.browser, os: d.os } });
  const token = await createSession({ ...session, sessionId: row.id });
  await setSessionCookie(token);
  return { ...session, sessionId: row.id };
}

export async function GET(req: NextRequest) {
  const session = await ensureRegistry(req);
  if (!session) return ApiResponse.unauthorized();
  const sessions = await db.loginSession.findMany({
    where: { userId: session.userId },
    orderBy: { lastSeenAt: "desc" },
    take: 30,
    select: { id:true,deviceLabel:true,deviceType:true,browser:true,os:true,timezone:true,language:true,screen:true,latitude:true,longitude:true,accuracy:true,locationMode:true,createdAt:true,lastSeenAt:true,revokedAt:true }
  });
  return ApiResponse.success({ currentSessionId: session.sessionId, registryUpgradeRequired:false, sessions:sessions.map(x=>({...x,current:x.id===session.sessionId})) });
}

export async function POST(req: NextRequest) {
  const session = await ensureRegistry(req);
  if (!session?.sessionId) return ApiResponse.unauthorized();
  const body = await req.json().catch(()=>({})) as Record<string,unknown>;
  const locationMode = typeof body.locationMode === "string" && allowedModes.has(body.locationMode) ? body.locationMode : undefined;
  const latitude=coord(body.latitude,-90,90), longitude=coord(body.longitude,-180,180), accuracy=coord(body.accuracy,0,1000000);
  const updated=await db.loginSession.updateMany({ where:{id:session.sessionId,userId:session.userId,revokedAt:null}, data:{ timezone:cleanText(body.timezone,80),language:cleanText(body.language,30),screen:cleanText(body.screen,40),platform:cleanText(body.platform,80),locationMode,...(latitude!==undefined?{latitude}:{}),...(longitude!==undefined?{longitude}:{}),...(accuracy!==undefined?{accuracy}:{}),lastSeenAt:new Date() } });
  if(!updated.count)return ApiResponse.notFound("Session not found or already revoked.");
  return ApiResponse.success({updated:true});
}
