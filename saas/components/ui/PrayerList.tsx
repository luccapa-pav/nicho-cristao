"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Plus, X, Heart, Users } from "lucide-react";
import Link from "next/link";

interface Prayer {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "ANSWERED";
  prayedCount: number;
  createdAt: string;
}

interface GroupPrayer {
  id: string;
  title: string;
  description?: string;
  status: string;
  prayedCount: number;
  createdAt: string;
  author: string;
}

interface PrayerListProps {
  prayers: Prayer[];
  onAddPrayer: (title: string, description?: string, isPublic?: boolean) => void;
  onMarkAnswered: (id: string) => void;
  autoOpenForm?: boolean;
  onFormOpened?: () => void;
  groupPrayers?: GroupPrayer[];
  isLoading?: boolean;
}

type Tab = "ALL" | "PENDING" | "ANSWERED" | "CELULA";

export function PrayerList({ prayers, onAddPrayer, onMarkAnswered, autoOpenForm, onFormOpened, groupPrayers = [], isLoading }: PrayerListProps) {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (autoOpenForm) {
      setShowForm(true);
      onFormOpened?.();
    }
  }, [autoOpenForm, onFormOpened]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tab, setTab] = useState<Tab>("ALL");

  const filtered = tab === "CELULA"
    ? []
    : prayers.filter((p) => tab === "ALL" ? true : p.status === tab);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddPrayer(title.trim(), description.trim() || undefined, isPublic);
    setTitle("");
    setDescription("");
    setIsPublic(false);
    setShowForm(false);
  };

  return (
    <div className="divine-card p-6 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
            Diário de Oração
          </p>
          <p className="text-sm text-slate-600 mt-0.5">
            {prayers.filter((p) => p.status === "ANSWERED").length} respondidas •{" "}
            {prayers.filter((p) => p.status === "PENDING").length} pendentes
          </p>
        </div>
        {tab !== "CELULA" && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="w-12 h-12 rounded-full bg-divine-100 flex items-center justify-center text-gold-dark hover:bg-divine-200 transition-colors"
          >
            {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Formulário de novo pedido */}
      <AnimatePresence>
        {showForm && tab !== "CELULA" && (
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
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              maxLength={120}
              className="w-full px-4 py-4 rounded-2xl border border-amber-100 bg-white text-lg text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
              autoFocus
            />
            <textarea
              placeholder="Detalhes (opcional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 600))}
              maxLength={600}
              rows={3}
              className="w-full px-4 py-4 rounded-2xl border border-amber-100 bg-white text-base text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold resize-none"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 accent-amber-500 rounded"
              />
              Compartilhar com minha célula
            </label>
            <button type="submit" className="btn-divine py-5 text-lg min-h-[56px]">
              Adicionar pedido 🙏
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tabs/Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {(["ALL", "PENDING", "ANSWERED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setTab(f)}
            className={`px-5 py-3 min-h-[48px] rounded-full text-base font-medium transition-all ${
              tab === f
                ? "bg-gold text-white shadow-sm"
                : "bg-divine-50 text-slate-500 hover:bg-divine-100"
            }`}
          >
            {f === "ALL" ? "Todos" : f === "PENDING" ? "Pendentes" : "Respondidos"}
          </button>
        ))}
        <button
          onClick={() => setTab("CELULA")}
          className={`flex items-center gap-1.5 px-5 py-3 min-h-[48px] rounded-full text-base font-medium transition-all ${
            tab === "CELULA"
              ? "bg-gold text-white shadow-sm"
              : "bg-divine-50 text-slate-500 hover:bg-divine-100"
          }`}
        >
          <Users className="w-3 h-3" />
          Célula
          {groupPrayers.length > 0 && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${tab === "CELULA" ? "bg-white/20" : "bg-gold/20 text-gold-dark"}`}>
              {groupPrayers.length}
            </span>
          )}
        </button>
      </div>

      {/* Lista */}
      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto custom-scroll pr-1">
        <AnimatePresence initial={false}>
          {isLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl border border-divine-100 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-divine-100 flex-shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 bg-divine-100 rounded w-3/4" />
                  <div className="h-3 bg-divine-50 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : tab === "CELULA" ? (
            groupPrayers.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-divine-50 flex items-center justify-center">
                  <Users className="w-6 h-6 text-divine-300" />
                </div>
                <p className="text-base font-medium text-slate-500">Orações da sua célula</p>
                <p className="text-sm text-slate-400 max-w-[220px] leading-relaxed text-center">
                  Com o Premium, veja e ore pelos pedidos dos membros da sua célula.
                </p>
                <Link href="/perfil">
                  <button className="btn-divine py-3 px-6 text-base">✦ Ver com Premium</button>
                </Link>
              </div>
            ) : (
              groupPrayers.map((gp, i) => (
                <motion.div
                  key={gp.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-divine-100 bg-amber-50/30"
                >
                  <div className="w-7 h-7 rounded-full bg-divine-100 flex items-center justify-center text-gold-dark text-xs font-bold flex-shrink-0">
                    {gp.author[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-slate-700 leading-tight">{gp.title}</p>
                    {gp.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{gp.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{gp.author}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-400">{gp.createdAt}</span>
                      {gp.prayedCount > 0 && <span className="text-xs text-rose-400">🙏 {gp.prayedCount}</span>}
                    </div>
                  </div>
                </motion.div>
              ))
            )
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-divine-50 flex items-center justify-center mb-1">
                <Heart className="w-5 h-5 text-divine-300" />
              </div>
              <p className="text-base font-semibold text-slate-600">Traga seus pedidos ao Senhor</p>
              <p className="text-sm text-slate-500 max-w-[200px] leading-relaxed text-center">
                &ldquo;Apresentai os vossos pedidos a Deus em toda oração&rdquo; — Fp 4:6
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
                className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                  prayer.status === "ANSWERED"
                    ? "border-gold/40 bg-divine-50/60 shadow-[0_0_16px_rgba(212,175,55,0.18)]"
                    : "border-divine-100 bg-amber-50/30"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (prayer.status === "PENDING") {
                      navigator.vibrate?.([30, 30, 60]);
                      onMarkAnswered(prayer.id);
                    }
                  }}
                  className="p-3 -m-3 mt-0.5 flex-shrink-0 rounded-xl transition-transform hover:scale-110 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={prayer.status === "PENDING" ? "Marcar como respondido" : "Pedido respondido"}
                  title={prayer.status === "PENDING" ? "Marcar como respondido" : "Respondido"}
                >
                  {prayer.status === "ANSWERED" ? (
                    <CheckCircle2 className="w-6 h-6 text-gold drop-shadow-sm" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`text-base font-medium leading-tight ${prayer.status === "ANSWERED" ? "line-through text-slate-400" : "text-slate-700"}`}>
                    {prayer.title}
                  </p>
                  {prayer.description && (
                    <p className="text-base text-slate-500 mt-0.5 line-clamp-2">{prayer.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{prayer.createdAt}</span>
                    {prayer.prayedCount > 0 && (
                      <span className="text-xs text-rose-400">🙏 {prayer.prayedCount}</span>
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
