import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklySummaryEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const isVercel = req.headers.get("x-vercel-cron") === "1";
  if (!isVercel && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Versículo da semana — devocional de hoje
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const devotionalOfWeek = await prisma.devotional.findFirst({
    where: { date: { gte: todayStart, lte: todayEnd } },
    select: { verse: true, verseRef: true },
  });

  const verse = devotionalOfWeek?.verse ?? "Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor.";
  const verseRef = devotionalOfWeek?.verseRef ?? "Jeremias 29:11";

  // Usuários ativos na última semana
  const activeStreaks = await prisma.streak.findMany({
    where: { lastCheckIn: { gte: weekAgo } },
    select: {
      userId: true,
      currentStreak: true,
      user: { select: { email: true, name: true } },
    },
  });

  if (activeStreaks.length === 0) {
    return NextResponse.json({ sent: 0, reason: "Nenhum usuário ativo esta semana" });
  }

  // Processar em batches de 50
  const BATCH = 50;
  let sent = 0;

  for (let i = 0; i < activeStreaks.length; i += BATCH) {
    const batch = activeStreaks.slice(i, i + BATCH);

    await Promise.allSettled(
      batch.map(async (s) => {
        const [devotionalsThisWeek, prayersAdded] = await Promise.all([
          prisma.devotionalLog.count({
            where: { userId: s.userId, completed: true, listenedAt: { gte: weekAgo } },
          }),
          prisma.prayer.count({
            where: { userId: s.userId, createdAt: { gte: weekAgo } },
          }),
        ]);

        await sendWeeklySummaryEmail(s.user.email, s.user.name ?? "Amigo", {
          streak: s.currentStreak,
          devotionalsThisWeek,
          prayersAdded,
          verse,
          verseRef,
        });
        sent++;
      })
    );
  }

  return NextResponse.json({ sent });
}
