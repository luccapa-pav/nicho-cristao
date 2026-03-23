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
  const [open, setOpen] = useState(true);
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

  const FREE_LIMIT = 3;
  const visibleHistory = isPremium ? history : history.slice(0, FREE_LIMIT);
  const hasMore = !isPremium && history.length >= FREE_LIMIT;

  return (
    <div className="divine-card overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-divine-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">Histórico</p>
          {history.length > 0 && (
            <span className="text-[10px] font-bold bg-divine-100 text-gold-dark px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2">
              {/* Search — PREMIUM only */}
              {isPremium && (
                <div className="relative mb-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por tema..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-divine-200 bg-divine-50/50 text-xs text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                  />
                </div>
              )}

              {loading ? (
                <div className="space-y-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-divine-100/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-slate-400">Nenhum devocional concluído ainda.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto custom-scroll pr-0.5">
                    {visibleHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-divine-100 bg-amber-50/20 hover:bg-amber-50/40 transition-colors">
                        <div className="flex-shrink-0 w-8 text-center">
                          <p className="text-[8px] font-bold uppercase tracking-wide text-gold-dark/60 leading-none">
                            {new Date(entry.date).toLocaleDateString("pt-BR", { month: "short" })}
                          </p>
                          <p className="text-sm font-bold text-gold leading-none tabular-nums">
                            {new Date(entry.date).getDate()}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-700 leading-tight line-clamp-1">{entry.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{entry.verseRef}</p>
                        </div>
                        {entry.theme && (
                          <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-widest bg-divine-100 text-gold-dark px-1.5 py-0.5 rounded-full hidden sm:inline">
                            {entry.theme}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Upsell para free após 3 entradas */}
                  {hasMore && (
                    <div className="mt-1 rounded-xl border border-gold/30 bg-gradient-to-br from-amber-50 to-divine-50 p-3 text-center">
                      <p className="text-xs font-semibold text-slate-700">
                        Você tem mais devocionais no histórico
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 italic">
                        "Guarda no coração os mandamentos que te ensino." — Pv 3:1
                      </p>
                      <a
                        href="/perfil"
                        className="inline-block mt-2 text-[11px] font-bold text-gold-dark bg-white border border-gold/40 rounded-full px-3 py-1 hover:bg-divine-50 transition-colors"
                      >
                        ✦ Ver todo o histórico com Premium
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
