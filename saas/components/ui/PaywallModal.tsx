"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

const FEATURE_BENEFITS: Record<string, string[]> = {
  "Plano de Leitura": [
    "Leia a Bíblia inteira em 1 ano",
    "Planos temáticos por assunto",
    "Progresso salvo automaticamente",
  ],
  "Devocional Narrado": [
    "Ouça o devocional em voz natural",
    "Perfeito para momentos de trânsito ou descanso",
    "Voz em português com qualidade profissional",
  ],
  "Histórico completo": [
    "Veja todos os seus dias de fidelidade",
    "Calendário anual de check-ins",
    "Exporte seu relatório mensal",
  ],
  "Relatório Mensal": [
    "Veja o padrão de Deus nas suas orações",
    "Estatísticas da sua jornada espiritual",
    "Compartilhe com sua fraternidade",
  ],
  "Música ambiente": [
    "Sons relaxantes para foco em oração",
    "4 ambientes: natureza, chuva, coral, silêncio",
    "Ajuste o volume sem sair da oração",
  ],
};

function getBenefits(feature?: string): string[] {
  if (!feature) {
    return [
      "Acesso completo a todos os recursos",
      "Devocionais narrados e planos de leitura",
      "Histórico espiritual de 365 dias",
    ];
  }
  for (const key of Object.keys(FEATURE_BENEFITS)) {
    if (feature.includes(key)) return FEATURE_BENEFITS[key];
  }
  return [
    "Aprofunde sua vida espiritual",
    "Recursos exclusivos para crescer na fé",
    "Acompanhe sua jornada com Deus",
  ];
}

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
  benefits?: string[];
}

export function PaywallModal({ open, onClose, feature, benefits }: PaywallModalProps) {
  const resolvedBenefits = benefits ?? getBenefits(feature);
  const featureTitle = feature ? feature.split(" —")[0] : "Recurso Premium";

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm bg-white dark:bg-black rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 relative">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
                aria-label="Fechar"
              >
                ✕
              </button>

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
              <ul className="w-full flex flex-col gap-2">
                {resolvedBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="text-gold-dark mt-0.5 shrink-0">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/assinar" className="w-full" onClick={onClose}>
                <button className="btn-divine py-3.5 text-base w-full flex flex-col items-center gap-0.5">
                  <span className="font-bold">✦ Quero crescer na fé</span>
                  <span className="text-[11px] opacity-80 font-normal">Assine e desbloqueie todos os recursos</span>
                </button>
              </Link>

              <p className="text-xs text-slate-400 italic text-center -mt-1">
                &ldquo;Crescer na graça e no conhecimento&rdquo; — 2 Pe 3:18
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
