import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const premium = user?.plan !== "FREE";

  const plan = await prisma.readingPlan.findUnique({
    where: { slug: params.slug },
    include: {
      entries: { orderBy: { day: "asc" }, ...(!premium ? { take: 3 } : {}) },
      progress: { where: { userId } },
    },
  });

  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    daysTotal: plan.daysTotal,
    isPremium: plan.isPremium,
    isPremiumUser: premium,
    entries: plan.entries.map((e) => ({ day: e.day, reference: e.reference, title: e.title })),
    progress: plan.progress[0] ? { currentDay: plan.progress[0].currentDay } : null,
  });
}
