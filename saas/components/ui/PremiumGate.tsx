"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePlan } from "@/hooks/usePlan";

// Default benefits per feature keyword — fallback se benefits[] não for passado
const FEATURE_BENEFITS: Record<string, string[]> = {
  "Versículo do Coração": [
    "Memorize versículos passo a passo",
    "Progresso salvo no seu perfil",
    "Compartilhe com sua fraternidade",
  ],
  "Diário Espiritual": [
    "Reflita e registre cada momento com Deus",
    "Histórico completo de entradas",
    "Conecte ao devocional do dia",
  ],
  "Histórico completo": [
    "Veja todos os seus dias de fidelidade",
    "Calendário anual de check-ins",
    "Exporte seu relatório mensal",
  ],
  "Conquistas Premium": [
    "Desbloqueie medalhas espirituais",
    "Mostre sua jornada para a fraternidade",
    "Conquistas exclusivas a cada marco",
  ],
  "Música ambiente": [
    "Sons relaxantes para foco em oração",
    "4 ambientes: natureza, chuva, coral, silêncio",
    "Ajuste o volume sem sair da oração",
  ],
  "Versículos em voz alta": [
    "Ouça a Palavra enquanto ora",
    "Voz natural em português",
    "Escolha a passagem ou deixe aleatório",
  ],
  "Plano de Leitura": [
    "Leia a Bíblia inteira em 1 ano",
    "Planos temáticos por assunto",
    "Progresso salvo automaticamente",
  ],
};

function getBenefits(feature?: string): string[] {
  if (!feature) return [
    "Acesso completo a todos os recursos",
    "Devocionais e planos de leitura",
    "Diário espiritual + memorização",
  ];
  for (const key of Object.keys(FEATURE_BENEFITS)) {
    if (feature.includes(key)) return FEATURE_BENEFITS[key];
  }
  return [
    "Aprofunde sua vida espiritual",
    "Recursos exclusivos para crescer",
    "Acompanhe sua jornada de fé",
  ];
}

interface PremiumGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  feature?: string;
  benefits?: string[];
  blur?: boolean;
}

export function PremiumGate({ children, fallback, feature, benefits, blur = true }: PremiumGateProps) {
  const { isPremium } = usePlan();

  if (isPremium) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  const resolvedBenefits = benefits ?? getBenefits(feature);
  // Título curto (antes do " —")
  const featureTitle = feature ? feature.split(" —")[0].split(" — ")[0] : "Recurso Premium";

  return (
    <div className={`relative overflow-hidden rounded-2xl ${blur ? "min-h-[440px]" : ""}`}>
      {blur && (
        <div className="pointer-events-none select-none blur-[2px] opacity-20 saturate-50">
          {children}
        </div>
      )}
      <div className={`${blur ? "absolute inset-0" : ""} flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-8`}>
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold-dark/10 border border-gold/30 flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.18)]">
          <span className="text-2xl">✦</span>
        </div>

        {/* Título */}
        <div className="text-center">
          <p className="text-base font-bold text-gold-dark leading-tight">{featureTitle}</p>
          <p className="text-xs text-slate-400 mt-0.5">Exclusivo Premium</p>
        </div>

        {/* Benefits */}
        <ul className="w-full max-w-xs flex flex-col gap-2">
          {resolvedBenefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="text-gold-dark mt-0.5 shrink-0">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <Link href="/perfil" className="w-full max-w-xs">
          <button className="btn-divine py-3.5 text-base w-full flex flex-col items-center gap-0.5">
            <span className="font-bold">✦ Assinar Premium</span>
            <span className="text-[11px] opacity-80 font-normal">R$ 9,90/mês · cancele quando quiser</span>
          </button>
        </Link>

        <p className="text-xs text-slate-400 italic text-center -mt-1">
          &ldquo;Crescer na graça e no conhecimento&rdquo; — 2 Pe 3:18
        </p>
      </div>
    </div>
  );
}
