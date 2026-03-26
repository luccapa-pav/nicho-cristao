"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Lock, ChevronRight } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { PageSymbolCard } from "@/components/ui/PageBackground";

interface Plan {
  id: string;
  name: string;
  slug: string;
  daysTotal: number;
  isPremium: boolean;
  progress?: { currentDay: number; startedAt: string };
}

export default function PlanoLeituraPage() {
  const { isPremium } = usePlan();
  const [plans, setPlans]   = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reading/plans")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setPlans(d.plans ?? []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold text-slate-800">Planos de Leitura</h1>
        <p className="text-sm text-slate-400 mt-1">Leia a Bíblia com estrutura e consistência</p>
      </div>

      <PageSymbolCard symbol="crown-thorns" />

      {loading && (
        <div className="flex flex-col gap-3 animate-pulse">
          {[0,1,2].map((i) => (
            <div key={i} className="divine-card p-5 h-24 bg-divine-50" />
          ))}
        </div>
      )}

      {!loading && plans.length === 0 && (
        <div className="divine-card p-10 flex flex-col items-center gap-3 text-center">
          <BookOpen className="w-10 h-10 text-divine-200" />
          <h2 className="font-semibold text-slate-600">Comece um plano de leitura hoje 📖</h2>
          <p className="text-sm text-slate-400">Novos planos serão adicionados em breve. Fique atento!</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {plans.map((plan, i) => {
          const locked = false;
          const progress = plan.progress;
          const pct = progress ? Math.round((progress.currentDay / plan.daysTotal) * 100) : 0;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              {locked ? (
                <div className="divine-card p-5 flex items-center gap-4 opacity-70">
                  <div className="w-12 h-12 rounded-2xl bg-divine-100 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 truncate">{plan.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{plan.daysTotal} dias · Premium</p>
                  </div>
                  <Link href="/assinar" className="text-xs text-gold-dark font-semibold hover:underline">
                    Assinar
                  </Link>
                </div>
              ) : (
                <Link href={`/plano-leitura/${plan.slug}`}>
                  <div className="divine-card p-5 flex items-center gap-4 hover:border-gold/30 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-gold-dark" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{plan.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.daysTotal} dias{plan.isPremium ? " · Premium" : ""}</p>
                      {progress && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">Dia {progress.currentDay}/{plan.daysTotal}</span>
                            <span className="text-xs text-gold-dark font-semibold">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-divine-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                      {!progress && (
                        <p className="text-xs text-gold-dark mt-1 font-medium">Começar plano →</p>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                  </div>
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
    </>
  );
}
