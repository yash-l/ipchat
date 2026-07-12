import { NextRequest } from "next/server";
import { z } from "zod";
import { ApiResponse } from "@/lib/api-response";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
const schema=z.object({readReceipts:z.boolean().optional(),showLastSeen:z.boolean().optional(),allowMessageRequests:z.boolean().optional()}).refine(v=>Object.keys(v).length>0);
export async function GET(){const s=await getSession();if(!s)return ApiResponse.unauthorized();const p=await db.user.findUnique({where:{id:s.userId},select:{readReceipts:true,showLastSeen:true,allowMessageRequests:true}});return p?ApiResponse.success({preferences:p}):ApiResponse.notFound("User not found.");}
export async function PATCH(req:NextRequest){const s=await getSession();if(!s)return ApiResponse.unauthorized();const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return ApiResponse.error("Invalid preferences.",400);const p=await db.user.update({where:{id:s.userId},data:parsed.data,select:{readReceipts:true,showLastSeen:true,allowMessageRequests:true}});return ApiResponse.success({preferences:p});}
