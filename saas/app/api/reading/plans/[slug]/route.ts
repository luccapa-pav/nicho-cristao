import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const [plan, user] = await Promise.all([
    prisma.readingPlan.findUnique({
      where: { slug: params.slug },
      include: {
        entries: { orderBy: { day: "asc" } },
        progress: { where: { userId } },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true } }),
  ]);

  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    daysTotal: plan.daysTotal,
    isPremium: plan.isPremium,
    isPremiumUser: user?.plan !== "FREE",
    entries: plan.entries.map((e) => ({ day: e.day, reference: e.reference, title: e.title })),
    progress: plan.progress[0] ? { currentDay: plan.progress[0].currentDay } : null,
  });
}
