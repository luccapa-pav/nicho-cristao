import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const membership = await prisma.groupMember.findFirst({ where: { userId } });
  if (!membership) return NextResponse.json([]);

  const prayers = await prisma.prayer.findMany({
    where: {
      isPublic: true,
      user: {
        groupMember: { some: { groupId: membership.groupId } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(
    prayers.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      prayedCount: p.prayedCount,
      createdAt: p.createdAt.toISOString(),
      author: p.user.name,
    }))
  );
}
