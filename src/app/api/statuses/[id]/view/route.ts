import { NextRequest,NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canAccessStatus } from "@/lib/status-access";
export async function POST(_req:NextRequest,{params}:{params:{id:string}}){const session=await getSession();if(!session)return NextResponse.json({error:"Authentication required."},{status:401});const access=await canAccessStatus(params.id,session.userId);if(!access.ok)return NextResponse.json({error:access.error},{status:access.code});const status=access.status;if(status.userId!==session.userId)await db.statusView.upsert({where:{statusId_userId:{statusId:status.id,userId:session.userId}},update:{viewedAt:new Date()},create:{statusId:status.id,userId:session.userId}});const views=await db.statusView.count({where:{statusId:status.id}});return NextResponse.json({viewed:true,views});}
