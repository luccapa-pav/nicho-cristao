import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const plans = await prisma.readingPlan.findMany({
    orderBy: { daysTotal: "asc" },
    include: {
      progress: { where: { userId } },
      _count: { select: { entries: true } },
    },
  });

  return NextResponse.json(
    plans.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      daysTotal: p.daysTotal,
      isPremium: p.isPremium,
      progress: p.progress[0] ? { currentDay: p.progress[0].currentDay, startedAt: p.progress[0].startedAt } : null,
    }))
  );
}
