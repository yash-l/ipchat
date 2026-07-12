import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
const schema=z.object({displayName:z.string().trim().min(1).max(50),bio:z.string().trim().max(160).nullable().optional()});
export async function GET(){const s=await getSession();if(!s)return ApiResponse.unauthorized();const p=await db.user.findUnique({where:{id:s.userId},select:{username:true,displayName:true,bio:true,avatarUrl:true}});return p?ApiResponse.success({profile:p}):ApiResponse.notFound("User not found.");}
export async function PATCH(req:NextRequest){const s=await getSession();if(!s)return ApiResponse.unauthorized();const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return ApiResponse.error("Invalid profile details.",400);const p=await db.user.update({where:{id:s.userId},data:{displayName:parsed.data.displayName,bio:parsed.data.bio||null},select:{username:true,displayName:true,bio:true,avatarUrl:true}});return ApiResponse.success({profile:p});}
