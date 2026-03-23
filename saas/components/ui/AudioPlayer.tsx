"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

interface AudioPlayerProps {
  title: string;
  duration: number;
  audioUrl: string;
  date: string;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ title, duration, audioUrl, date }: AudioPlayerProps) {
  const hasAudio = Boolean(audioUrl);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * duration;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const skip = useCallback((secs: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + secs));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !muted;
    setMuted((m) => !m);
  }, [muted]);

  return (
    <div className="divine-card p-6 h-full flex flex-col gap-0 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 90% 10%, rgba(212,175,55,0.07) 0%, transparent 55%)" }}
      />

      {/* Zona 1 — Identidade */}
      <div className="flex items-center gap-4 mb-5 relative">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine">
            <AnimatePresence>
              {playing && (
                <motion.div
                  className="absolute inset-0 rounded-xl border border-gold/40"
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </AnimatePresence>
            <span className="font-serif text-xl text-white select-none">✝</span>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 min-w-0">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-dark/70 leading-none">
            Cápsula de Áudio
          </p>
          <p className="text-base font-serif font-semibold text-slate-800 leading-snug truncate">
            {title}
          </p>
          <p className="text-xs text-slate-400 leading-none tracking-wide mt-0.5">
            {date}
          </p>
        </div>

        <AnimatePresence>
          {playing && (
            <motion.div
              className="ml-auto flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-gold/10 border border-gold/20"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-0.5 bg-gold-dark rounded-full"
                  animate={{ height: ["4px", "12px", "6px", "10px", "4px"] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Zona 2 — Controle Primário */}
      <div className="flex-1 flex flex-col justify-center gap-4 relative">
        <div className="space-y-1.5">
          <div
            className="h-1.5 w-full rounded-full bg-divine-100 cursor-pointer overflow-hidden group relative"
            onClick={seek}
            role="slider"
            aria-label="Progresso do áudio"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold relative"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-gold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </div>
          <div className="flex justify-between text-[0.65rem] leading-none text-slate-400 tabular-nums font-medium tracking-wide">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-8">
          <button
            onClick={() => skip(-15)}
            className="group flex flex-col items-center gap-0.5 text-slate-300 hover:text-gold-dark transition-colors"
            aria-label="Voltar 15 segundos"
          >
            <SkipBack className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[0.55rem] font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">-15s</span>
          </button>

          <motion.button
            onClick={togglePlay}
            disabled={!hasAudio}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark text-white flex items-center justify-center shadow-divine disabled:opacity-40 disabled:cursor-not-allowed"
            whileTap={hasAudio ? { scale: 0.88 } : {}}
            whileHover={hasAudio ? { scale: 1.06 } : {}}
            aria-label={playing ? "Pausar" : "Reproduzir"}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={playing ? "pause" : "play"}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </motion.div>
            </AnimatePresence>
          </motion.button>

          <button
            onClick={() => skip(15)}
            className="group flex flex-col items-center gap-0.5 text-slate-300 hover:text-gold-dark transition-colors"
            aria-label="Avançar 15 segundos"
          >
            <SkipForward className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-[0.55rem] font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">+15s</span>
          </button>
        </div>
      </div>

      <div className="divine-divider my-4" />

      {/* Zona 3 — Controles Secundários */}
      <div className="flex items-center gap-4 relative">
        <div className="flex items-center gap-0.5">
          {[0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => { setPlaybackRate(rate); if (audioRef.current) audioRef.current.playbackRate = rate; }}
              className={`text-[0.65rem] font-bold px-2 py-1 rounded-md transition-all ${
                playbackRate === rate
                  ? "bg-gold/15 text-gold-dark border border-gold/30"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-divine-200 flex-shrink-0" />

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={toggleMute}
            className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors"
            aria-label={muted ? "Ativar som" : "Silenciar"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <div
            className="relative flex-1 h-1 rounded-full bg-divine-100 cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              setVolume(v);
              if (audioRef.current) audioRef.current.volume = v;
            }}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-dark/60 to-gold/60"
              style={{ width: `${muted ? 0 : volume * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border border-gold/40 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${muted ? 0 : volume * 100}% - 5px)` }}
            />
          </div>
        </div>
      </div>

      {audioUrl ? (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
          onEnded={() => setPlaying(false)}
          preload="metadata"
        />
      ) : (
        <p className="text-[0.65rem] text-center text-slate-400 mt-2 tracking-wide">
          Áudio disponível em breve
        </p>
      )}
    </div>
  );
}
