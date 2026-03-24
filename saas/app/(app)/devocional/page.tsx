"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, Lock, CheckCircle2, Sparkles, Star } from "lucide-react";
import Link from "next/link";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { usePlan } from "@/hooks/usePlan";

interface ReadingEntry {
  id: string;
  day: number;
  reference: string;
  title?: string;
}

interface ReadingPlan {
  id: string;
  name: string;
  slug: string;
  daysTotal: number;
  isPremium: boolean;
  currentDay: number;
  entries?: ReadingEntry[];
}

export default function DevocionalPage() {
  const { isPremium } = usePlan();
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [planEntries, setPlanEntries] = useState<Record<string, ReadingEntry[]>>({});
  const [marking, setMarking] = useState<string | null>(null);
  const [premiumGroupOpen, setPremiumGroupOpen] = useState(true);

  useEffect(() => {
    fetch("/api/reading/plans")
      .then((r) => r.ok ? r.json() : [])
      .then((data: ReadingPlan[]) => {
        setPlans(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleExpand = async (slug: string) => {
    if (expanded === slug) { setExpanded(null); return; }
    setExpanded(slug);
    if (!planEntries[slug]) {
      const res = await fetch(`/api/reading/plans/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setPlanEntries((prev) => ({ ...prev, [slug]: data.entries ?? [] }));
      }
    }
  };

  const handleMarkDay = async (slug: string) => {
    setMarking(slug);
    const res = await fetch(`/api/reading/plans/${slug}/progress`, { method: "POST" });
    if (res.ok) {
      setPlans((prev) => prev.map((p) => p.slug === slug ? { ...p, currentDay: p.currentDay + 1 } : p));
    }
    setMarking(null);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
      <p className="text-sm text-slate-400">Carregando seus planos de leitura...</p>
    </div>
  );

  const freePlans   = plans.filter((p) => isPremium || !p.isPremium);
  const lockedPlans = plans.filter((p) => !isPremium && p.isPremium);

  return (
    <div className="min-h-screen bg-gradient-to-b from-divine-50 via-amber-50/30 to-white">
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-32 md:pb-14 flex flex-col gap-7">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-divine-50 via-amber-50/60 to-divine-100/50 p-6 sm:p-8 text-center"
        style={{ boxShadow: "0 0 80px rgba(212,175,55,0.14), 0 8px 32px rgba(212,175,55,0.08)" }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.18) 0%, transparent 70%)" }} />

        <motion.div className="relative mb-4 inline-flex items-center justify-center">
          <div className="absolute w-24 h-24 rounded-full border border-gold/30 animate-[pulse-gold_2.5s_ease-in-out_infinite]" />
          <div className="absolute w-16 h-16 rounded-full bg-gold/[0.08] animate-[pulse-gold_2.5s_ease-in-out_infinite_0.5s]" />
          <motion.span
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="relative text-5xl sm:text-6xl drop-shadow-md select-none z-10 py-4"
          >📖</motion.span>
        </motion.div>

        <p className="relative text-sm font-semibold uppercase tracking-widest text-gold-dark">
          Crescimento Espiritual
        </p>
        <h1 className="relative font-serif text-3xl sm:text-4xl text-slate-800 mt-2 leading-tight">
          Planos de Leitura
        </h1>
        <div className="relative mt-5 mx-auto max-w-sm">
          <div className="verse-highlight text-base">
            <p className="italic">&ldquo;Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.&rdquo;</p>
            <p className="text-sm font-semibold text-gold-dark mt-2 not-italic text-center">— Salmos 119:105</p>
          </div>
        </div>
      </motion.div>

      <div className="divine-divider -my-1" />

      {/* Plans grid */}
      <div className="flex flex-col gap-5">
        {freePlans.map((plan, i) => {
          const progress = plan.daysTotal > 0 ? Math.min((plan.currentDay / plan.daysTotal) * 100, 100) : 0;
          const isOpen = expanded === plan.slug;
          const entries = planEntries[plan.slug] ?? [];
          const canProgress = isPremium || !plan.isPremium;
          const isCompleted = canProgress && plan.currentDay >= plan.daysTotal;
          const isInProgress = canProgress && plan.currentDay > 0 && !isCompleted;
          const isLocked = !canProgress;

          const cardStyle: React.CSSProperties = isCompleted
            ? { boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(52,211,153,0.12), inset 0 1px 0 rgba(255,255,255,0.9)" }
            : isLocked
            ? { boxShadow: "0 0 20px rgba(212,175,55,0.15), 0 4px 16px rgba(212,175,55,0.10), inset 0 1px 0 rgba(255,255,255,0.9)" }
            : isInProgress
            ? { boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 32px rgba(212,175,55,0.14), inset 0 1px 0 rgba(255,255,255,0.9)" }
            : {};

          const cardBorderClass = isCompleted
            ? "border-emerald-200"
            : isLocked
            ? "border-gold/40"
            : isInProgress
            ? "border-amber-300"
            : "border-divine-100";

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative overflow-hidden rounded-2xl bg-white transition-all duration-300 ${cardBorderClass} border`}
              style={cardStyle}
            >
              {/* Faixa de celebração — plano CONCLUÍDO */}
              {isCompleted && (
                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-gradient-to-r from-emerald-50 via-emerald-100/80 to-emerald-50 border-b border-emerald-200">
                  <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-400" />
                  <span className="text-xs font-bold text-emerald-700 tracking-wide uppercase">Plano Concluído — Parabéns!</span>
                  <Star className="w-3.5 h-3.5 text-emerald-500 fill-emerald-400" />
                </div>
              )}

              {/* Brilho de fundo — plano PREMIUM BLOQUEADO */}
              {isLocked && (
                <div className="absolute inset-0 pointer-events-none rounded-2xl"
                  style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.06) 0%, transparent 50%, rgba(212,175,55,0.04) 100%)" }} />
              )}

              {/* Corpo principal */}
              <div className="p-5 sm:p-6 flex flex-col gap-4">

                {/* Linha 1: Ícone + Título + Badge */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCompleted ? "bg-gradient-to-br from-emerald-100 to-emerald-200"
                    : isLocked   ? "bg-gradient-to-br from-gold/20 to-amber-200/60"
                    :              "bg-gradient-to-br from-gold/20 to-amber-100"
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    : isLocked   ? <Lock className="w-5 h-5 text-gold-dark" />
                    :              <BookOpen className="w-5 h-5 text-gold-dark" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-800 leading-tight">{plan.name}</h3>
                      {plan.isPremium && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-dark px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30 tracking-wide uppercase whitespace-nowrap">
                          <Sparkles className="w-2.5 h-2.5" /> Premium
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{plan.daysTotal} dias de leitura bíblica</p>
                  </div>
                </div>

                {/* Barra de progresso — em progresso ou concluído */}
                {(isInProgress || isCompleted) && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Dia {plan.currentDay} de {plan.daysTotal}</span>
                      <span className="text-sm font-bold text-gold-dark tabular-nums">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-divine-100 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${isCompleted ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-gold to-amber-400"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.9, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}

                {/* Barra vazia — não iniciado (free) */}
                {!isInProgress && !isCompleted && !isLocked && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400 italic">Não iniciado ainda</span>
                      <span className="text-xs text-slate-400">0%</span>
                    </div>
                    <div className="h-3 rounded-full bg-divine-100 overflow-hidden" />
                  </div>
                )}

                {/* CTA */}
                <div className="flex flex-col gap-2">
                  {isCompleted && (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700">Você completou este plano!</span>
                    </div>
                  )}
                  {(isInProgress || (!isInProgress && !isCompleted && !isLocked)) && (
                    <button
                      onClick={() => handleMarkDay(plan.slug)}
                      disabled={marking === plan.slug}
                      className="btn-divine w-full rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {marking === plan.slug ? (
                        <><span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Salvando...</>
                      ) : isInProgress ? (
                        <><CheckCircle2 className="w-4 h-4" /> Marcar dia {plan.currentDay + 1} como lido</>
                      ) : (
                        <><BookOpen className="w-4 h-4" /> Começar o 1º dia de leitura</>
                      )}
                    </button>
                  )}
                  {isLocked && (
                    <div className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-divine-50 to-amber-50/60 border border-gold/20 p-4">
                      <div className="verse-highlight text-sm py-1">
                        <p className="italic leading-relaxed">&ldquo;Mergulhe mais fundo na Palavra — toda Escritura é inspirada por Deus.&rdquo;</p>
                        <p className="text-xs font-semibold text-gold-dark mt-1.5 not-italic">— 2 Tm 3:16</p>
                      </div>
                      <Link href="/assinar" className="w-full">
                        <button className="btn-divine w-full rounded-xl text-sm flex items-center justify-center gap-2">
                          <Sparkles className="w-4 h-4" /> Desbloquear e mergulhar na Palavra
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer clicável — Expand/Collapse */}
              <button
                onClick={() => handleExpand(plan.slug)}
                className="w-full flex items-center justify-center gap-2 py-3 border-t border-divine-100 text-sm text-slate-400 hover:text-gold-dark hover:bg-divine-50/60 transition-colors"
                aria-label={isOpen ? "Ocultar dias" : "Ver dias do plano"}
              >
                <span className="font-medium">{isOpen ? "Ocultar dias" : `Ver os ${plan.daysTotal} dias`}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="inline-flex">
                  <ChevronDown className="w-4 h-4" />
                </motion.span>
              </button>

              {/* Entries expandidas */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="overflow-hidden border-t border-divine-100"
                  >
                    {plan.isPremium && !isPremium ? (
                      <PremiumGate feature="Plano de Leitura completo" blur>
                        <div className="p-5 flex flex-col gap-3">
                          {[1, 2, 3].map((d) => (
                            <div key={d} className="flex items-center gap-3 py-2 border-b border-divine-50 last:border-0">
                              <span className="w-10 h-10 rounded-full bg-divine-100 flex items-center justify-center text-xs font-bold text-gold-dark flex-shrink-0">{d}</span>
                              <div className="flex flex-col gap-1.5 flex-1">
                                <div className="h-3 bg-divine-100 rounded w-3/4" />
                                <div className="h-2.5 bg-divine-50 rounded w-1/3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </PremiumGate>
                    ) : (
                      <div className="p-5 flex flex-col gap-1 max-h-96 overflow-y-auto custom-scroll">
                        {entries.length === 0 ? (
                          <div className="py-8 text-center flex flex-col items-center gap-2">
                            <div className="w-7 h-7 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                            <p className="text-sm text-slate-400">Carregando os dias...</p>
                          </div>
                        ) : (
                          entries.map((entry) => {
                            const done = entry.day <= plan.currentDay;
                            const isCurrent = entry.day === plan.currentDay + 1;
                            return (
                              <div
                                key={entry.id}
                                className={`flex items-center gap-3 py-3 border-b border-divine-50 last:border-0 px-1 rounded-lg transition-colors ${isCurrent ? "bg-amber-50/60" : ""}`}
                              >
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                  done    ? "bg-emerald-100 text-emerald-700 shadow-[0_0_0_2px_rgba(52,211,153,0.25)]"
                                  : isCurrent ? "bg-gradient-to-br from-gold/30 to-amber-200 text-gold-dark shadow-[0_0_8px_rgba(212,175,55,0.35)]"
                                  :             "bg-divine-100 text-slate-500"
                                }`}>
                                  {done ? <CheckCircle2 className="w-4 h-4" /> : entry.day}
                                </span>
                                <div className="min-w-0 flex-1">
                                  {entry.title && (
                                    <p className={`text-sm font-semibold leading-snug ${done ? "text-emerald-700" : isCurrent ? "text-slate-800" : "text-slate-600"}`}>
                                      {entry.title}
                                    </p>
                                  )}
                                  <p className={`text-xs mt-0.5 font-medium ${done ? "text-emerald-500" : isCurrent ? "text-gold-dark" : "text-amber-600/80"}`}>
                                    {entry.reference}
                                  </p>
                                </div>
                                {isCurrent && (
                                  <span className="flex-shrink-0 text-[10px] font-bold text-gold-dark bg-gold/10 border border-gold/30 px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
                                    Hoje
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          );
        })}

        {/* ── Grupo Premium bloqueado — todos juntos num único container ── */}
        {lockedPlans.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: freePlans.length * 0.08 }}
            className="relative overflow-hidden rounded-2xl border border-gold/40"
            style={{ boxShadow: "0 0 24px rgba(212,175,55,0.18), 0 4px 16px rgba(212,175,55,0.10)" }}
          >
            {/* Brilho de fundo */}
            <div className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.07) 0%, transparent 50%, rgba(212,175,55,0.04) 100%)" }} />

            {/* Header do grupo — clicável para minimizar */}
            <button
              onClick={() => setPremiumGroupOpen(v => !v)}
              className="relative w-full flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gold/20 hover:bg-amber-50/30 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-amber-200/60 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-gold-dark" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-gold-dark uppercase tracking-wide">✦ Planos Premium</p>
                <p className="text-xs text-slate-500 mt-0.5">Desbloqueie os {lockedPlans.length} planos abaixo de uma vez</p>
              </div>
              <motion.span
                animate={{ rotate: premiumGroupOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="inline-flex flex-shrink-0"
              >
                <ChevronDown className="w-4 h-4 text-gold-dark" />
              </motion.span>
            </button>

            {/* Conteúdo colapsável */}
            <AnimatePresence initial={false}>
              {premiumGroupOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  {/* Cards dos planos bloqueados */}
                  <div className="relative flex flex-col divide-y divide-gold/10">
                    {lockedPlans.map((plan) => (
                      <div key={plan.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/15 to-amber-100/60 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-4 h-4 text-gold-dark" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-base font-bold text-slate-800 leading-tight">{plan.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{plan.daysTotal} dias de leitura bíblica</p>
                          <div className="mt-2 h-2 rounded-full bg-divine-100 overflow-hidden">
                            <div className="h-full w-0 rounded-full bg-gradient-to-r from-gold/40 to-amber-300/40" />
                          </div>
                        </div>
                        <Lock className="w-4 h-4 text-gold/50 flex-shrink-0" />
                      </div>
                    ))}
                  </div>

                  {/* CTA único */}
                  <div className="relative px-5 pb-5 pt-4 flex flex-col gap-3 border-t border-gold/10">
                    <div className="verse-highlight text-sm py-1">
                      <p className="italic leading-relaxed text-center">&ldquo;Toda Escritura é inspirada por Deus e útil para ensinar, para redarguir, para corrigir.&rdquo;</p>
                      <p className="text-xs font-semibold text-gold-dark mt-1.5 not-italic text-center">— 2 Tm 3:16</p>
                    </div>
                    <Link href="/perfil" className="w-full">
                      <button className="btn-divine w-full rounded-xl text-sm flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        Desbloquear os {lockedPlans.length} planos com Premium
                      </button>
                    </Link>
                    <p className="text-xs text-slate-400 text-center">Cancele quando quiser</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {plans.length === 0 && (
          <div className="divine-card text-center py-16 flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-divine-50 border border-divine-200 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-gold/60" />
            </div>
            <p className="font-serif text-xl text-slate-600">Nenhum plano disponível</p>
            <p className="text-sm text-slate-400 italic">&ldquo;Busca a Deus e viverás&rdquo; — Amós 5:4</p>
            <p className="text-xs text-slate-400">Verifique novamente em breve.</p>
          </div>
        )}
      </div>

    </div>
    </div>
  );
}
