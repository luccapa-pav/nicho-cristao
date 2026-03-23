import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { searchParams } = new URL(request.url);
  const quick = searchParams.get("quick") === "1";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Use UTC date string to avoid timezone issues with @db.Date
  const todayUTC = new Date(today.toISOString().split("T")[0] + "T00:00:00.000Z");

  if (quick) {
    const [streak, devotional] = await Promise.all([
      prisma.streak.findUnique({ where: { userId } }),
      prisma.devotional.findFirst({
        where: { date: { gte: todayUTC, lt: new Date(todayUTC.getTime() + 86400000) } },
        include: { logs: { where: { userId } } },
      }),
    ]);
    return NextResponse.json({
      streak: streak ?? { currentStreak: 0, longestStreak: 0 },
      devotional: devotional ? {
        id: devotional.id,
        title: devotional.title,
        verse: devotional.verse,
        verseRef: devotional.verseRef,
        audioUrl: devotional.audioUrl ?? "",
        duration: devotional.audioDuration ?? 0,
        theme: devotional.theme ?? "",
        completedToday: devotional.logs.length > 0,
      } : null,
    }, { headers: { "Cache-Control": "private, max-age=15" } });
  }

  const [user, streak, devotional, prayers, posts, membership] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, plan: true } }),

    prisma.streak.findUnique({ where: { userId } }),

    prisma.devotional.findFirst({
      where: { date: { gte: todayUTC, lt: new Date(todayUTC.getTime() + 86400000) } },
      include: { logs: { where: { userId } } },
    }),

    prisma.prayer.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),

    prisma.gratitudePost.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { name: true } },
        reactions: { select: { userId: true, type: true } },
      },
    }),

    prisma.groupMember.findFirst({
      where: { userId },
      include: {
        group: {
          include: {
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    streak: { select: { currentStreak: true, lastCheckIn: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const postsFormatted = posts.map((p) => ({
    id: p.id,
    author: p.user.name,
    content: p.content,
    createdAt: p.createdAt.toISOString(),
    reactions: {
      AMEN: p.reactions.filter((r) => r.type === "AMEN").length,
      GLORY: p.reactions.filter((r) => r.type === "GLORY").length,
    },
    userReacted: p.reactions.find((r) => r.userId === userId)?.type ?? null,
  }));

  const onlineThreshold = new Date(Date.now() - 15 * 60 * 1000); // 15 min
  const group = membership?.group ?? null;
  const members = group?.members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    avatarUrl: m.user.avatarUrl ?? undefined,
    streakDays: m.user.streak?.currentStreak ?? 0,
    isOnline: m.user.streak?.lastCheckIn
      ? new Date(m.user.streak.lastCheckIn) > onlineThreshold
      : false,
  })) ?? [];

  return NextResponse.json({
    user,
    streak: streak ?? { currentStreak: 0, longestStreak: 0 },
    group: group ? { name: group.name, progress: group.progress, members } : null,
    devotional: devotional
      ? {
          id: devotional.id,
          title: devotional.title,
          verse: devotional.verse,
          verseRef: devotional.verseRef,
          audioUrl: devotional.audioUrl ?? "",
          duration: devotional.audioDuration ?? 0,
          theme: devotional.theme ?? "",
          completedToday: devotional.logs.length > 0,
        }
      : null,
    prayers: prayers.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      prayedCount: p.prayedCount,
      createdAt: p.createdAt.toISOString(),
    })),
    posts: postsFormatted,
  }, {
    headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" },
  });
}
