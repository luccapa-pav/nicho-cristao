"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { usePlan } from "@/hooks/usePlan";

function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  // Start week on Monday (1), Sunday = 0 → 6
  const startDow = (firstDay.getDay() + 6) % 7;
  const weeks: (Date | null)[][] = [];
  let week: (Date | null)[] = Array(startDow).fill(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    week.push(new Date(year, month, d));
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function StreakCalendar() {
  const { isPremium } = usePlan();
  const [dates, setDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  useEffect(() => {
    fetch("/api/streak/history")
      .then((r) => r.json())
      .then((d) => setDates(new Set(d.dates ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grid = buildMonthGrid(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const isNextDisabled = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  if (loading) {
    return (
      <div className="divine-card p-5 animate-pulse">
        <div className="h-4 bg-divine-100 rounded w-40 mb-4" />
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="w-8 h-8 bg-divine-100 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="divine-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">Minha Jornada</p>
        <div className="flex items-center gap-1">
          {isPremium && (
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-gold-dark hover:bg-divine-100 transition-all"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-xs font-medium text-slate-500 capitalize min-w-[130px] text-center">{monthLabel}</span>
          {isPremium && (
            <button
              onClick={nextMonth}
              disabled={isNextDisabled}
              className="p-1 rounded-lg text-slate-400 hover:text-gold-dark hover:bg-divine-100 transition-all disabled:opacity-30"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-wide pb-0.5">
            {d.charAt(0)}
          </div>
        ))}

        {/* Day cells */}
        {grid.flat().map((date, i) => {
          if (!date) return <div key={i} />;
          const key = date.toISOString().split("T")[0];
          const completed = dates.has(key);
          const isToday = key === today.toISOString().split("T")[0];
          const isFuture = date > today;

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.005 }}
              title={`${date.toLocaleDateString("pt-BR")}${completed ? " ✓" : ""}`}
              className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-medium transition-all ${
                isFuture
                  ? "text-slate-200"
                  : completed
                  ? "bg-gold text-white shadow-sm"
                  : isToday
                  ? "border-2 border-gold/40 text-gold-dark"
                  : "bg-divine-100/60 text-slate-400"
              }`}
            >
              {date.getDate()}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gold inline-block" /> Concluído</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-divine-100 inline-block" /> Não concluído</span>
      </div>

      {/* Premium gate for full history */}
      {!isPremium && (
        <PremiumGate feature="Histórico completo de 365 dias" blur={false}>
          <p className="text-xs text-center text-slate-400 py-2">Ver histórico completo</p>
        </PremiumGate>
      )}
    </div>
  );
}
