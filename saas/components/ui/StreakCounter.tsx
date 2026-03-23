"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, CheckCircle2, Share2 } from "lucide-react";
import confetti from "canvas-confetti";

interface StreakCounterProps {
  days: number;
  longestStreak: number;
  completedToday: boolean;
  onComplete: () => void;
}

const MILESTONE_VERSES: Record<number, { verse: string; ref: string }> = {
  7:   { verse: "Bem-aventurado o homem que não anda segundo o conselho dos ímpios, nem para no caminho dos pecadores, nem se assenta na roda dos escarnecedores.", ref: "Salmos 1:1" },
  30:  { verse: "Corramos com perseverança a corrida que nos é proposta.", ref: "Hebreus 12:1" },
  100: { verse: "Aquele que perseverar até ao fim, esse será salvo.", ref: "Mateus 24:13" },
  365: { verse: "A misericórdia do Senhor dura para sempre para com os que o temem, e a sua justiça para os filhos dos filhos.", ref: "Salmos 103:17" },
};

export function StreakCounter({ days, longestStreak, completedToday, onComplete }: StreakCounterProps) {
  const [displayed, setDisplayed] = useState(0);
  const [showRecord, setShowRecord] = useState(false);
  const [celebrationMilestone, setCelebrationMilestone] = useState<number | null>(null);

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

  useEffect(() => {
    const MILESTONES = [7, 30, 100, 365];
    const hit = MILESTONES.find((m) => days === m);
    if (!hit) return;
    const key = `celebrated-milestone-${hit}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    setCelebrationMilestone(hit);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#D4AF37", "#F0D060", "#fff8e1", "#ffffff"] });
  }, [days]);

  const milestones = [7, 30, 90, 180, 365];
  const next = milestones.find((m) => m > days) ?? 365;
  const progress = Math.min((days / next) * 100, 100);

  return (
    <>
    <div className="divine-card p-5 flex flex-col items-center text-center gap-3 h-full">

      {/* Label + ações */}
      <div className="flex items-center justify-between w-full">
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-gold-dark">
          Ofensiva
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const text = `Estou no dia ${days} da minha ofensiva! 🔥 "Corramos com perseverança a corrida que nos é proposta" — Hb 12:1`;
              if (navigator.share) {
                navigator.share({ title: "Luz Divina", text, url: window.location.origin }).catch(() => {});
              } else {
                navigator.clipboard.writeText(text).catch(() => {});
              }
            }}
            aria-label="Compartilhar ofensiva"
            className="text-slate-400 hover:text-gold-dark transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowRecord((v) => !v)}
            className="text-xs font-medium tracking-wide text-slate-500 hover:text-gold-dark transition-colors"
          >
            {showRecord ? "← voltar" : "recorde"}
          </button>
        </div>
      </div>

      {/* Número destaque */}
      <AnimatePresence mode="wait">
        <motion.div
          key={showRecord ? "record" : "current"}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex flex-col items-center gap-2"
        >
          {/* Ring SVG + Flame */}
          <motion.div
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
          </motion.div>

          {/* Número + label centralizados */}
          <div className="flex flex-col items-center gap-0">
            <span
              className="font-serif text-6xl font-bold text-gold leading-none tracking-tight tabular-nums"
              style={{ textShadow: "0 0 30px rgba(212,175,55,0.3)" }}
            >
              {showRecord ? longestStreak : displayed}
            </span>
            <span className="text-sm font-medium text-slate-500 mt-1">
              {(showRecord ? longestStreak : days) === 1 ? "dia" : "dias"}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Subtítulo */}
      <p className="text-xs text-slate-500 leading-snug">
        {showRecord
          ? "Sua melhor sequência de todos os tempos"
          : `Próxima marca: ${next} dias`}
      </p>

      {/* Marcos */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex gap-1.5 w-full">
          {milestones.map((m) => (
            <div
              key={m}
              className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                days >= m ? "bg-gradient-to-r from-gold-dark to-gold" : "bg-divine-100"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between w-full px-0.5">
          {milestones.map((m) => (
            <span key={m} className={`text-[10px] font-semibold tabular-nums ${days >= m ? "text-gold-dark" : "text-slate-400"}`}>
              {days >= m ? "✓" : `${m}d`}
            </span>
          ))}
        </div>
      </div>

      {/* Botão CTA */}
      <motion.button
        onClick={() => {
          if (!completedToday) {
            navigator.vibrate?.(60);
            confetti({ particleCount: 80, spread: 70, colors: ["#D4AF37", "#F0D060", "#ffffff"], origin: { y: 0.6 } });
            onComplete();
          }
        }}
        disabled={completedToday}
        whileTap={completedToday ? {} : { scale: 0.96 }}
        className={`mt-auto w-full py-3.5 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
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

    <AnimatePresence>
      {celebrationMilestone !== null && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center"
          style={{ background: "linear-gradient(135deg, rgba(26,18,8,0.97) 0%, rgba(42,30,8,0.98) 100%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="flex flex-col items-center gap-6 max-w-sm"
          >
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold to-amber-600 flex items-center justify-center shadow-divine-lg">
              <span className="text-5xl">🔥</span>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold/70 mb-1">Ofensiva de</p>
              <p className="font-serif text-7xl font-bold text-gold leading-none">{celebrationMilestone}</p>
              <p className="font-serif text-2xl font-semibold text-amber-200 mt-1">dias!</p>
            </div>
            <div className="divine-card p-5 bg-white/5 border-gold/20">
              <blockquote className="font-serif text-sm italic text-amber-100 leading-relaxed">
                &ldquo;{MILESTONE_VERSES[celebrationMilestone]?.verse}&rdquo;
              </blockquote>
              <p className="text-xs font-semibold text-gold mt-2">— {MILESTONE_VERSES[celebrationMilestone]?.ref}</p>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ text: `🔥 ${celebrationMilestone} dias de ofensiva no Luz Divina! "${MILESTONE_VERSES[celebrationMilestone]?.verse}" — ${MILESTONE_VERSES[celebrationMilestone]?.ref}` }).catch(() => {});
                  }
                }}
                className="btn-divine py-3 text-sm"
              >
                Compartilhar conquista
              </button>
              <button
                onClick={() => setCelebrationMilestone(null)}
                className="text-sm text-amber-300/70 hover:text-amber-200 transition-colors py-2"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
