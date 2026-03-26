import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendTrialWarningEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) return NextResponse.json({ error: "Webhook não configurado" }, { status: 400 });

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  const planMap: Record<string, "PREMIUM" | "FAMILY"> = {
    premium: "PREMIUM",
    anual:   "PREMIUM",
    family:  "FAMILY",
  };

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    if (!userId || !planId) return NextResponse.json({ ok: true });

    const newPlan = planMap[planId] ?? "PREMIUM";
    const subscriptionId = session.subscription as string;

    // Verificar se é um trial para guardar trialEndsAt
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const trialEndsAt = subscription.status === "trialing" && subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null;

    await prisma.user.update({
      where: { id: userId },
      data: { plan: newPlan, stripeSubscriptionId: subscriptionId, trialEndsAt },
    });
  }

  if (event.type === "customer.subscription.trial_will_end") {
    // Disparado 1 dia antes do trial acabar (configurar no Stripe Dashboard > Settings > Subscriptions)
    const subscription = event.data.object;
    const userId = subscription.metadata?.userId;
    if (!userId) return NextResponse.json({ ok: true });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });
    if (user) {
      await sendTrialWarningEmail(user.email, user.name ?? "").catch(() => {});
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const userId = subscription.metadata?.userId;
    if (!userId) return NextResponse.json({ ok: true });

    await prisma.user.update({
      where: { id: userId },
      data: { plan: "FREE", stripeSubscriptionId: null, trialEndsAt: null },
    });
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const userId = subscription.metadata?.userId;
    if (!userId) return NextResponse.json({ ok: true });

    if (subscription.status === "active") {
      const planId = subscription.metadata?.planId;
      const newPlan = planMap[planId ?? ""] ?? "PREMIUM";
      // Trial convertido em assinatura real — limpar trialEndsAt
      await prisma.user.update({ where: { id: userId }, data: { plan: newPlan, trialEndsAt: null } });
    } else if (subscription.status === "canceled" || subscription.status === "unpaid") {
      await prisma.user.update({ where: { id: userId }, data: { plan: "FREE", stripeSubscriptionId: null, trialEndsAt: null } });
    }
  }

  return NextResponse.json({ ok: true });
}
