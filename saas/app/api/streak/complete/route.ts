import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const yesterday = new Date(todayStart);
  yesterday.setDate(yesterday.getDate() - 1);

  const updated = await prisma.$transaction(async (tx) => {
    const streak = await tx.streak.findUnique({ where: { userId } });

    // Already checked in today — idempotent
    if (streak?.lastCheckIn && streak.lastCheckIn >= todayStart) {
      return streak;
    }

    const isConsecutive = streak?.lastCheckIn && streak.lastCheckIn >= yesterday;
    const newCurrent = isConsecutive ? (streak.currentStreak + 1) : 1;
    const newLongest = Math.max(streak?.longestStreak ?? 0, newCurrent);

    return tx.streak.upsert({
      where: { userId },
      update: {
        currentStreak: newCurrent,
        longestStreak: newLongest,
        lastCheckIn: now,
        totalDays: { increment: 1 },
      },
      create: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastCheckIn: now,
        totalDays: 1,
      },
    });
  });

  return NextResponse.json({ streak: updated });
}
