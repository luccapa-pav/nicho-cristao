import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prayer = await prisma.prayer.findUnique({ where: { id: params.id } });
  if (!prayer || prayer.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.prayer.update({
    where: { id: params.id },
    data: { status: "ANSWERED", answeredAt: new Date() },
  });

  return NextResponse.json(updated);
}
