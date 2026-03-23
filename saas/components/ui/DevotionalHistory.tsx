"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { usePlan } from "@/hooks/usePlan";

interface HistoryEntry {
  id: string;
  title: string;
  verseRef: string;
  theme: string | null;
  date: string;
  completedAt: string;
}

export function DevotionalHistory() {
  const { isPremium } = usePlan();
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchHistory = useCallback(async (theme?: string) => {
    setLoading(true);
    try {
      const url = theme ? `/api/devotional/history?theme=${encodeURIComponent(theme)}` : "/api/devotional/history";
      const res = await fetch(url);
      const d = await res.json();
      setHistory(d.history ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (open) fetchHistory(debouncedSearch || undefined);
  }, [open, debouncedSearch, fetchHistory]);

  return (
    <div className="divine-card overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 hover:bg-divine-50/50 transition-colors"
      >
        <div className="text-left">
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">Histórico</p>
          <p className="text-sm text-slate-500 mt-0.5">Devocionais anteriores</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 flex flex-col gap-3">
              {/* Search — PREMIUM only */}
              {isPremium && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por tema..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-divine-200 bg-divine-50/50 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                  />
                </div>
              )}

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-14 bg-divine-100/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-400">Nenhum devocional concluído ainda.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto custom-scroll pr-1">
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl border border-divine-100 bg-amber-50/20">
                      <div className="flex-shrink-0 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-gold-dark/70 leading-none">
                          {new Date(entry.date).toLocaleDateString("pt-BR", { month: "short" })}
                        </p>
                        <p className="text-lg font-bold text-gold leading-none tabular-nums">
                          {new Date(entry.date).getDate()}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-700 leading-tight">{entry.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{entry.verseRef}</p>
                        {entry.theme && (
                          <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest bg-divine-100 text-gold-dark px-1.5 py-0.5 rounded-full">
                            {entry.theme}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Gate for non-premium */}
              {!isPremium && history.length >= 7 && (
                <PremiumGate feature="Histórico completo" blur={false}>
                  <div className="p-3 rounded-xl border border-divine-100 text-center text-sm text-slate-400">
                    Ver mais devocionais...
                  </div>
                </PremiumGate>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
