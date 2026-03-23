import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — lista grupos públicos (para usuários sem célula)
export async function GET() {
  const groups = await prisma.group.findMany({
    where: { isPrivate: false },
    select: {
      id: true,
      name: true,
      description: true,
      maxMembers: true,
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json(
    groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      memberCount: g._count.members,
      maxMembers: g.maxMembers,
      isFull: g._count.members >= g.maxMembers,
    }))
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
    return NextResponse.json({ error: "Você já faz parte de uma célula" }, { status: 400 });
  }

  const { name, description, isPrivate } = await req.json();

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
      },
    });
    await tx.groupMember.create({
      data: { groupId: g.id, userId: session.user.id, role: "LEADER" },
    });
    return g;
  });

  return NextResponse.json({ id: group.id, name: group.name, isPrivate: group.isPrivate }, { status: 201 });
}
