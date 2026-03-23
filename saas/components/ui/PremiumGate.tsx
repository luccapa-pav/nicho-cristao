"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePlan } from "@/hooks/usePlan";

interface PremiumGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  feature?: string;
  blur?: boolean;
}

export function PremiumGate({ children, fallback, feature, blur = true }: PremiumGateProps) {
  const { isPremium } = usePlan();

  if (isPremium) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {blur && (
        <div className="pointer-events-none select-none blur-sm opacity-40">
          {children}
        </div>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl">
        <span className="text-2xl">✦</span>
        <p className="text-sm font-semibold text-slate-700 text-center px-4 leading-tight">
          {feature ? `${feature} é exclusivo Premium` : "Recurso exclusivo Premium"}
        </p>
        <Link href="/perfil">
          <button className="btn-divine py-2 px-5 text-sm">
            Desbloquear Premium
          </button>
        </Link>
      </div>
    </div>
  );
}
