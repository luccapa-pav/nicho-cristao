import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
    select: { groupId: true },
  });

  if (!membership) return NextResponse.json({ error: "Você não está em nenhuma fraternidade" }, { status: 404 });

  const { groupId } = membership;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Reuse valid invite or create new
  const existing = await prisma.groupInvite.findFirst({
    where: { groupId, senderId: session.user.id, status: "PENDING", expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) return NextResponse.json({ token: existing.token });

  const invite = await prisma.groupInvite.create({
    data: { groupId, senderId: session.user.id, expiresAt },
  });

  return NextResponse.json({ token: invite.token });
}
