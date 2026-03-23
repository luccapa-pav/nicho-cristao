export type PlanType = "FREE" | "PREMIUM" | "FAMILY";

export const isPremium = (plan?: string | null): boolean =>
  plan === "PREMIUM" || plan === "FAMILY";

export const isFamily = (plan?: string | null): boolean =>
  plan === "FAMILY";
