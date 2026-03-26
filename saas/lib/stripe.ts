import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY não configurada");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

export const STRIPE_PRICES: Record<string, string> = {
  premium: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? "",
  anual:   process.env.STRIPE_PRICE_PREMIUM_ANNUAL  ?? "",
  family:  process.env.STRIPE_PRICE_FAMILY_MONTHLY  ?? "",
};

export const PIX_PRICES: Record<string, { name: string; amount: number; plan: "PREMIUM" | "FAMILY"; months: number }> = {
  premium: { name: "Premium Anual",  amount: 17988, plan: "PREMIUM", months: 12 },
  anual:   { name: "Premium Anual",  amount: 17988, plan: "PREMIUM", months: 12 },
  family:  { name: "Família Anual",  amount: 21480, plan: "FAMILY",  months: 12 },
};
