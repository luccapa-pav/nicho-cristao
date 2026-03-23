"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, BookOpen, Lock } from "lucide-react";

interface Entry {
  day: number;
  reference: string;
  title?: string;
}

interface PlanDetail {
  id: string;
  name: string;
  slug: string;
  daysTotal: number;
  isPremium: boolean;
  isPremiumUser: boolean;
  entries: Entry[];
  progress?: { currentDay: number };
}

export default function PlanoLeituraDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [plan, setPlan]         = useState<PlanDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [marking, setMarking]   = useState<number | null>(null);

  const fetchPlan = useCallback(() => {
    fetch(`/api/reading/plans/${slug}`)
      .then((r) => r.json())
      .then((d) => setPlan(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  async function markDay(day: number) {
    if (!plan?.isPremiumUser) return;
    setMarking(day);
    try {
      const res = await fetch(`/api/reading/plans/${slug}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day }),
      });
      if (res.ok) {
        setPlan((p) => p ? { ...p, progress: { currentDay: day } } : p);
      }
    } finally {
      setMarking(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-2xl mx-auto animate-pulse flex flex-col gap-4">
        <div className="h-6 w-40 bg-divine-100 rounded-xl" />
        <div className="divine-card p-5 h-32 bg-divine-50" />
        {[0,1,2,3,4].map((i) => <div key={i} className="divine-card p-4 h-14 bg-divine-50" />)}
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-400">Plano não encontrado.</p>
        <Link href="/plano-leitura" className="text-gold-dark hover:underline text-sm mt-2 block">← Voltar</Link>
      </div>
    );
  }

  const currentDay = plan.progress?.currentDay ?? 0;
  const pct = Math.round((currentDay / plan.daysTotal) * 100);
  const isLocked = plan.isPremium && !plan.isPremiumUser;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/plano-leitura" className="flex items-center gap-1 text-sm text-slate-400 hover:text-gold-dark mb-5">
        <ArrowLeft className="w-4 h-4" /> Todos os planos
      </Link>

      {/* Header */}
      <div className="divine-card p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-gold-dark" />
          </div>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-bold text-slate-800">{plan.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">{plan.daysTotal} dias de leitura</p>
          </div>
        </div>
        {currentDay > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-500">Progresso</span>
              <span className="text-xs font-semibold text-gold-dark">Dia {currentDay}/{plan.daysTotal} · {pct}%</span>
            </div>
            <div className="h-2 bg-divine-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
        )}
      </div>

      {isLocked && (
        <div className="divine-card p-5 mb-4 flex items-center gap-3 bg-amber-50/50 border-amber-200">
          <Lock className="w-5 h-5 text-gold-dark flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-700">Plano Premium</p>
            <p className="text-xs text-slate-500">As 3 primeiras leituras são gratuitas. Assine para acessar tudo.</p>
          </div>
          <Link href="/assinar" className="text-xs text-gold-dark font-semibold hover:underline whitespace-nowrap">
            Assinar
          </Link>
        </div>
      )}

      {/* Entries */}
      <div className="flex flex-col gap-2">
        {plan.entries.map((entry, i) => {
          const done = entry.day <= currentDay;
          const isNext = entry.day === currentDay + 1;
          const locked = isLocked && i >= 3;

          return (
            <motion.div
              key={entry.day}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`divine-card p-4 flex items-center gap-4 transition-all ${
                isNext ? "border-gold/40 bg-amber-50/30" : ""
              } ${locked ? "opacity-50" : ""}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                done ? "bg-green-100 text-green-600" : isNext ? "bg-gold/20 text-gold-dark" : "bg-divine-100 text-slate-400"
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : entry.day}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">{entry.reference}</p>
                {entry.title && <p className="text-xs text-slate-400 truncate">{entry.title}</p>}
              </div>
              {isNext && !locked && (
                <button
                  onClick={() => markDay(entry.day)}
                  disabled={marking === entry.day}
                  className="text-xs font-semibold text-gold-dark hover:underline disabled:opacity-50 whitespace-nowrap"
                >
                  {marking === entry.day ? "..." : "Marcar lido"}
                </button>
              )}
              {locked && <Lock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
