import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PIX_PRICES } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  const planInfo = PIX_PRICES[planId];
  if (!planInfo) return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const apiKey = process.env.ABACATEPAY_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "PIX não configurado" }, { status: 500 });

  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "https://vidacomjesus.app";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  });

  const body = {
    frequency: "ONE_TIME",
    methods: ["PIX"],
    products: [{
      externalId: `${planId.toUpperCase()}-ANNUAL-${session.user.id}`,
      name: planInfo.name,
      quantity: 1,
      price: planInfo.amount,
    }],
    returnUrl: `${origin}/assinar`,
    completionUrl: `${origin}/dashboard?payment=success&method=pix`,
    customer: {
      name: user?.name ?? (session.user as { name?: string }).name ?? "Cliente",
      email: user?.email ?? (session.user as { email?: string }).email ?? "",
      cellphone: user?.phone ?? "",
    },
    metadata: { userId: session.user.id, planId, months: String(planInfo.months), plan: planInfo.plan },
  };

  const res = await fetch("https://api.abacatepay.com/v1/billing/create", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data.error ?? "Erro ao criar cobrança PIX" }, { status: 500 });

  const url = data.data?.url ?? data.url;
  if (!url) return NextResponse.json({ error: "URL de pagamento não retornada" }, { status: 500 });

  return NextResponse.json({ url });
}
