import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const membership = await prisma.groupMember.findFirst({ where: { userId } });
  if (!membership) return NextResponse.json({ error: "Você não está em nenhuma fraternidade" }, { status: 400 });

  await prisma.groupMember.delete({ where: { id: membership.id } });

  // Se o grupo ficou vazio, remover o grupo
  const remaining = await prisma.groupMember.count({ where: { groupId: membership.groupId } });
  if (remaining === 0) {
    await prisma.group.delete({ where: { id: membership.groupId } });
  } else if (membership.role === "LEADER") {
    // Transferir liderança para o membro mais antigo
    const next = await prisma.groupMember.findFirst({
      where: { groupId: membership.groupId },
      orderBy: { joinedAt: "asc" },
    });
    if (next) {
      await prisma.groupMember.update({ where: { id: next.id }, data: { role: "LEADER" } });
    }
  }

  return new NextResponse(null, { status: 204 });
}
