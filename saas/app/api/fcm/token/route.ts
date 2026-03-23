import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const { token } = await req.json();
  if (!token || typeof token !== "string") return NextResponse.json({ error: "Invalid token" }, { status: 400 });

  await prisma.fcmToken.upsert({
    where: { token },
    update: { userId },
    create: { userId, token },
  });

  return NextResponse.json({ ok: true });
}
