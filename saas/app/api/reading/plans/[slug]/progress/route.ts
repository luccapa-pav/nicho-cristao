import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // Verify premium from DB (not JWT — plan may have changed)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (user?.plan === "FREE") {
    return NextResponse.json({ error: "Premium required" }, { status: 403 });
  }

  const plan = await prisma.readingPlan.findUnique({ where: { slug: params.slug } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { day } = await req.json();

  const progress = await prisma.readingProgress.upsert({
    where: { userId_planId: { userId, planId: plan.id } },
    update: { currentDay: Math.max(day, 0) },
    create: { userId, planId: plan.id, currentDay: day },
  });

  return NextResponse.json({ currentDay: progress.currentDay });
}
