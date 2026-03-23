import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const prayer = await prisma.prayer.findUnique({ where: { id: params.id } });
  if (!prayer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (prayer.userId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const testimony = typeof body.testimony === "string" && body.testimony.trim() ? body.testimony.trim() : null;

  const updated = await prisma.prayer.update({
    where: { id: params.id },
    data: { status: "ANSWERED", answeredAt: new Date(), ...(testimony ? { testimony } : {}) },
  });

  return NextResponse.json(updated);
}
