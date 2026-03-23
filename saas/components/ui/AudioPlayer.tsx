"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";

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
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
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

  return (
    <div className="audio-player gap-3 h-full">

      {/* Header — centralizado */}
      <div className="flex flex-col items-center text-center gap-2">
        {/* Ícone animado */}
        <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine">
          <AnimatePresence>
            {playing && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-gold/40"
                initial={{ scale: 1, opacity: 0.7 }}
                animate={{ scale: 1.6, opacity: 0 }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}
          </AnimatePresence>
          <span className="font-serif text-2xl text-white">✝</span>
        </div>

        {/* Textos */}
        <div className="flex flex-col gap-0.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-dark">
            Cápsula de Áudio
          </p>
          <p className="text-lg font-serif font-semibold text-slate-800 leading-tight">
            {title}
          </p>
          <p className="text-[0.625rem] leading-none text-slate-400/80 tracking-wide">
            {date}
          </p>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="space-y-1">
        <div
          className="h-1.5 w-full rounded-full bg-divine-100 cursor-pointer overflow-hidden group"
          onClick={seek}
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold relative"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gold shadow opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        </div>
        {/* Timestamps */}
        <div className="flex justify-between text-[0.625rem] leading-none text-slate-400 tabular-nums font-medium tracking-wide">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => skip(-15)}
          className="text-slate-400 hover:text-gold transition-colors p-1"
          title="-15s"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <motion.button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark text-white flex items-center justify-center shadow-divine"
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={playing ? "pause" : "play"}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <button
          onClick={() => skip(15)}
          className="text-slate-400 hover:text-gold transition-colors p-1"
          title="+15s"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Velocidade de reprodução */}
      <div className="flex items-center justify-center gap-1">
        {[0.75, 1, 1.25, 1.5].map((rate) => (
          <button
            key={rate}
            onClick={() => { setPlaybackRate(rate); if (audioRef.current) audioRef.current.playbackRate = rate; }}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
              playbackRate === rate ? "bg-gold text-white" : "text-slate-400 hover:text-gold-dark"
            }`}
          >
            {rate}x
          </button>
        ))}
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 px-1">
        <Volume2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
        <div
          className="relative flex-1 h-1.5 rounded-full bg-divine-100 cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const v = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setVolume(v);
            if (audioRef.current) audioRef.current.volume = v;
          }}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold" style={{ width: `${volume * 100}%` }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-gold shadow opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${volume * 100}% - 6px)` }} />
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onEnded={() => setPlaying(false)}
        preload="metadata"
      />
    </div>
  );
}
