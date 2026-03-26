"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, BookOpen, Heart, MessageSquareHeart, Sparkles, TrendingUp } from "lucide-react";

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
}

const VERSES = [
  { verse: "Tudo posso naquele que me fortalece.", ref: "Fp 4:13" },
  { verse: "O Senhor é minha força e meu escudo.", ref: "Sl 28:7" },
  { verse: "Porque sou eu que conheço os planos que tenho para vocês.", ref: "Jr 29:11" },
  { verse: "Firmai-vos, sede inabaláveis, sempre abundantes na obra do Senhor.", ref: "1 Co 15:58" },
];

function getMessage(d: ReportData): string {
  if (d.streakDays >= 30) return "Mês extraordinário — sua fidelidade inspira.";
  if (d.streakDays >= 15) return "Você está construindo algo sólido com Deus.";
  if (d.prayersAnswered >= 3) return "Deus tem respondido — continue crendo!";
  if (d.gratitudePosts >= 5) return "Seu coração transborda gratidão. Lindo!";
  return "Cada passo conta na caminhada de fé.";
}

export function MonthlyReport({ open, onClose }: MonthlyReportProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const verse = VERSES[new Date().getMonth() % VERSES.length];
  const month = new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  useEffect(() => {
    if (!open || data) return;
    setLoading(true);
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    fetch("/api/dashboard")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return;
        const mp = (d.prayers ?? []).filter((p: { createdAt: string }) => new Date(p.createdAt) >= monthStart);
        setData({
          streakDays: d.streak?.currentStreak ?? 0,
          longestStreak: d.streak?.longestStreak ?? 0,
          prayersAdded: mp.length,
          prayersAnswered: mp.filter((p: { status: string }) => p.status === "ANSWERED").length,
          gratitudePosts: (d.posts ?? []).filter((p: { createdAt: string }) => new Date(p.createdAt) >= monthStart).length,
        });
      })
      .finally(() => setLoading(false));
  }, [open, data]);

  const STATS = data ? [
    { icon: Flame,              label: "Ofensiva atual",  value: data.streakDays,      suffix: "dias",  color: "bg-amber-500" },
    { icon: TrendingUp,         label: "Maior sequência", value: data.longestStreak,   suffix: "dias",  color: "bg-gold" },
    { icon: Heart,              label: "Orações no mês",  value: data.prayersAdded,    suffix: "",      color: "bg-rose-400" },
    { icon: BookOpen,           label: "Respondidas",     value: data.prayersAnswered, suffix: "",      color: "bg-emerald-500" },
    { icon: MessageSquareHeart, label: "Gratidões",       value: data.gratitudePosts,  suffix: "",      color: "bg-violet-400" },
    { icon: Sparkles,           label: "Taxa de resposta",
      value: data.prayersAdded > 0 ? Math.round((data.prayersAnswered / data.prayersAdded) * 100) : 0,
      suffix: "%", color: "bg-divine-400" },
  ] : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative divine-card w-full max-w-sm mb-4 md:mb-0 overflow-hidden"
            initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 32, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            {/* Glow topo */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-gold/12 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-start justify-between px-6 pt-6 pb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-0.5">Balanço de Fé</p>
                <h2 className="font-serif text-2xl font-bold text-slate-800 capitalize leading-tight">{month}</h2>
                {data && (
                  <p className="text-xs text-slate-400 italic mt-1">&ldquo;{getMessage(data)}&rdquo;</p>
                )}
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-divine-50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-px bg-divine-100 mx-6" />

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Sparkles className="w-5 h-5 text-gold animate-pulse" />
                <p className="text-xs text-slate-400">Carregando...</p>
              </div>
            ) : data ? (
              <div className="px-6 pb-6 pt-4 flex flex-col gap-3">

                {/* Stats — lista alinhada */}
                <div className="flex flex-col gap-2">
                  {STATS.map(({ icon: Icon, label, value, suffix, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className="flex-1 text-sm text-slate-600">{label}</p>
                      <p className="text-lg font-bold text-slate-800 tabular-nums leading-none">
                        {value}<span className="text-xs font-medium text-slate-400 ml-0.5">{suffix}</span>
                      </p>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-divine-100" />

                {/* Versículo */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gold-dark/50 mb-2">Palavra do mês</p>
                  <p className="font-serif text-sm italic text-slate-700 leading-relaxed">
                    &ldquo;{verse.verse}&rdquo;
                  </p>
                  <p className="text-xs font-semibold text-gold-dark mt-1.5">— {verse.ref}</p>
                </div>
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
