import { NextRequest,NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { canAccessStatus } from "@/lib/status-access";
const schema=z.object({content:z.string().trim().min(1).max(500)});
export async function POST(req:NextRequest,{params}:{params:{id:string}}){const session=await getSession();if(!session)return NextResponse.json({error:"Authentication required."},{status:401});const body=await req.json().catch(()=>null);const parsed=schema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Reply must be 1–500 characters."},{status:400});const access=await canAccessStatus(params.id,session.userId);if(!access.ok)return NextResponse.json({error:access.error},{status:access.code});const reply=await db.statusReply.create({data:{statusId:access.status.id,userId:session.userId,content:parsed.data.content}});const replies=await db.statusReply.count({where:{statusId:access.status.id}});return NextResponse.json({reply:{id:reply.id,createdAt:reply.createdAt.toISOString()},replies},{status:201});}
