import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Verifica se há devocional hoje
  const devotional = await prisma.devotional.findFirst({
    where: { date: { gte: today, lt: new Date(today.getTime() + 86400000) } },
  });

  if (!devotional) {
    return NextResponse.json({ skipped: true, reason: "Sem devocional hoje" });
  }

  // Busca usuários que ainda não ouviram o devocional de hoje, em lotes
  const BATCH = 100;
  let skip = 0;
  let totalSent = 0;

  while (true) {
    const users = await prisma.user.findMany({
      select: { id: true },
      where: {
        devotionalLogs: {
          none: { devotionalId: devotional.id },
        },
      },
      skip,
      take: BATCH,
    });

    if (users.length === 0) break;

    await Promise.all(
      users.map((u) =>
        createNotification({
          userId: u.id,
          type: "DEVOTIONAL",
          title: "Devocional do dia 📖",
          body: `"${devotional.title}" está esperando por você`,
          link: "/devocional",
        })
      )
    );

    totalSent += users.length;
    skip += BATCH;
    if (users.length < BATCH) break;
  }

  return NextResponse.json({ sent: totalSent, devotional: devotional.title });
}
