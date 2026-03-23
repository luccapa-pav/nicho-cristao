import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([], { status: 200 });

  const verses = await prisma.memorizedVerse.findMany({
    where: { userId: session.user.id },
    orderBy: { completedAt: "desc" },
  });

  return NextResponse.json(verses);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { verse, reference } = await req.json();
  if (!verse || !reference) return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });

  const saved = await prisma.memorizedVerse.upsert({
    where: { userId_reference: { userId: session.user.id, reference } },
    update: { completedAt: new Date() },
    create: { userId: session.user.id, verse, reference },
  });

  return NextResponse.json(saved);
}
