"use client";

import { useSession } from "next-auth/react";
import { isPremium, isFamily } from "@/lib/plan";

export function usePlan() {
  const { data: session } = useSession();
  const plan = (session?.user as { plan?: string | null })?.plan ?? "FREE";
  return {
    plan,
    isPremium: isPremium(plan),
    isFamily: isFamily(plan),
  };
}
