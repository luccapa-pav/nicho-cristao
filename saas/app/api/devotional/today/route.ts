import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const todayStr = new Date().toISOString().split("T")[0];
  const today = new Date(`${todayStr}T00:00:00.000Z`);

  const devotional = await prisma.devotional.findFirst({
    where: { date: { gte: today, lt: new Date(today.getTime() + 86400000) } },
  });

  if (!devotional) return NextResponse.json({ error: "No devotional today" }, { status: 404 });

  await prisma.devotionalLog.upsert({
    where: { userId_devotionalId: { userId, devotionalId: devotional.id } },
    update: { completed: true },
    create: { userId, devotionalId: devotional.id, completed: true },
  });

  return NextResponse.json({ ok: true });
}
