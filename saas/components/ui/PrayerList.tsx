"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Plus, X, Heart } from "lucide-react";

interface Prayer {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "ANSWERED";
  prayedCount: number;
  createdAt: string;
}

interface PrayerListProps {
  prayers: Prayer[];
  onAddPrayer: (title: string, description?: string) => void;
  onMarkAnswered: (id: string) => void;
}

export function PrayerList({ prayers, onAddPrayer, onMarkAnswered }: PrayerListProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "ANSWERED">("ALL");

  const filtered = prayers.filter((p) =>
    filter === "ALL" ? true : p.status === filter
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddPrayer(title.trim(), description.trim() || undefined);
    setTitle("");
    setDescription("");
    setShowForm(false);
  };

  return (
    <div className="divine-card p-8 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">
            Diário de Oração
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {prayers.filter((p) => p.status === "ANSWERED").length} respondidas •{" "}
            {prayers.filter((p) => p.status === "PENDING").length} pendentes
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="w-8 h-8 rounded-full bg-divine-100 flex items-center justify-center text-gold-dark hover:bg-divine-200 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Formulário de novo pedido */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 overflow-hidden"
          >
            <input
              type="text"
              placeholder="Título do pedido..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-2xl border border-amber-100 bg-white text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
              autoFocus
            />
            <textarea
              placeholder="Detalhes (opcional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-2xl border border-amber-100 bg-white text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold resize-none"
            />
            <button type="submit" className="btn-divine py-2 text-sm">
              Adicionar pedido 🙏
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filtros */}
      <div className="flex gap-1.5">
        {(["ALL", "PENDING", "ANSWERED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              filter === f
                ? "bg-gold text-white shadow-sm"
                : "bg-divine-50 text-slate-500 hover:bg-divine-100"
            }`}
          >
            {f === "ALL" ? "Todos" : f === "PENDING" ? "Pendentes" : "Respondidos"}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto custom-scroll pr-1">
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div className="text-center py-8 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-divine-50 flex items-center justify-center mb-1">
                <Heart className="w-5 h-5 text-divine-300" />
              </div>
              <p className="text-sm font-medium text-slate-400">Nenhum pedido ainda</p>
              <p className="text-xs text-slate-300 max-w-[160px] leading-relaxed text-center">
                &ldquo;Apresentai os vossos pedidos a Deus&rdquo; — Fp 4:6
              </p>
            </div>
          ) : (
            filtered.map((prayer, i) => (
              <motion.div
                key={prayer.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-xl border border-divine-100 bg-amber-50/30 transition-all"
              >
                {/* Status icon */}
                <button
                  type="button"
                  onClick={() => prayer.status === "PENDING" && onMarkAnswered(prayer.id)}
                  className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
                  title={prayer.status === "PENDING" ? "Marcar como respondido" : "Respondido"}
                >
                  {prayer.status === "ANSWERED" ? (
                    <CheckCircle2 className="w-5 h-5 text-gold-dark" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-300" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium leading-tight ${prayer.status === "ANSWERED" ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {prayer.title}
                  </p>
                  {prayer.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{prayer.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-300">{prayer.createdAt}</span>
                    {prayer.prayedCount > 0 && (
                      <span className="text-[10px] text-rose-400">🙏 {prayer.prayedCount}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
