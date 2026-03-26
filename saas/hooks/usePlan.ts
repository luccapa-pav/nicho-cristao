"use client";

import { useSession } from "next-auth/react";
import { isPremiumOrTrial, isFamily, isTrialActive, trialDaysLeft as calcTrialDaysLeft } from "@/lib/plan";

export function usePlan() {
  const { data: session } = useSession();
  const user = session?.user as { plan?: string | null; trialEndsAt?: string | null } | undefined;
  const plan = user?.plan ?? "FREE";
  const trialEndsAt = user?.trialEndsAt ?? null;
  return {
    plan,
    isPremium: isPremiumOrTrial(plan, trialEndsAt),
    isFamily: isFamily(plan),
    isOnTrial: isTrialActive(trialEndsAt),
    trialDaysLeft: calcTrialDaysLeft(trialEndsAt),
    hasUsedTrial: trialEndsAt !== null,
  };
}
