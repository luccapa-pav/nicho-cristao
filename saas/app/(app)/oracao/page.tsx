"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Timer, BookOpen, CheckCircle2, Clock, Plus } from "lucide-react";
import Link from "next/link";
import { PrayerList } from "@/components/ui/PrayerList";
import { PrayerTimer } from "@/components/ui/PrayerTimer";
import { usePlan } from "@/hooks/usePlan";
import { PRAYER_VERSES } from "@/lib/prayerVerses";

interface Prayer {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "ANSWERED";
  prayedCount: number;
  createdAt: string;
}

export default function OracaoPage() {
  const { isPremium } = usePlan();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timerOpen, setTimerOpen] = useState(false);
  const [autoOpenForm, setAutoOpenForm] = useState(false);
  const [error, setError] = useState(false);

  // Random verse on mount
  const verses = PRAYER_VERSES["Livre"];
  const [verseIdx] = useState(() => Math.floor(Math.random() * verses.length));
  const currentVerse = verses[verseIdx];

  const fetchPrayers = useCallback(async () => {
    try {
      const res = await fetch("/api/prayers");
      if (res.ok) {
        const data = await res.json();
        setPrayers(data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  const handleAddPrayer = async (title: string, description?: string, isPublic?: boolean) => {
    const res = await fetch("/api/prayers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, isPublic }),
    });
    if (res.ok) {
      const newPrayer = await res.json();
      setPrayers((prev) => [newPrayer, ...prev]);
    }
  };

  const handleMarkAnswered = async (id: string) => {
    const res = await fetch(`/api/prayers/${id}/answered`, { method: "PATCH" });
    if (res.ok) {
      setPrayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "ANSWERED" as const } : p))
      );
    }
  };

  const answered = prayers.filter((p) => p.status === "ANSWERED").length;
  const pending = prayers.filter((p) => p.status === "PENDING").length;
  const total = prayers.length;
  const totalPrayed = prayers.reduce((sum, p) => sum + p.prayedCount, 0);
  const answeredPct = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-divine-50 via-amber-50/30 to-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-32 md:pb-14 flex flex-col gap-7">

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-divine-50 via-amber-50/60 to-divine-100/50 p-6 sm:p-8 text-center"
          style={{ boxShadow: "0 0 80px rgba(212,175,55,0.14), 0 8px 32px rgba(212,175,55,0.08)" }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.18) 0%, transparent 70%)" }}
          />

          <motion.div
            className="relative mb-5 inline-flex items-center justify-center"
          >
            {/* Halo externo pulsante */}
            <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full border border-gold/30 animate-[pulse-gold_2.5s_ease-in-out_infinite]" />
            <div className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gold/[0.08] animate-[pulse-gold_2.5s_ease-in-out_infinite_0.5s]" />

            {/* Partículas de luz */}
            {[
              { x: -18, delay: 0,   dur: 2.4 },
              { x:  18, delay: 0.7, dur: 2.8 },
              { x:  -8, delay: 1.4, dur: 2.2 },
              { x:  12, delay: 2.1, dur: 2.6 },
            ].map((p, i) => (
              <motion.span
                key={i}
                className="absolute bottom-0 w-1.5 h-1.5 rounded-full bg-gold/70 pointer-events-none"
                style={{ left: `calc(50% + ${p.x}px)` }}
                animate={{ y: [0, -56], opacity: [0, 0.9, 0], scale: [0.5, 1, 0] }}
                transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "easeOut" }}
              />
            ))}

            {/* Emoji */}
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
              className="relative text-5xl sm:text-6xl drop-shadow-md select-none z-10 py-4"
            >🙏</motion.span>
          </motion.div>

          <p className="relative text-sm font-semibold uppercase tracking-widest text-gold-dark">
            Vida de Oração
          </p>
          <h1 className="relative font-serif text-3xl sm:text-4xl md:text-5xl text-slate-800 mt-2 leading-tight">
            Diário de Oração
          </h1>

          <div className="relative mt-6 text-left mx-auto max-w-sm">
            <div className="verse-highlight text-lg">
              <p className="italic">&ldquo;{currentVerse.verse}&rdquo;</p>
              <p className="text-sm sm:text-base font-semibold text-gold-dark mt-2 not-italic text-center">
                — {currentVerse.ref}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="divine-divider -my-1" />

        {/* ── CTA Iniciar Oração ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.01 }}
          className="divine-card p-6 bg-gradient-to-r from-divine-50 via-amber-50/40 to-divine-50 border-gold/30"
          style={{ boxShadow: "0 0 40px rgba(212,175,55,0.15), 0 4px 16px rgba(212,175,55,0.08)" }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Timer className="w-10 h-10 sm:w-12 sm:h-12 text-gold opacity-80 flex-shrink-0" />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-serif text-xl sm:text-2xl text-slate-700 font-semibold">Pronto para orar?</p>
              <p className="text-sm sm:text-base text-slate-500 mt-1">
                {isPremium
                  ? "Todos os modos: Adoração, Intercessão, Lectio Divina"
                  : "Modo Livre · 5 minutos grátis"}
              </p>
            </div>
            <button
              onClick={() => setTimerOpen(true)}
              className="btn-divine py-4 sm:py-5 px-6 sm:px-8 text-base sm:text-lg min-h-[56px] w-full sm:w-auto flex items-center justify-center gap-2"
              aria-label="Abrir temporizador de oração guiada"
            >
              <Timer className="w-5 h-5 sm:w-6 sm:h-6" />
              Iniciar Oração
            </button>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="flex flex-col gap-3"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-gold/70 text-center">
              ✦ Suas graças ✦
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {[
                {
                  label: "Pedidos",
                  value: total,
                  icon: BookOpen,
                  sub: total === 0 ? "comece a orar" : "no total",
                },
                {
                  label: "Pendentes",
                  value: pending,
                  icon: Clock,
                  sub: pending > 0 ? "aguardando" : "em dia!",
                },
                {
                  label: "Respondidas",
                  value: answered,
                  icon: CheckCircle2,
                  sub: answered > 0 ? "Glória a Deus!" : "ore e creia",
                },
              ].map(({ label, value, icon: Icon, sub }) => (
                <div
                  key={label}
                  className={`divine-card flex flex-col items-center gap-1.5 py-4 sm:py-6 px-2 sm:px-3 transition-all ${
                    label === "Respondidas" && answered > 0
                      ? "border-gold/60 animate-[pulse-gold_3s_ease-in-out_infinite]"
                      : ""
                  }`}
                >
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-gold-dark" />
                  <p className="text-2xl sm:text-3xl font-bold text-gold-dark">{value}</p>
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className="text-xs text-slate-500">{sub}</p>
                </div>
              ))}
            </div>

            {/* Barra de fidelidade — só aparece quando há pedidos */}
            {total > 0 && (
              <div className="divine-card p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Fidelidade de Deus</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {answered} de {total} {total === 1 ? "pedido respondido" : "pedidos respondidos"}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-gold-dark">{answeredPct}%</p>
                </div>
                <div className="h-3 rounded-full bg-divine-100 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold-dark to-gold rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${answeredPct}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                  />
                </div>
                {isPremium && totalPrayed > 0 && (
                  <p className="text-xs text-slate-500 text-center">
                    ✦ Você usou o temporizador {totalPrayed} {totalPrayed === 1 ? "vez" : "vezes"}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        <div className="divine-divider -my-1" />

        {/* ── Lista de Pedidos ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-gold/70 text-center mb-3">
            ✦ Pedidos diante de Deus ✦
          </p>
          {error ? (
            <div className="divine-card p-8 text-center text-slate-400">
              <p className="text-lg">Não foi possível carregar os pedidos.</p>
              <button
                onClick={() => { setLoading(true); setError(false); fetchPrayers(); }}
                className="btn-divine py-4 px-6 mt-4 text-base"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <PrayerList
              prayers={prayers}
              onAddPrayer={handleAddPrayer}
              onMarkAnswered={handleMarkAnswered}
              autoOpenForm={autoOpenForm}
              onFormOpened={() => setAutoOpenForm(false)}
              isLoading={loading}
            />
          )}
        </motion.div>

        {/* ── Seção Free vs Premium (só para Free) — sempre no final ── */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="divine-card p-6 border border-dashed border-gold/50 bg-divine-50/40"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark mb-4">
              ✦ Recursos Premium
            </p>
            <div className="grid grid-cols-2 gap-3">
              {/* Free */}
              <div className="rounded-xl bg-divine-50/60 border border-divine-100 p-4 flex flex-col gap-2.5">
                <p className="text-sm font-semibold text-slate-600 mb-1">Grátis</p>
                {["Timer 5 min", "Diário ilimitado", "Versículos diários", "Lembretes de oração"].map((f) => (
                  <p key={f} className="text-sm text-slate-500 flex items-center gap-1.5">
                    <span className="text-gold-dark">✓</span> {f}
                  </p>
                ))}
              </div>
              {/* Premium */}
              <div className="rounded-xl bg-amber-50/60 border border-gold/40 p-4 flex flex-col gap-2.5"
                   style={{ boxShadow: "inset 0 0 20px rgba(212,175,55,0.06)" }}>
                <p className="text-sm font-semibold text-gold-dark mb-1">Premium ✦</p>
                {["Todos os modos", "Timer ilimitado", "Orações da célula"].map((f) => (
                  <p key={f} className="text-sm text-amber-700 flex items-center gap-1.5">
                    <span>✦</span> {f}
                  </p>
                ))}
              </div>
            </div>
            <Link href="/perfil">
              <button className="btn-divine py-4 text-base w-full mt-4">
                Assinar Premium
              </button>
            </Link>
          </motion.div>
        )}
      </div>

      {/* ── FAB — Adicionar pedido ── */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAutoOpenForm(true)}
        className="fixed right-5 bottom-20 sm:bottom-24 md:bottom-10 z-40 w-16 h-16 rounded-full btn-divine flex items-center justify-center"
        style={{ boxShadow: "0 4px 20px rgba(212,175,55,0.45), 0 2px 8px rgba(0,0,0,0.12)" }}
        aria-label="Adicionar pedido de oração"
      >
        <Plus className="w-7 h-7" />
      </motion.button>

      {/* ── Timer Modal ── */}
      <PrayerTimer open={timerOpen} onClose={() => setTimerOpen(false)} />
    </div>
  );
}
