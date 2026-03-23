import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  const isPremium = user?.plan !== "FREE";

  const prayers = await prisma.prayer.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    ...(isPremium ? {} : { take: 50 }),
  });

  return NextResponse.json(prayers);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, isPublic } = await req.json();
  if (!title?.trim() || title.trim().length > 120) {
    return NextResponse.json({ error: "Título inválido (máx. 120 caracteres)" }, { status: 400 });
  }
  if (description && description.length > 600) {
    return NextResponse.json({ error: "Descrição muito longa (máx. 600 caracteres)" }, { status: 400 });
  }

  const prayer = await prisma.prayer.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim() || null,
      isPublic: Boolean(isPublic),
    },
  });

  return NextResponse.json(prayer, { status: 201 });
}
