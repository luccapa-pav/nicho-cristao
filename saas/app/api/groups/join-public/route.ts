import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupId } = await req.json();
  if (!groupId) return NextResponse.json({ error: "groupId obrigatório" }, { status: 400 });

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { _count: { select: { members: true } } },
  });

  if (!group) return NextResponse.json({ error: "Fraternidade não encontrada" }, { status: 404 });
  if (group.isPrivate) return NextResponse.json({ error: "Esta fraternidade é privada" }, { status: 403 });
  if (group._count.members >= group.maxMembers) {
    return NextResponse.json({ error: "A fraternidade já está cheia (máx. 12 membros)" }, { status: 400 });
  }

  const alreadyMember = await prisma.groupMember.findFirst({ where: { userId: session.user.id } });
  if (alreadyMember) return NextResponse.json({ error: "Você já faz parte de uma fraternidade" }, { status: 400 });

  await prisma.groupMember.create({ data: { groupId, userId: session.user.id } });

  const [leaders, newMember] = await Promise.all([
    prisma.groupMember.findMany({ where: { groupId, role: "LEADER" }, select: { userId: true } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
  ]);

  try {
    const { createNotification } = await import("@/lib/notifications");
    for (const leader of leaders) {
      if (leader.userId !== session.user.id) {
        await createNotification({
          userId: leader.userId,
          type: "GROUP_JOIN",
          title: "Novo membro na fraternidade! ✝️",
          body: `${newMember?.name ?? "Alguém"} entrou no grupo`,
          link: "/celula",
        });
      }
    }
  } catch { /* notificação falhou — não impede a resposta */ }

  return NextResponse.json({ groupName: group.name });
}
