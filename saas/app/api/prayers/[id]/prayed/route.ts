import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { limited } = await checkRateLimit(`prayed:${session.user.id}:${params.id}`, 1, 1440);
  if (limited) return NextResponse.json({ error: "Você já orou por este pedido hoje" }, { status: 429 });

  const prayer = await prisma.prayer.findUnique({ where: { id: params.id } });
  if (!prayer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.prayer.update({
    where: { id: params.id },
    data: { prayedCount: { increment: 1 } },
  });

  // Notificar o dono do pedido (se for outra pessoa orando)
  if (prayer.userId !== session.user.id) {
    try {
      const actor = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true },
      });
      const { createNotification } = await import("@/lib/notifications");
      await createNotification({
        userId: prayer.userId,
        type: "PRAYED",
        title: "Alguém orou por você! 🙏",
        body: `${actor?.name ?? "Um irmão"} orou pelo seu pedido "${prayer.title.slice(0, 50)}"`,
        link: "/oracao",
      });
    } catch { /* notificação falhou — não impede a resposta */ }
  }

  return NextResponse.json({ prayedCount: updated.prayedCount });
}
