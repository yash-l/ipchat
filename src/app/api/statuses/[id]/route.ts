import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const status = await db.status.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true }
  });

  if (!status) {
    return NextResponse.json({ error: "Status not found." }, { status: 404 });
  }

  if (status.userId !== session.userId) {
    return NextResponse.json({ error: "You can delete only your own status." }, { status: 403 });
  }

  await db.status.delete({ where: { id: status.id } });
  return NextResponse.json({ deleted: true });
}
