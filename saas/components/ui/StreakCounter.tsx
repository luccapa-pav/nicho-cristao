"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, CheckCircle2 } from "lucide-react";

interface StreakCounterProps {
  days: number;
  longestStreak: number;
  completedToday: boolean;
  onComplete: () => void;
}

export function StreakCounter({ days, longestStreak, completedToday, onComplete }: StreakCounterProps) {
  const [displayed, setDisplayed] = useState(0);
  const [showRecord, setShowRecord] = useState(false);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(days / 20);
    const timer = setInterval(() => {
      start += step;
      if (start >= days) { setDisplayed(days); clearInterval(timer); }
      else setDisplayed(start);
    }, 40);
    return () => clearInterval(timer);
  }, [days]);

  const milestones = [7, 30, 90, 180, 365];
  const next = milestones.find((m) => m > days) ?? 365;
  const progress = Math.min((days / next) * 100, 100);

  return (
    <div className="divine-card p-8 flex flex-col items-center text-center gap-4 h-full">

      {/* Label + toggle */}
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">
          Ofensiva
        </span>
        <button
          onClick={() => setShowRecord((v) => !v)}
          className="text-[0.6875rem] font-medium tracking-wide text-slate-400 hover:text-gold-dark transition-colors"
        >
          {showRecord ? "← voltar" : "recorde"}
        </button>
      </div>

      {/* Número destaque — centralizado */}
      <AnimatePresence mode="wait">
        <motion.div
          key={showRecord ? "record" : "current"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex flex-col items-center gap-1"
        >
          {/* Ring SVG + Flame */}
          <motion.span
            className="select-none"
            animate={{ rotate: [-2, 2, -2], scaleY: [1, 1.05, 0.97, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 72 72">
                <defs>
                  <linearGradient id="gold-ring" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A08020" />
                    <stop offset="100%" stopColor="#F0D060" />
                  </linearGradient>
                </defs>
                <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="3" />
                <circle cx="36" cy="36" r="32" fill="none" stroke="url(#gold-ring)" strokeWidth="3"
                  strokeLinecap="round" strokeDasharray="201"
                  strokeDashoffset={201 - (201 * progress) / 100}
                  style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                />
              </svg>
              <Flame className="w-8 h-8 text-gold relative z-10" />
            </div>
          </motion.span>
          <div className="relative flex items-end">
            <div className="absolute inset-0 rounded-full bg-gold/5 blur-xl" />
            <span
              className="font-serif text-7xl font-bold text-gold leading-[1] tracking-tight tabular-nums"
              style={{ textShadow: "0 0 40px rgba(212,175,55,0.35), 0 2px 8px rgba(212,175,55,0.2)" }}
            >
              {showRecord ? longestStreak : displayed}
            </span>
            <span className="ml-2 text-sm font-medium text-slate-400 self-end pb-2">
              {(showRecord ? longestStreak : days) === 1 ? "dia" : "dias"}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Subtítulo meta */}
      <p className="text-[0.6875rem] leading-snug text-slate-400">
        {showRecord
          ? "Sua melhor sequência de todos os tempos"
          : `Próxima marca: ${next} dias`}
      </p>

      {/* Labels de progresso de dias */}
      {!showRecord && (
        <div className="w-full">
          <div className="flex justify-between text-[0.625rem] leading-none text-slate-300 tabular-nums">
            <span>{days} dias</span>
            <span>{next} dias</span>
          </div>
        </div>
      )}

      {/* Marcos */}
      <div className="flex gap-1.5 w-full">
        {milestones.map((m) => (
          <div
            key={m}
            className={`flex-1 h-1 rounded-full transition-all duration-500 ${
              days >= m ? "bg-gradient-to-r from-gold-dark to-gold" : "bg-divine-100"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between w-full text-[0.5625rem] leading-none tabular-nums font-medium px-0.5">
        {milestones.map((m) => (
          <span key={m} className={days >= m ? "text-gold font-bold" : "text-slate-300/70"}>
            {days >= m ? "✓" : `${m}d`}
          </span>
        ))}
      </div>

      {/* Botão CTA */}
      <motion.button
        onClick={onComplete}
        disabled={completedToday}
        whileTap={completedToday ? {} : { scale: 0.96 }}
        className={`mt-auto w-full py-2.5 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
          completedToday
            ? "bg-gradient-to-r from-emerald-50 to-divine-50 border border-emerald-200/60 text-emerald-700 cursor-default"
            : "btn-divine"
        }`}
      >
        {completedToday ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Devocional concluído
          </>
        ) : (
          "Concluir devocional de hoje"
        )}
      </motion.button>
    </div>
  );
}
