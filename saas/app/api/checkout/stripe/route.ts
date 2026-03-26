import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  const priceId = STRIPE_PRICES[planId];
  if (!priceId) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const stripe = getStripe();
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true, name: true, stripeCustomerId: true } });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  // Criar ou reutilizar customer do Stripe
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: session.user.id } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "https://vidacomjesus.app";

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?payment=success`,
      cancel_url: `${origin}/assinar?payment=cancelled`,
      metadata: { userId: session.user.id, planId },
      subscription_data: { metadata: { userId: session.user.id, planId } },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao criar sessão de pagamento";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
