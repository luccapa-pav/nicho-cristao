import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BADGE_DEFS } from "@/lib/badges";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [user, streak, prayerCount, answeredCount, memberCount, postWithReactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
    prisma.streak.findUnique({ where: { userId } }),
    prisma.prayer.count({ where: { userId } }),
    prisma.prayer.count({ where: { userId, status: "ANSWERED" } }),
    prisma.groupMember.count({ where: { userId } }),
    prisma.gratitudePost.count({
      where: { userId, reactions: { some: {} } },
    }),
  ]);

  const currentStreak = streak?.currentStreak ?? 0;
  const totalDays = streak?.totalDays ?? 0;

  const badges = BADGE_DEFS.map((def) => {
    let earned = false;
    let progress: number | undefined;

    switch (def.id) {
      case "streak_7":       earned = currentStreak >= 7;   progress = Math.min(100, (currentStreak / 7) * 100); break;
      case "streak_30":      earned = currentStreak >= 30;  progress = Math.min(100, (currentStreak / 30) * 100); break;
      case "streak_90":      earned = currentStreak >= 90;  progress = Math.min(100, (currentStreak / 90) * 100); break;
      case "streak_180":     earned = currentStreak >= 180; progress = Math.min(100, (currentStreak / 180) * 100); break;
      case "streak_365":     earned = currentStreak >= 365; progress = Math.min(100, (currentStreak / 365) * 100); break;
      case "first_prayer":   earned = prayerCount >= 1; break;
      case "first_answered": earned = answeredCount >= 1; break;
      case "cell_member":    earned = memberCount >= 1; break;
      case "discipulo_fiel": earned = totalDays >= 100; progress = Math.min(100, (totalDays / 100) * 100); break;
      case "orador":         earned = prayerCount >= 50; progress = Math.min(100, (prayerCount / 50) * 100); break;
      case "evangelista":    earned = postWithReactions >= 10; progress = Math.min(100, (postWithReactions / 10) * 100); break;
      case "familia":        earned = user?.plan === "FAMILY"; break;
    }

    return { badgeId: def.id, earned, progress };
  });

  return NextResponse.json({ badges, plan: user?.plan ?? "FREE" });
}
