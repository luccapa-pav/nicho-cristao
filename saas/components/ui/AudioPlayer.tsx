"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Lock } from "lucide-react";
import Link from "next/link";

interface AudioPlayerProps {
  title: string;
  duration: number;       // duração do áudio completo (premium)
  audioUrl: string;       // url do áudio completo (premium)
  audioPreviewUrl?: string; // url do preview ~15s (free)
  date: string;
  isPremium?: boolean;
  onUnlock?: () => void;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  title,
  duration,
  audioUrl,
  audioPreviewUrl,
  date,
  isPremium = true,
  onUnlock,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]           = useState(false);
  const [currentTime, setCurrentTime]   = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [volume, setVolume]             = useState(0.8);
  const [muted, setMuted]               = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioError, setAudioError]     = useState(false);
  const [previewEnded, setPreviewEnded] = useState(false);

  // Qual src usar?
  const activeSrc = isPremium ? audioUrl : (audioPreviewUrl ?? "");
  const hasAudio  = Boolean(activeSrc) && !audioError;
  const isPreview = !isPremium && Boolean(audioPreviewUrl);
  const progress  = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, []);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!hasAudio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * audioDuration;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [audioDuration, hasAudio]);

  const skip = useCallback((secs: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(audioDuration, audioRef.current.currentTime + secs));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [audioDuration]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !muted;
    setMuted((m) => !m);
  }, [muted]);

  const handleUnlock = onUnlock ?? (() => {});

  // Paywall overlay: imediato (sem preview) ou após preview terminar
  const showPaywall = !isPremium && (!isPreview || previewEnded);

  return (
    <div className="divine-card p-4 h-full flex flex-col gap-0 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 90% 10%, rgba(212,175,55,0.07) 0%, transparent 55%)" }}
      />

      {/* ── Zona 1 — Identidade ── */}
      <div className="flex flex-col items-center text-center mb-3 relative gap-0.5">
        <div className="flex items-center gap-1.5">
          <div className="relative w-5 h-5 rounded-md bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine flex-shrink-0">
            <AnimatePresence>
              {playing && (
                <motion.div
                  className="absolute inset-0 rounded-md border border-gold/40"
                  initial={{ scale: 1, opacity: 0.7 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              )}
            </AnimatePresence>
            <span className="font-serif text-xs text-white select-none">✝</span>
          </div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-gold-dark/70 leading-none">
            {isPreview ? "Prévia · 15s" : "Cápsula de Áudio"}
          </p>
          <AnimatePresence>
            {playing && (
              <motion.div
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gold/10 border border-gold/20"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="w-0.5 bg-gold-dark rounded-full"
                    animate={{ height: ["3px", "9px", "5px", "8px", "3px"] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="text-base font-serif font-semibold text-slate-800 leading-snug">{title}</p>
        <p className="text-xs text-slate-400 leading-none tracking-wide">{date}</p>
      </div>

      {/* ── Zona 2 — Controle Primário ── */}
      <div className="flex flex-col gap-3 relative">
        <div className="space-y-1.5">
          <div
            className={`h-1.5 w-full rounded-full bg-divine-100 overflow-hidden group relative ${hasAudio ? "cursor-pointer" : ""}`}
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
              {hasAudio && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-white border-2 border-gold shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </motion.div>
          </div>
          <div className="flex justify-between text-[0.65rem] leading-none text-slate-400 tabular-nums font-medium tracking-wide">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(audioDuration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button
            onClick={() => skip(-15)}
            disabled={!hasAudio || isPreview}
            className="group flex flex-col items-center gap-0.5 text-slate-300 hover:text-gold-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Voltar 15 segundos"
          >
            <SkipBack className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[0.55rem] font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">-15s</span>
          </button>

          <motion.button
            onClick={togglePlay}
            disabled={!hasAudio}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark text-white flex items-center justify-center shadow-divine disabled:opacity-40 disabled:cursor-not-allowed"
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
            disabled={!hasAudio || isPreview}
            className="group flex flex-col items-center gap-0.5 text-slate-300 hover:text-gold-dark transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Avançar 15 segundos"
          >
            <SkipForward className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            <span className="text-[0.55rem] font-medium tracking-wide opacity-0 group-hover:opacity-100 transition-opacity">+15s</span>
          </button>
        </div>
      </div>

      <div className="divine-divider my-2" />

      {/* ── Zona 3 — Controles Secundários ── */}
      <div className="flex items-center gap-4 relative">
        <div className="flex items-center gap-0.5">
          {[0.75, 1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              disabled={!isPremium}
              onClick={() => { setPlaybackRate(rate); if (audioRef.current) audioRef.current.playbackRate = rate; }}
              className={`text-[0.65rem] font-bold px-2 py-1 rounded-md transition-all disabled:opacity-40 ${
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

      {/* ── Elemento de áudio ── */}
      {hasAudio ? (
        <audio
          ref={audioRef}
          src={activeSrc}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedMetadata={() => {
            if (audioRef.current) setAudioDuration(audioRef.current.duration);
          }}
          onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
          onEnded={() => {
            setPlaying(false);
            if (isPreview) setPreviewEnded(true);
          }}
          onError={() => { setAudioError(true); setPlaying(false); }}
          preload="metadata"
        />
      ) : !isPreview && isPremium ? (
        <p className="text-[0.65rem] text-center text-slate-400 mt-2 tracking-wide">
          Áudio disponível em breve
        </p>
      ) : null}

      {/* ── Paywall overlay ── */}
      <AnimatePresence>
        {showPaywall && (
          <motion.div
            className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col items-center justify-center z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute inset-0 backdrop-blur-[6px] bg-white/40 dark:bg-black/50" />
            <motion.div
              className="relative z-10 flex flex-col items-center gap-3 px-6 py-5 mx-4 rounded-2xl text-center"
              style={{
                background: "linear-gradient(145deg, rgba(255,249,230,0.97) 0%, rgba(255,252,240,0.97) 100%)",
                boxShadow: "0 4px 24px rgba(212,175,55,0.25), 0 1px 6px rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.35)",
              }}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.15 }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)" }}
              >
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-serif text-base font-bold text-slate-800">
                  {previewEnded ? "Gostou da prévia?" : "Devocional Narrado"}
                </p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-[200px]">
                  {previewEnded
                    ? "Continue a meditação guiada completa com o Premium"
                    : "Ouça o devocional do dia com narração exclusiva para membros Premium"}
                </p>
              </div>
              {onUnlock ? (
                <button
                  onClick={handleUnlock}
                  className="w-full py-2.5 px-5 rounded-xl text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)", boxShadow: "0 2px 10px rgba(212,175,55,0.4)" }}
                >
                  ✦ Seja Premium
                </button>
              ) : (
                <Link href="/assinar" className="w-full">
                  <button
                    className="w-full py-2.5 px-5 rounded-xl text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #D4AF37 0%, #B8962E 100%)", boxShadow: "0 2px 10px rgba(212,175,55,0.4)" }}
                  >
                    ✦ Seja Premium
                  </button>
                </Link>
              )}
              <p className="text-[10px] text-slate-400">7 dias grátis · Cancele quando quiser</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
