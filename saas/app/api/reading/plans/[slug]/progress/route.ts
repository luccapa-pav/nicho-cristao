import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const plan = await prisma.readingPlan.findUnique({ where: { slug: params.slug } });
  if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let day: number;
  try {
    const body = await req.json();
    day = Number(body.day);
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!Number.isFinite(day) || day < 0) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }
  day = Math.min(day, plan.daysTotal);

  const progress = await prisma.readingProgress.upsert({
    where: { userId_planId: { userId, planId: plan.id } },
    update: { currentDay: day },
    create: { userId, planId: plan.id, currentDay: day },
  });

  return NextResponse.json({ currentDay: progress.currentDay });
}
