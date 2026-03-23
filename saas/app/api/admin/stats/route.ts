import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function isAdmin(email?: string | null) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!isAdmin(session?.user?.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalUsers, byPlan, prayersToday, activeStreaks, devotionalLogs] = await Promise.all([
    prisma.user.count(),
    prisma.user.groupBy({ by: ["plan"], _count: { _all: true } }),
    prisma.prayer.count({ where: { createdAt: { gte: today } } }),
    prisma.streak.aggregate({ _avg: { currentStreak: true }, _max: { currentStreak: true } }),
    prisma.devotionalLog.count({ where: { listenedAt: { gte: today } } }),
  ]);

  return NextResponse.json({
    totalUsers,
    byPlan: Object.fromEntries(byPlan.map((p) => [p.plan, p._count._all])),
    prayersToday,
    avgStreak: Math.round(activeStreaks._avg.currentStreak ?? 0),
    longestStreak: activeStreaks._max.currentStreak ?? 0,
    devotionalCompletionsToday: devotionalLogs,
  });
}
