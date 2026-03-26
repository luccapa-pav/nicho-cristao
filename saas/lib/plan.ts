export type PlanType = "FREE" | "PREMIUM" | "FAMILY";

export const isPremium = (plan?: string | null): boolean =>
  plan === "PREMIUM" || plan === "FAMILY";

export const isFamily = (plan?: string | null): boolean =>
  plan === "FAMILY";

export const isTrialActive = (trialEndsAt?: string | null): boolean =>
  !!trialEndsAt && new Date(trialEndsAt) > new Date();

export const trialDaysLeft = (trialEndsAt?: string | null): number => {
  if (!trialEndsAt) return 0;
  return Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000));
};

export const isPremiumOrTrial = (plan?: string | null, trialEndsAt?: string | null): boolean =>
  isPremium(plan) || isTrialActive(trialEndsAt);
