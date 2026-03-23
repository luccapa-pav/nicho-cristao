"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { usePlan } from "@/hooks/usePlan";
import { PRAYER_VERSES, PrayerMode } from "@/lib/prayerVerses";

interface PrayerTimerProps {
  open: boolean;
  onClose: () => void;
}

const MODES: PrayerMode[] = ["Livre", "Adoração", "Intercessão", "Lectio Divina"];
const FREE_DURATION = 300; // 5 min

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function playBell(audioCtxRef: React.MutableRefObject<AudioContext | null>) {
  try {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.5);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 2);
  } catch { /* AudioContext may not be available */ }
}

export function PrayerTimer({ open, onClose }: PrayerTimerProps) {
  const { isPremium } = usePlan();
  const [mode, setMode] = useState<PrayerMode>("Livre");
  const [duration, setDuration] = useState(FREE_DURATION);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setElapsed(0);
      setRunning(false);
      setFinished(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [open]);

  const handleFinish = useCallback(() => {
    setRunning(false);
    setFinished(true);
    playBell(audioCtxRef);
    navigator.vibrate?.([200, 100, 200]);
    confetti({ particleCount: 60, spread: 60, colors: ["#D4AF37", "#F0D060", "#ffffff"], origin: { y: 0.5 } });
  }, []);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => {
          const next = prev + 1;
          if (next >= duration) {
            clearInterval(intervalRef.current!);
            handleFinish();
          }
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, duration, handleFinish]);

  const remaining = duration - elapsed;
  const progress = duration > 0 ? elapsed / duration : 0;
  const circumference = 2 * Math.PI * 54;
  const strokeOffset = circumference * (1 - progress);

  const verseList = PRAYER_VERSES[mode];
  const verseIndex = Math.floor(elapsed / 30) % verseList.length;
  const currentVerse = verseList[verseIndex];

  const handleStart = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    setRunning(true);
  };

  const handleReset = () => {
    setElapsed(0);
    setRunning(false);
    setFinished(false);
  };

  const durationMinutes = [3, 5, 10, 15, 20, 30, 45, 60];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative divine-card w-full max-w-sm mx-4 mb-4 md:mb-0 p-6 flex flex-col gap-5"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">Tempo de Oração</p>
                {!isPremium && <p className="text-xs text-slate-400 mt-0.5">5 min • Upgrade para mais modos</p>}
              </div>
              <button onClick={onClose} className="p-1 text-slate-300 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode selector — PREMIUM only */}
            {isPremium && (
              <div className="flex gap-1.5 flex-wrap">
                {MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    disabled={running}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      mode === m ? "bg-gold text-white shadow-sm" : "bg-divine-50 text-slate-500 hover:bg-divine-100"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {/* Duration selector — PREMIUM only */}
            {isPremium && (
              <div className="flex gap-1.5 flex-wrap">
                {durationMinutes.map((min) => (
                  <button
                    key={min}
                    onClick={() => { setDuration(min * 60); handleReset(); }}
                    disabled={running}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      duration === min * 60 ? "bg-gold text-white shadow-sm" : "bg-divine-50 text-slate-500 hover:bg-divine-100"
                    }`}
                  >
                    {min}min
                  </button>
                ))}
              </div>
            )}

            {/* Timer circle */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="6" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke="url(#timer-gold)" strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                  <defs>
                    <linearGradient id="timer-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#A08020" />
                      <stop offset="100%" stopColor="#F0D060" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="flex flex-col items-center">
                  {finished ? (
                    <span className="text-2xl">🙏</span>
                  ) : (
                    <>
                      <span className="font-serif text-3xl font-bold text-gold tabular-nums leading-none">
                        {formatTime(remaining)}
                      </span>
                      <span className="text-xs text-slate-400 mt-1">restante</span>
                    </>
                  )}
                </div>
              </div>

              {/* Controls */}
              {!finished ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="w-10 h-10 rounded-full bg-divine-100 flex items-center justify-center text-slate-500 hover:bg-divine-200 transition-all"
                    aria-label="Reiniciar"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={running ? () => setRunning(false) : handleStart}
                    className="w-14 h-14 rounded-full btn-divine flex items-center justify-center shadow-divine"
                    aria-label={running ? "Pausar" : "Iniciar"}
                  >
                    {running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-sm font-semibold text-emerald-700">Oração concluída! ✓</p>
                  <button onClick={handleReset} className="btn-ghost-divine py-1.5 px-4 text-sm">
                    Orar novamente
                  </button>
                </div>
              )}
            </div>

            {/* Rotating verse */}
            <AnimatePresence mode="wait">
              <motion.div
                key={verseIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="verse-highlight text-sm text-slate-600 leading-relaxed"
              >
                <p className="italic">"{currentVerse.verse}"</p>
                <p className="text-xs text-gold-dark font-semibold mt-1 not-italic">— {currentVerse.ref}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
