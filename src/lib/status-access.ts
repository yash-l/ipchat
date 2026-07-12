import { db } from "@/lib/db";

export async function canAccessStatus(statusId:string, userId:string) {
  const status=await db.status.findFirst({where:{id:statusId,expiresAt:{gt:new Date()}},select:{id:true,userId:true,audience:true}});
  if(!status)return {ok:false as const,code:404,error:"Status expired or not found."};
  if(status.userId===userId||status.audience==="EVERYONE")return {ok:true as const,status};
  const shared=await db.conversation.findFirst({where:{participants:{some:{userId:status.userId}},AND:{participants:{some:{userId}}}},select:{id:true}});
  if(status.audience==="CONTACTS"&&shared)return {ok:true as const,status};
  return {ok:false as const,code:403,error:"This status is not shared with you."};
}
