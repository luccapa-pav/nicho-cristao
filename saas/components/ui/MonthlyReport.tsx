"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Heart, Flame, BookOpen, Loader2 } from "lucide-react";

interface MonthlyReportProps {
  open: boolean;
  onClose: () => void;
}

interface ReportData {
  streakDays: number;
  longestStreak: number;
  prayersAdded: number;
  prayersAnswered: number;
  gratitudePosts: number;
  devotionalsCompleted: number;
}

const MOTIVATIONAL_VERSES = [
  { verse: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { verse: "O Senhor é minha força e meu escudo.", ref: "Salmos 28:7" },
  { verse: "Porque sou eu que conheço os planos que tenho para vocês.", ref: "Jeremias 29:11" },
];

export function MonthlyReport({ open, onClose }: MonthlyReportProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const motivVerse = MOTIVATIONAL_VERSES[new Date().getMonth() % MOTIVATIONAL_VERSES.length];

  useEffect(() => {
    if (!open || data) return;
    setLoading(true);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    fetch("/api/dashboard")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        const monthlyPrayers = (d.prayers ?? []).filter((p: { createdAt: string }) => new Date(p.createdAt) >= monthStart);
        setData({
          streakDays: d.streak?.currentStreak ?? 0,
          longestStreak: d.streak?.longestStreak ?? 0,
          prayersAdded: monthlyPrayers.length,
          prayersAnswered: monthlyPrayers.filter((p: { status: string }) => p.status === "ANSWERED").length,
          gratitudePosts: (d.posts ?? []).filter((p: { createdAt: string }) => new Date(p.createdAt) >= monthStart).length,
          devotionalsCompleted: 0,
        });
      })
      .finally(() => setLoading(false));
  }, [open, data]);

  const month = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative divine-card w-full max-w-md p-6 mb-4 md:mb-0 space-y-5 max-h-[85vh] overflow-y-auto"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark">Relatório</p>
                <h2 className="font-serif text-xl font-bold text-slate-800 capitalize">{month}</h2>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="divine-divider" />

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gold" />
              </div>
            ) : data ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Flame,      label: "Ofensiva atual",    value: `${data.streakDays} dias`,         color: "text-amber-500" },
                    { icon: TrendingUp, label: "Maior sequência",   value: `${data.longestStreak} dias`,      color: "text-gold-dark" },
                    { icon: Heart,      label: "Orações",           value: `${data.prayersAdded} adicionadas`, color: "text-rose-400" },
                    { icon: BookOpen,   label: "Respondidas",       value: `${data.prayersAnswered} orações`,  color: "text-emerald-500" },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div key={label} className="p-4 rounded-2xl bg-divine-50 border border-divine-200 flex flex-col gap-1">
                      <Icon className={`w-5 h-5 ${color}`} />
                      <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
                      <p className="text-sm font-bold text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>

                <div className="divine-card p-4 bg-amber-50/50 border-gold/20">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-gold-dark mb-2">Versículo do mês</p>
                  <blockquote className="font-serif text-sm italic text-slate-700 leading-relaxed">
                    &ldquo;{motivVerse.verse}&rdquo;
                  </blockquote>
                  <p className="text-xs font-semibold text-gold-dark mt-1.5">— {motivVerse.ref}</p>
                </div>
              </>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
