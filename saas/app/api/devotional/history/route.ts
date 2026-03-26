import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const premium = user?.plan !== "FREE";

  const { searchParams } = new URL(req.url);
  const theme = premium ? (searchParams.get("theme") ?? undefined) : undefined;

  const logs = await prisma.devotionalLog.findMany({
    where: {
      userId,
      completed: true,
      ...(theme
        ? { devotional: { theme: { contains: theme, mode: "insensitive" } } }
        : {}),
    },
    include: {
      devotional: {
        select: { id: true, title: true, verseRef: true, theme: true, date: true, audioUrl: true },
      },
    },
    orderBy: { listenedAt: "desc" },
    ...(premium ? {} : { take: 7 }),
  });

  return NextResponse.json({
    history: logs.map((l) => ({
      id: l.id,
      devotionalId: l.devotionalId,
      title: l.devotional.title,
      verseRef: l.devotional.verseRef,
      theme: l.devotional.theme,
      date: l.devotional.date.toISOString(),
      completedAt: l.listenedAt.toISOString(),
      audioUrl: l.devotional.audioUrl ?? null,
    })),
    isPremium: premium,
  });
}
