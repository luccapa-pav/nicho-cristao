import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeEffectiveMax } from "@/lib/groupCapacity";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verificar se já está em um grupo
  const alreadyMember = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
  });
  if (alreadyMember) return NextResponse.json({ error: "Você já faz parte de uma fraternidade" }, { status: 400 });

  // Buscar grupos públicos com espaço
  const groups = await prisma.group.findMany({
    where: { isPrivate: false },
    select: {
      id: true,
      name: true,
      _count: { select: { members: true } },
      members: { select: { user: { select: { plan: true } } } },
    },
  });

  const available = groups.filter((g) => {
    const max = computeEffectiveMax(g.members.map((m) => m.user.plan ?? "FREE"));
    return g._count.members < max;
  });

  if (available.length === 0) {
    // Nenhum grupo disponível — cria um novo grupo público para o usuário
    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.group.create({
        data: { name: "Fraternidade da Fé", isPrivate: false },
      });
      await tx.groupMember.create({
        data: { groupId: g.id, userId: session.user.id, role: "LEADER" },
      });
      return g;
    });
    return NextResponse.json({ groupName: group.name, created: true });
  }

  // Escolher aleatoriamente entre os disponíveis
  const chosen = available[Math.floor(Math.random() * available.length)];

  await prisma.groupMember.create({
    data: { groupId: chosen.id, userId: session.user.id },
  });

  // Notificar líderes
  try {
    const [leaders, newMember] = await Promise.all([
      prisma.groupMember.findMany({ where: { groupId: chosen.id, role: "LEADER" }, select: { userId: true } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } }),
    ]);
    const { createNotification } = await import("@/lib/notifications");
    for (const leader of leaders) {
      if (leader.userId !== session.user.id) {
        await createNotification({
          userId: leader.userId,
          type: "GROUP_JOIN",
          title: "Novo membro na fraternidade! ✝️",
          body: `${newMember?.name ?? "Alguém"} entrou no grupo`,
          link: "/fraternidade",
        });
      }
    }
  } catch { /* notificação opcional */ }

  return NextResponse.json({ groupName: chosen.name, created: false });
}
