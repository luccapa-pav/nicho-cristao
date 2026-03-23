import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ notifications: [], unreadCount: 0 });

  const userId = session.user.id;

  const [unread, recent] = await Promise.all([
    prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.notification.findMany({
      where: { userId, read: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    notifications: [...unread, ...recent],
    unreadCount: unread.length,
  });
}

export async function PATCH(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
