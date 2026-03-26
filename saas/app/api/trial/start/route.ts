import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { trialEndsAt: true, plan: true, email: true, name: true, stripeCustomerId: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  if (user.trialEndsAt !== null) return NextResponse.json({ error: "Trial já utilizado" }, { status: 400 });
  if (user.plan !== "FREE") return NextResponse.json({ error: "Apenas usuários gratuitos podem ativar o trial" }, { status: 400 });

  const stripe = getStripe();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await prisma.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "https://vidacomjesus.app";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: STRIPE_PRICES.premium, quantity: 1 }],
    payment_method_collection: "always",
    success_url: `${origin}/inicio?trial=started`,
    cancel_url: `${origin}/assinar`,
    metadata: { userId: session.user.id, planId: "premium" },
    subscription_data: {
      trial_period_days: 7,
      metadata: { userId: session.user.id, planId: "premium" },
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
