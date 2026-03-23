import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const premium = user?.plan !== "FREE";

  const since = new Date();
  since.setDate(since.getDate() - (premium ? 365 : 30));
  since.setHours(0, 0, 0, 0);

  const logs = await prisma.devotionalLog.findMany({
    where: { userId, completed: true, listenedAt: { gte: since } },
    select: { listenedAt: true },
    orderBy: { listenedAt: "asc" },
  });

  // Deduplicate by calendar date
  const dates = Array.from(
    new Set(logs.map((l) => l.listenedAt.toISOString().split("T")[0]))
  );

  return NextResponse.json({ dates, isPremium: premium });
}
