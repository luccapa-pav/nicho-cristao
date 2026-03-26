"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Play, Minus, Plus } from "lucide-react";
import Link from "next/link";

interface PrayerConfigModalProps {
  open: boolean;
  onClose: () => void;
  onStart: (minutes: number, startWithMusic: boolean) => void;
  isPremium: boolean;
}

const MUSIC_OPTIONS = [
  { id: "piano",  emoji: "🎹", label: "Piano"    },
  { id: "rain",   emoji: "🌧️", label: "Chuva"    },
  { id: "nature", emoji: "🌿", label: "Natureza" },
];

const GOLD         = "#D4AF37";
const GOLD_LIGHT   = "#F0D060";
const GOLD_DARK    = "#A08020";
const TEXT_MUTED   = "#6B7280";

const BTN_GOLD_BG  = "linear-gradient(135deg, #D4AF37 0%, #A08020 100%)";
const BTN_GOLD_SHD = "0 4px 16px rgba(212,175,55,0.35), 0 1px 4px rgba(0,0,0,0.4)";

export function PrayerConfigModal({ open, onClose, onStart, isPremium }: PrayerConfigModalProps) {
  const [minutes, setMinutes] = useState(10);
  const [showHint, setShowHint] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState<string | null>(null);
  const [showMusicUpsell, setShowMusicUpsell] = useState(false);

  const increment = () => {
    const next = minutes + 1;
    if (!isPremium && next > 10) {
      setShowHint(true);
      return;
    }
    setMinutes(next);
    setShowHint(false);
  };

  const decrement = () => {
    if (minutes <= 1) return;
    setMinutes((m) => m - 1);
    setShowHint(false);
  };

  const handleMusicClick = (id: string) => {
    if (!isPremium) {
      setShowMusicUpsell(true);
      return;
    }
    setSelectedMusic(selectedMusic === id ? null : id);
    setShowMusicUpsell(false);
  };

  const handleStart = () => {
    onStart(minutes, selectedMusic !== null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative w-full max-w-sm rounded-3xl p-6 flex flex-col gap-6 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0f0f0f 0%, #131313 100%)",
          border: "1px solid rgba(212,175,55,0.20)",
          boxShadow: "0 0 60px rgba(212,175,55,0.07), 0 40px 80px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* Subtle cross-crown texture */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            backgroundImage: "url('/cross-crown.svg')",
            backgroundSize: "55%",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            opacity: 0.025,
          }}
        />

        {/* ── Header ── */}
        <div className="relative flex items-center justify-between">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[0.22em]"
              style={{ color: GOLD }}
            >
              ✦ Preparar Coração
            </p>
            <p className="text-xs mt-0.5" style={{ color: TEXT_MUTED }}>
              Configure sua oração antes de começar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-white/5"
            style={{ color: GOLD }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Time Picker ── */}
        <div className="relative flex flex-col items-center gap-4">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: TEXT_MUTED }}
          >
            Duração da oração
          </p>

          <div className="flex items-center gap-6">
            {/* Minus */}
            <button
              onClick={decrement}
              disabled={minutes <= 1}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 disabled:opacity-30 hover:brightness-110 active:scale-95"
              style={{ background: BTN_GOLD_BG, boxShadow: BTN_GOLD_SHD }}
              aria-label="Diminuir tempo"
            >
              <Minus className="w-5 h-5" style={{ color: "#000", strokeWidth: 2.5 }} />
            </button>

            {/* Number */}
            <div className="text-center" style={{ minWidth: 88 }}>
              <span
                className="font-serif font-bold tabular-nums leading-none"
                style={{
                  color: GOLD,
                  fontSize: "4.5rem",
                  textShadow: "0 0 40px rgba(212,175,55,0.30)",
                }}
              >
                {minutes}
              </span>
              <p className="text-sm mt-1" style={{ color: TEXT_MUTED }}>min</p>
            </div>

            {/* Plus */}
            <button
              onClick={increment}
              className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-150 hover:brightness-110 active:scale-95"
              style={{ background: BTN_GOLD_BG, boxShadow: BTN_GOLD_SHD }}
              aria-label="Aumentar tempo"
            >
              <Plus className="w-5 h-5" style={{ color: "#000", strokeWidth: 2.5 }} />
            </button>
          </div>

          {/* Hint animado ao tentar > 10 (free) */}
          <AnimatePresence>
            {showHint && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="text-xs text-center font-medium leading-relaxed px-2"
                style={{ color: GOLD_LIGHT }}
              >
                ✦ Mergulhe mais fundo. Desbloqueie orações sem limite de tempo e louvores instrumentais com o{" "}
                <Link
                  href="/assinar"
                  className="underline underline-offset-2 font-semibold"
                  style={{ color: GOLD_LIGHT }}
                >
                  Premium
                </Link>
                .
              </motion.p>
            )}
          </AnimatePresence>

          {/* Sublabel fixo */}
          {!showHint && (
            !isPremium ? (
              <p className="text-xs text-center" style={{ color: TEXT_MUTED }}>
                Máx. 10 min no plano Free.{" "}
                <Link
                  href="/assinar"
                  className="font-semibold underline underline-offset-2"
                  style={{ color: GOLD }}
                >
                  Assine o Premium para tempo ilimitado
                </Link>
              </p>
            ) : (
              <p className="text-xs text-center" style={{ color: "rgba(212,175,55,0.65)" }}>
                ✦ Tempo ilimitado
              </p>
            )
          )}
        </div>

        {/* Divider sutil */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

        {/* ── Music Picker ── */}
        <div className="relative flex flex-col gap-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.18em]"
            style={{ color: TEXT_MUTED }}
          >
            Música de Fundo
          </p>

          <div className="grid grid-cols-3 gap-2.5">
            {MUSIC_OPTIONS.map(({ id, emoji, label }) => {
              const isSelected = selectedMusic === id;
              const isLocked = !isPremium;

              return (
                <button
                  key={id}
                  onClick={() => handleMusicClick(id)}
                  className="relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all duration-150"
                  style={{
                    background: isSelected
                      ? "linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(160,128,32,0.08) 100%)"
                      : "#1a1a1a",
                    border: isSelected
                      ? "1px solid rgba(212,175,55,0.55)"
                      : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isSelected
                      ? "0 0 20px rgba(212,175,55,0.12), inset 0 1px 0 rgba(255,255,255,0.04)"
                      : "none",
                    opacity: isLocked ? 0.5 : 1,
                  }}
                  aria-label={label}
                >
                  <span
                    className="text-2xl"
                    style={{ filter: "drop-shadow(0 0 6px rgba(212,175,55,0.30))" }}
                  >
                    {emoji}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: isSelected ? GOLD : TEXT_MUTED }}
                  >
                    {label}
                  </span>
                  {isLocked && (
                    <Lock
                      className="absolute top-2 right-2 w-3 h-3"
                      style={{ color: GOLD_DARK }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Music upsell banner */}
          <AnimatePresence>
            {showMusicUpsell && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-xl px-4 py-3 flex items-start gap-2.5 mt-0.5"
                  style={{
                    background: "rgba(212,175,55,0.07)",
                    border: "1px solid rgba(212,175,55,0.20)",
                  }}
                >
                  <Lock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: GOLD }} />
                  <p className="text-xs leading-relaxed" style={{ color: GOLD_LIGHT }}>
                    ✦ Mergulhe mais fundo. Desbloqueie orações sem limite de tempo e{" "}
                    <strong style={{ color: GOLD }}>louvores instrumentais</strong> com o{" "}
                    <Link
                      href="/assinar"
                      className="underline underline-offset-2 font-semibold"
                      style={{ color: GOLD }}
                    >
                      Premium →
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Start Button ── */}
        <button
          onClick={handleStart}
          className="relative w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2.5 transition-all duration-150 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #D4AF37 0%, #C09A2A 55%, #A08020 100%)",
            color: "#000000",
            boxShadow: "0 4px 28px rgba(212,175,55,0.45), 0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          <Play className="w-5 h-5 fill-black" style={{ color: "#000" }} />
          Entrar em Oração
        </button>
      </motion.div>
    </div>
  );
}
