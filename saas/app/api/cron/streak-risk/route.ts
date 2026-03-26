import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const isVercel = req.headers.get("x-vercel-cron") === "1";
  if (!isVercel && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Usuários com streak >= 3 que NÃO fizeram check-in hoje
  // TODO: implement cursor-based pagination for large user bases
  const atRisk = await prisma.streak.findMany({
    where: {
      currentStreak: { gte: 3 },
      lastCheckIn: { lt: today },
    },
    select: {
      userId: true,
      currentStreak: true,
    },
    take: 500,
  });

  if (atRisk.length === 0) {
    return NextResponse.json({ sent: 0, reason: "Nenhum streak em risco" });
  }

  await Promise.all(
    atRisk.map((s) =>
      createNotification({
        userId: s.userId,
        type: "STREAK_RISK",
        title: "Sua ofensiva está em risco! 🔥",
        body: `${s.currentStreak} dias seguidos — não deixe sua chama apagar. Abra o app antes de meia-noite!`,
        link: "/inicio",
      })
    )
  );

  return NextResponse.json({ sent: atRisk.length });
}
