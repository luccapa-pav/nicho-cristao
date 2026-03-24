"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Pause, RotateCcw, Music, Moon, Minimize2, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { usePlan } from "@/hooks/usePlan";
import { PremiumGate } from "@/components/ui/PremiumGate";
import { PRAYER_VERSES, PrayerMode } from "@/lib/prayerVerses";

interface PrayerTimerProps {
  open: boolean;
  onClose: () => void;
}

const AMBIENT_MUSIC_URL = "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3";

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
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [meditacao, setMeditacao] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Ambient audio setup
  useEffect(() => {
    ambientAudioRef.current = new Audio(AMBIENT_MUSIC_URL);
    ambientAudioRef.current.loop = true;
    ambientAudioRef.current.volume = 0.35;
    return () => {
      ambientAudioRef.current?.pause();
      ambientAudioRef.current = null;
    };
  }, []);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setElapsed(0);
      setRunning(false);
      setFinished(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      ambientAudioRef.current?.pause();
      setMusicPlaying(false);
      setMeditacao(false);
      setTtsEnabled(false);
      window.speechSynthesis?.cancel();
    }
  }, [open]);

  useEffect(() => {
    if (musicPlaying) {
      ambientAudioRef.current?.play().catch(() => {});
    } else {
      ambientAudioRef.current?.pause();
    }
  }, [musicPlaying]);

  const handleFinish = useCallback(() => {
    setRunning(false);
    setFinished(true);
    playBell(audioCtxRef);
    navigator.vibrate?.([200, 100, 200]);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      confetti({ particleCount: 60, spread: 60, colors: ["#D4AF37", "#F0D060", "#ffffff"], origin: { y: 0.5 } });
    }
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
  const [manualVerseOffset, setManualVerseOffset] = useState(0);
  const verseIndex = (Math.floor(elapsed / 45) + manualVerseOffset) % verseList.length;
  const currentVerse = verseList[verseIndex];

  // TTS — lê o versículo quando troca (a cada 45s)
  useEffect(() => {
    if (!ttsEnabled || !running || typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(`${currentVerse.verse}. ${currentVerse.ref}`);
    utt.lang = "pt-BR";
    utt.rate = 0.72;
    utt.pitch = 1;
    window.speechSynthesis.speak(utt);
  }, [verseIndex, ttsEnabled, running]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
    setRunning(true);
  };

  const handleReset = () => {
    setElapsed(0);
    setRunning(false);
    setFinished(false);
  };

  const durationMinutes = [5, 10, 15, 30, 60];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {!meditacao && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />}
          <motion.div
            className={`relative w-full mx-4 mb-4 md:mb-0 p-6 flex flex-col gap-5 transition-all duration-300 ${
              meditacao
                ? "max-w-none mx-0 mb-0 rounded-none min-h-screen bg-slate-950 justify-center items-center"
                : "divine-card max-w-sm"
            }`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between w-full max-w-sm">
              <p className={`text-sm font-semibold uppercase tracking-widest ${meditacao ? "text-gold/60" : "text-gold-dark"}`}>
                {meditacao ? "✦ Meditação" : "Tempo de Oração"}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMeditacao(v => !v)}
                  className={`p-3 transition-colors rounded-full ${meditacao ? "text-gold/70 hover:text-gold" : "text-slate-300 hover:text-gold hover:bg-divine-50"}`}
                  title={meditacao ? "Sair da meditação" : "Modo meditação"}
                >
                  {meditacao ? <Minimize2 className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button onClick={onClose} className={`p-3 transition-colors rounded-full ${meditacao ? "text-gold/40 hover:text-gold/80" : "text-slate-300 hover:text-slate-600 hover:bg-divine-50"}`}>
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Banner modos bloqueados — FREE only */}
            {!isPremium && !meditacao && (
              <div className="rounded-xl border border-dashed border-gold/40 bg-divine-50/60 p-4 flex flex-col gap-3">
                <div>
                  <p className="text-sm font-semibold text-gold-dark uppercase tracking-wide">
                    ✦ Modos de oração guiada
                  </p>
                  <p className="text-xs text-slate-500 mt-1 italic">
                    &ldquo;Senhor, ensina-nos a orar&rdquo; — Lc 11:1
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap opacity-50 pointer-events-none select-none">
                  {["Adoração", "Intercessão", "Lectio Divina"].map((m) => (
                    <span key={m} className="px-3 py-1.5 rounded-full text-sm bg-divine-100 text-slate-500">{m}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  Ore com profundidade. Deus merece sua atenção total.
                </p>
                <Link href="/assinar" className="btn-divine py-2.5 px-4 text-sm text-center" onClick={onClose}>
                  ✦ Quero orar com mais profundidade
                </Link>
              </div>
            )}

            {/* Mode selector — PREMIUM only */}
            {isPremium && !meditacao && (
              <div className="flex gap-2 flex-wrap">
                {MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    disabled={running}
                    aria-label={`Modo ${m}`}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                      mode === m ? "bg-gold text-white shadow-sm" : "bg-divine-50 text-slate-500 hover:bg-divine-100"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}

            {/* Duration selector — PREMIUM only */}
            {isPremium && !meditacao && (
              <div className="flex gap-2 flex-wrap">
                {durationMinutes.map((min) => (
                  <button
                    key={min}
                    onClick={() => { setDuration(min * 60); handleReset(); }}
                    disabled={running}
                    aria-label={`${min} minutos`}
                    className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                      duration === min * 60 ? "bg-gold text-white shadow-sm" : "bg-divine-50 text-slate-500 hover:bg-divine-100"
                    }`}
                  >
                    {min}min
                  </button>
                ))}
              </div>
            )}

            {/* Ambient music toggle */}
            {!meditacao && (
              <div className="flex justify-center gap-2 flex-wrap">
                <PremiumGate feature="Música ambiente de oração">
                  <button
                    onClick={() => setMusicPlaying((v) => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                      musicPlaying
                        ? "border-gold bg-gold/10 text-gold-dark"
                        : "border-gold/30 bg-divine-50 text-gold-dark hover:bg-divine-100"
                    }`}
                  >
                    {musicPlaying ? <Pause className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                    {musicPlaying ? "Pausar música" : "Música ambiente"}
                  </button>
                </PremiumGate>
                <PremiumGate feature="Versículos em voz alta">
                  <button
                    onClick={() => setTtsEnabled((v) => !v)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${
                      ttsEnabled
                        ? "border-gold bg-gold/10 text-gold-dark"
                        : "border-gold/30 bg-divine-50 text-gold-dark hover:bg-divine-100"
                    }`}
                  >
                    {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    {ttsEnabled ? "Voz ativa" : "Ouvir versículos"}
                  </button>
                </PremiumGate>
              </div>
            )}

            {/* Timer circle */}
            <div className="flex flex-col items-center gap-4">
              <div className={`relative flex items-center justify-center ${meditacao ? "w-40 h-40 sm:w-48 sm:h-48" : "w-32 h-32"}`}>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="54" fill="none"
                    stroke="url(#timer-gold)" strokeWidth="8"
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
                      <span className={`font-serif font-bold text-gold tabular-nums leading-none ${meditacao ? "text-4xl sm:text-6xl" : "text-4xl"}`}>
                        {formatTime(remaining)}
                      </span>
                      <span className={`text-slate-400 mt-1 ${meditacao ? "text-base" : "text-sm"}`}>restante</span>
                    </>
                  )}
                </div>
              </div>

              {/* Controls */}
              {!finished ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="w-12 h-12 rounded-full bg-divine-100 flex items-center justify-center text-slate-500 hover:bg-divine-200 transition-all"
                    aria-label="Reiniciar"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                  <button
                    onClick={running ? () => setRunning(false) : handleStart}
                    className="w-16 h-16 rounded-full btn-divine flex items-center justify-center shadow-divine"
                    aria-label={running ? "Pausar" : "Iniciar"}
                  >
                    {running ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="text-4xl"
                  >🕊️</motion.span>
                  <p className="font-serif text-xl text-gold-dark font-semibold">Amém ✦</p>
                  <p className="text-sm text-slate-500">Oração concluída com louvor</p>
                  <button onClick={handleReset} className="btn-ghost-divine py-2 px-6 text-sm mt-1">
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
                className={`w-full max-w-sm text-center leading-relaxed ${meditacao ? "border-0 bg-transparent px-4" : "verse-highlight text-base text-slate-600"}`}
              >
                <p className={`italic ${meditacao ? "text-xl text-gold" : ""}`}>"{currentVerse.verse}"</p>
                <p className={`font-semibold mt-2 not-italic ${meditacao ? "text-base text-gold/80" : "text-sm text-gold-dark"}`}>— {currentVerse.ref}</p>
              </motion.div>
            </AnimatePresence>

            {/* Botão pular versículo — só meditação */}
            {meditacao && (
              <button
                onClick={() => setManualVerseOffset((v) => (v + 1) % verseList.length)}
                className="text-gold/50 hover:text-gold/90 text-xs transition-colors mt-1"
                aria-label="Próximo versículo"
              >
                próximo versículo →
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
