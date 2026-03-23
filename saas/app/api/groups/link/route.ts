import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { link } = await req.json();

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id, role: "LEADER" },
  });
  if (!membership) return NextResponse.json({ error: "Você não é líder de nenhuma fraternidade" }, { status: 403 });

  const updated = await prisma.group.update({
    where: { id: membership.groupId },
    data: { link: link?.trim() || null },
    select: { link: true },
  });

  return NextResponse.json({ link: updated.link });
}
