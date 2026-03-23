import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const devotionals = await prisma.devotional.findMany({
    orderBy: { date: "desc" },
    take: 30,
    select: { id: true, date: true, title: true, verseRef: true, audioUrl: true },
  });

  return NextResponse.json({ devotionals });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, title, verse, verseRef, audioUrl, audioDuration, theme } = await req.json();

  if (!date || !title || !verse || !verseRef) {
    return NextResponse.json({ error: "date, title, verse e verseRef são obrigatórios" }, { status: 400 });
  }

  const dateObj = new Date(date + "T00:00:00.000Z");

  const existing = await prisma.devotional.findUnique({ where: { date: dateObj } });
  if (existing) return NextResponse.json({ error: "Já existe um devocional para esta data" }, { status: 409 });

  const devotional = await prisma.devotional.create({
    data: { date: dateObj, title, verse, verseRef, audioUrl: audioUrl || null, audioDuration: audioDuration || null, theme: theme || null },
  });

  return NextResponse.json({ devotional }, { status: 201 });
}
