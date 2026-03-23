"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Timer, BookOpen, CheckCircle2, Clock, Sparkles } from "lucide-react";
import { PrayerList } from "@/components/ui/PrayerList";
import { PrayerTimer } from "@/components/ui/PrayerTimer";

interface Prayer {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "ANSWERED";
  prayedCount: number;
  createdAt: string;
}

export default function OracaoPage() {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timerOpen, setTimerOpen] = useState(false);
  const [autoOpenForm, setAutoOpenForm] = useState(false);
  const [error, setError] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-divine-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8 pb-28 md:pb-12 flex flex-col gap-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-1"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
            Vida de Oração
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-slate-800 leading-tight">
            Diário de Oração
          </h1>
          <p className="text-base text-slate-500 mt-1">
            Registre seus pedidos e celebre as respostas de Deus
          </p>
        </motion.div>

        {/* CTA — Iniciar Oração */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="divine-card p-6 flex flex-col sm:flex-row items-center gap-4"
        >
          <div className="flex-1">
            <p className="font-serif text-xl text-slate-700 font-semibold">
              Pronto para orar?
            </p>
            <p className="text-base text-slate-500 mt-1">
              Use o temporizador guiado com modos de adoração, intercessão e Lectio Divina.
            </p>
          </div>
          <button
            onClick={() => setTimerOpen(true)}
            className="btn-divine py-4 px-6 text-base whitespace-nowrap flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Timer className="w-5 h-5" />
            Iniciar Oração
          </button>
        </motion.div>

        {/* Stats */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { label: "Pedidos", value: total, icon: BookOpen, color: "text-gold-dark", bg: "bg-divine-50" },
              { label: "Pendentes", value: pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
              { label: "Respondidas", value: answered, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`divine-card p-4 flex flex-col items-center gap-2 ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Verse banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="divine-card p-5 border-l-4 border-l-gold/60 bg-divine-50/70 flex gap-3 items-start"
        >
          <Sparkles className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-base italic text-slate-600 leading-relaxed">
              "A oração eficaz do justo pode muito."
            </p>
            <p className="text-sm text-gold-dark font-semibold mt-1">Tiago 5:16</p>
          </div>
        </motion.div>

        {/* Prayer List */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          {loading ? (
            <div className="divine-card p-8 flex flex-col items-center gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-gold/40 border-t-gold rounded-full animate-spin" />
              <p className="text-base">Carregando pedidos...</p>
            </div>
          ) : error ? (
            <div className="divine-card p-8 text-center text-slate-400">
              <p className="text-base">Não foi possível carregar os pedidos.</p>
              <button
                onClick={() => { setLoading(true); setError(false); fetchPrayers(); }}
                className="btn-divine py-3 px-6 mt-4 text-base"
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
            />
          )}
        </motion.div>

        {/* Quick add shortcut */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <button
              onClick={() => setAutoOpenForm(true)}
              className="text-base text-gold-dark underline underline-offset-2 hover:text-gold transition-colors"
            >
              + Adicionar novo pedido de oração
            </button>
          </motion.div>
        )}
      </div>

      {/* Timer Modal */}
      <PrayerTimer open={timerOpen} onClose={() => setTimerOpen(false)} />
    </div>
  );
}
