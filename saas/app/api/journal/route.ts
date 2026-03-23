import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  if (!user || (user.plan !== "PREMIUM" && user.plan !== "FAMILY")) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }
  const entries = await prisma.journalEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
  if (!user || (user.plan !== "PREMIUM" && user.plan !== "FAMILY")) {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }
  const body = await request.json();
  const { content, mood } = body as { content: string; mood: string };
  if (!content?.trim() || !mood) return NextResponse.json({ error: "Invalid" }, { status: 400 });
  const VALID_MOODS = ["GRATIDAO", "APRENDIZADO", "DESAFIO", "LOUVOR"];
  if (!VALID_MOODS.includes(mood)) return NextResponse.json({ error: "Invalid mood" }, { status: 400 });
  const entry = await prisma.journalEntry.create({
    data: { userId: session.user.id, content: content.trim().slice(0, 2000), mood: mood as "GRATIDAO" | "APRENDIZADO" | "DESAFIO" | "LOUVOR" },
  });
  return NextResponse.json(entry, { status: 201 });
}
