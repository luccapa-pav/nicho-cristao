"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, ChevronUp, Lock, CheckCircle2 } from "lucide-react";
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
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="w-full px-6 md:px-10 py-10 md:py-14">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-10 text-center"
      >
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-1">Crescimento</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
          Planos de Leitura
        </h1>
        <p className="text-lg text-slate-500 mt-2 max-w-md mx-auto">
          Mergulhe na Palavra de Deus com planos estruturados de leitura bíblica.
        </p>
      </motion.div>

      {/* Plans grid */}
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {plans.map((plan, i) => {
          const progress = plan.daysTotal > 0 ? Math.min((plan.currentDay / plan.daysTotal) * 100, 100) : 0;
          const isOpen = expanded === plan.slug;
          const entries = planEntries[plan.slug] ?? [];
          const canProgress = isPremium || !plan.isPremium;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="divine-card overflow-hidden"
            >
              {/* Card header */}
              <div className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/20 to-amber-100 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-gold-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-serif text-xl font-bold text-slate-800">{plan.name}</h3>
                    {plan.isPremium && (
                      <span className="flex items-center gap-1 text-xs font-bold text-gold-dark px-2 py-0.5 rounded-full bg-gold/10 border border-gold/30">
                        <Lock className="w-3 h-3" /> Premium
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{plan.daysTotal} dias de leitura</p>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Dia {plan.currentDay} de {plan.daysTotal}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-divine-100 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {canProgress && plan.currentDay < plan.daysTotal && (
                    <button
                      onClick={() => handleMarkDay(plan.slug)}
                      disabled={marking === plan.slug}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold text-white text-xs font-semibold hover:bg-gold-dark transition-colors disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {marking === plan.slug ? "..." : "Marcar lido"}
                    </button>
                  )}
                  {!canProgress && (
                    <Link
                      href="/perfil"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-divine-50 border border-gold/30 text-xs font-semibold text-gold-dark hover:bg-divine-100 transition-colors"
                    >
                      <Lock className="w-3 h-3" /> Desbloquear
                    </Link>
                  )}
                  <button
                    onClick={() => handleExpand(plan.slug)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-gold hover:bg-divine-50 transition-colors"
                    aria-label={isOpen ? "Recolher" : "Expandir"}
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded entries */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden border-t border-divine-100"
                  >
                    {plan.isPremium && !isPremium ? (
                      <PremiumGate feature="Plano de Leitura completo" blur>
                        <div className="p-4 flex flex-col gap-2">
                          {[1, 2, 3].map((d) => (
                            <div key={d} className="flex items-center gap-3 py-2 border-b border-divine-50 last:border-0">
                              <span className="w-8 h-8 rounded-full bg-divine-100 flex items-center justify-center text-xs font-bold text-gold-dark">
                                {d}
                              </span>
                              <div className="h-3 bg-divine-100 rounded flex-1" />
                            </div>
                          ))}
                        </div>
                      </PremiumGate>
                    ) : (
                      <div className="p-4 flex flex-col gap-0 max-h-72 overflow-y-auto custom-scroll">
                        {entries.length === 0 ? (
                          <div className="py-6 text-center text-sm text-slate-400">Carregando...</div>
                        ) : (
                          entries.map((entry) => (
                            <div
                              key={entry.id}
                              className={`flex items-center gap-3 py-2.5 border-b border-divine-50 last:border-0 ${entry.day <= plan.currentDay ? "opacity-50" : ""}`}
                            >
                              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                entry.day <= plan.currentDay
                                  ? "bg-gold/20 text-gold-dark"
                                  : "bg-divine-100 text-slate-500"
                              }`}>
                                {entry.day <= plan.currentDay ? "✓" : entry.day}
                              </span>
                              <div className="min-w-0">
                                {entry.title && (
                                  <p className="text-sm font-medium text-slate-700 truncate">{entry.title}</p>
                                )}
                                <p className="text-xs text-slate-500">{entry.reference}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {plans.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center gap-3">
            <BookOpen className="w-12 h-12 text-divine-200" />
            <p className="font-serif text-xl text-slate-500">Nenhum plano disponível</p>
            <p className="text-sm text-slate-400">Verifique novamente em breve.</p>
          </div>
        )}
      </div>

      <div className="h-10" />
    </div>
  );
}
