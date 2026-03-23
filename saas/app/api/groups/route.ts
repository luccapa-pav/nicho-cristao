import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeEffectiveMax } from "@/lib/groupCapacity";

// GET — lista grupos públicos (para usuários sem célula)
export async function GET() {
  const groups = await prisma.group.findMany({
    where: { isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      link: true,
      _count: { select: { members: true } },
      members: { select: { user: { select: { plan: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(
    groups.map((g) => {
      const effectiveMax = computeEffectiveMax(g.members.map((m) => m.user.plan ?? "FREE"));
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        link: g.link,
        memberCount: g._count.members,
        maxMembers: effectiveMax,
        isFull: g._count.members >= effectiveMax,
      };
    })
  );
}

// POST — cria um novo grupo
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verificar se já está em um grupo
  const existing = await prisma.groupMember.findFirst({
    where: { userId: session.user.id },
  });
  if (existing) {
    return NextResponse.json({ error: "Você já faz parte de uma fraternidade" }, { status: 400 });
  }

  const { name, description, isPrivate, link } = await req.json();

  if (!name?.trim() || name.trim().length > 60) {
    return NextResponse.json({ error: "Nome inválido (máx. 60 caracteres)" }, { status: 400 });
  }

  // Somente usuários Premium podem criar grupos privados
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });
  const canBePrivate = user?.plan === "PREMIUM" || user?.plan === "FAMILY";
  const groupIsPrivate = canBePrivate ? Boolean(isPrivate) : false;

  const group = await prisma.$transaction(async (tx) => {
    const g = await tx.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        isPrivate: groupIsPrivate,
        link: link?.trim() || null,
      },
    });
    await tx.groupMember.create({
      data: { groupId: g.id, userId: session.user.id, role: "LEADER" },
    });
    return g;
  });

  return NextResponse.json({ id: group.id, name: group.name, isPrivate: group.isPrivate }, { status: 201 });
}
