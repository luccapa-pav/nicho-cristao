import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PIX_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Verificar secret no query string (AbacatePay envia ?webhookSecret=...)
  const url = new URL(req.url);
  const secret = url.searchParams.get("webhookSecret");
  if (process.env.ABACATEPAY_WEBHOOK_SECRET && secret !== process.env.ABACATEPAY_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = body?.event ?? body?.type;
  const metadata = body?.data?.billing?.metadata ?? body?.metadata ?? {};
  const userId = metadata?.userId;
  const planId = metadata?.planId;
  const months = parseInt(metadata?.months ?? "12");

  if (!userId) return NextResponse.json({ ok: true });

  if (event === "billing.paid" || event === "checkout.completed" || event === "transparent.completed") {
    const planInfo = PIX_PRICES[planId ?? "anual"];
    const planExpiresAt = new Date();
    planExpiresAt.setMonth(planExpiresAt.getMonth() + months);

    await prisma.user.update({
      where: { id: userId },
      data: {
        plan: planInfo?.plan ?? "PREMIUM",
        planExpiresAt,
        trialEndsAt: null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
