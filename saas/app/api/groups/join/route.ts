import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token inválido" }, { status: 400 });

  const invite = await prisma.groupInvite.findUnique({
    where: { token },
    include: { group: { select: { id: true, name: true, maxMembers: true, _count: { select: { members: true } } } } },
  });

  if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  if (invite.status !== "PENDING") return NextResponse.json({ error: "Este convite já foi usado" }, { status: 400 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Este convite expirou" }, { status: 400 });
  if (invite.group._count.members >= invite.group.maxMembers) {
    return NextResponse.json({ error: "A célula já está cheia (máx. 12 membros)" }, { status: 400 });
  }

  const alreadyMember = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: invite.groupId, userId: session.user.id } },
  });
  if (alreadyMember) return NextResponse.json({ error: "Você já faz parte desta célula" }, { status: 400 });

  await prisma.$transaction([
    prisma.groupMember.create({
      data: { groupId: invite.groupId, userId: session.user.id },
    }),
    prisma.groupInvite.update({
      where: { token },
      data: { status: "ACCEPTED" },
    }),
  ]);

  const [leaders, newMember] = await Promise.all([
    prisma.groupMember.findMany({
      where: { groupId: invite.groupId, role: "LEADER" },
      select: { userId: true },
    }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
  ]);

  const { createNotification } = await import("@/lib/notifications");
  for (const leader of leaders) {
    if (leader.userId !== session.user.id) {
      await createNotification({
        userId: leader.userId,
        type: "GROUP_JOIN",
        title: "Novo membro na célula! ✝️",
        body: `${newMember?.name ?? "Alguém"} entrou no grupo`,
        link: "/celula",
      });
    }
  }

  return NextResponse.json({ groupName: invite.group.name });
}
