"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Trash2, BookMarked, Loader2, X, Search, Download, BarChart2, Lock, ChevronDown } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { PageSymbolCard } from "@/components/ui/PageBackground";

type JournalMood = "GRATIDAO" | "APRENDIZADO" | "DESAFIO" | "LOUVOR" | "PAZ" | "ADORACAO" | "ARREPENDIMENTO" | "RENOVACAO";

interface JournalEntry {
  id: string;
  content: string;
  mood: JournalMood;
  createdAt: string;
}

const MOODS: Record<JournalMood, { label: string; emoji: string; color: string; bg: string; border: string; prompt: string }> = {
  GRATIDAO:      { label: "Gratidão",       emoji: "🙏", color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",  prompt: "O que Deus fez por você que merece gratidão hoje?" },
  LOUVOR:        { label: "Louvor",          emoji: "🎶", color: "text-violet-700",  bg: "bg-violet-50",   border: "border-violet-200", prompt: "Como seu coração quer exaltar o Senhor agora?" },
  APRENDIZADO:   { label: "Aprendizado",     emoji: "📖", color: "text-blue-700",    bg: "bg-blue-50",     border: "border-blue-200",   prompt: "O que o Espírito Santo te ensinou hoje?" },
  PAZ:           { label: "Paz",             emoji: "🕊️", color: "text-teal-700",    bg: "bg-teal-50",     border: "border-teal-200",   prompt: "Como a paz de Deus está guardando seu coração hoje?" },
  ADORACAO:      { label: "Adoração",        emoji: "🙌", color: "text-orange-700",  bg: "bg-orange-50",   border: "border-orange-200", prompt: "O que você quer oferecer a Deus neste momento de adoração?" },
  RENOVACAO:     { label: "Renovação",       emoji: "🌱", color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200",prompt: "Como Deus está renovando sua mente e seu espírito?" },
  DESAFIO:       { label: "Desafio",         emoji: "⚔️", color: "text-rose-700",    bg: "bg-rose-50",     border: "border-rose-200",   prompt: "Qual batalha você está travando e como Deus está presente nela?" },
  ARREPENDIMENTO:{ label: "Arrependimento",  emoji: "💔", color: "text-slate-600",   bg: "bg-slate-50",    border: "border-slate-200",  prompt: "O que você quer trazer diante de Deus com um coração sincero?" },
};

const MOOD_ORDER: JournalMood[] = ["GRATIDAO", "LOUVOR", "APRENDIZADO", "PAZ", "ADORACAO", "RENOVACAO", "DESAFIO", "ARREPENDIMENTO"];

export default function DiarioPage() {
  const { isPremium } = usePlan();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<JournalMood>("GRATIDAO");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [moodOpen, setMoodOpen] = useState(false);
  const moodRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    if (!formOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (moodRef.current && !moodRef.current.contains(e.target as Node)) {
        setMoodOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [formOpen]);

  useEffect(() => {
    fetch("/api/journal")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setEntries(data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!content.trim() || saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mood }),
      });
      if (res.ok) {
        const entry = await res.json();
        setEntries((prev) => [entry, ...prev]);
        setContent("");
        setMood("GRATIDAO");
        setFormOpen(false);
      } else {
        setSaveError(true);
      }
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }, [content, mood, saving]);

  const handleDelete = useCallback(async (id: string) => {
    const res = await fetch(`/api/journal/${id}`, { method: "DELETE" }).catch(() => null);
    if (res && (res.ok || res.status === 204)) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } else {
      alert("Erro ao excluir. Tente novamente.");
    }
    setConfirmDelete(null);
  }, []);

  const handleExport = useCallback(() => {
    if (!isPremium) return;
    const text = entries.map((e) => {
      const date = new Date(e.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
      const def = MOODS[e.mood];
      return `--- ${date} · ${def.emoji} ${def.label} ---\n\n${e.content}\n`;
    }).join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `diario-espiritual-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries, isPremium]);

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return entries;
    const q = search.toLowerCase();
    return entries.filter((e) =>
      e.content.toLowerCase().includes(q) ||
      MOODS[e.mood].label.toLowerCase().includes(q)
    );
  }, [entries, search]);

  // Analytics: contagem por mood no mês atual
  const moodStats = useMemo(() => {
    const now = new Date();
    const thisMonth = entries.filter((e) => {
      const d = new Date(e.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const total = thisMonth.length || 1;
    return {
      items: MOOD_ORDER.map((m) => ({
        mood: m,
        count: thisMonth.filter((e) => e.mood === m).length,
        pct: Math.round((thisMonth.filter((e) => e.mood === m).length / total) * 100),
      })),
      hasThisMonth: thisMonth.length > 0,
    };
  }, [entries]);

  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6 min-h-full relative z-10">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="divine-card px-6 py-8 flex flex-col items-center text-center relative overflow-hidden"
      >
        <div className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.10) 0%, transparent 65%)" }} />

        <div className="relative flex items-center justify-center mb-4">
          <div className="absolute w-20 h-20 rounded-full border border-gold/15 animate-ping" style={{ animationDuration: "3s" }} />
          <div className="absolute w-14 h-14 rounded-full border border-gold/20" />
          <motion.span
            className="text-4xl relative z-10 emoji-glow"
            animate={{ rotate: [-3, 3, -3], scale: [1, 1.04, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            ✍️
          </motion.span>
        </div>

        <h1 className="font-serif text-3xl font-bold text-slate-900 tracking-tight">Diário Espiritual</h1>
        <p className="text-sm text-slate-500 mt-1">Suas reflexões, aprendizados e momentos com Deus</p>

        <div className="verse-highlight text-sm italic text-slate-600 mt-4 max-w-sm">
          &ldquo;Escreve a visão e grava-a nas tábuas, para que a possa ler, mesmo quem corra.&rdquo;
        </div>
        <p className="text-xs font-semibold text-gold-dark mt-1.5">— Habacuque 2:2</p>

        <div className="w-8 h-px bg-gold/40 mt-5" />

        <motion.button
          onClick={() => setFormOpen(true)}
          className="mt-5 btn-divine px-6 py-3 text-sm flex items-center gap-2"
          whileTap={{ scale: 0.96 }}
        >
          <PlusCircle className="w-4 h-4" />
          {entries.length === 0 ? "Escrever minha primeira reflexão" : "Nova reflexão"}
        </motion.button>
      </motion.div>

      <PageSymbolCard symbol="quill" />

      {/* ── Ferramentas Premium ── */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-2"
        >
          {/* Busca */}
          <div className="relative flex-1">
            {isPremium ? (
              <>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar nas reflexões..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-divine-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                />
              </>
            ) : (
              <a href="/assinar" className="flex items-center gap-2 w-full pl-3 pr-4 py-2.5 rounded-xl border border-divine-200 bg-divine-50/50 text-sm text-slate-400 cursor-pointer hover:border-gold/40 transition-colors">
                <Lock className="w-3.5 h-3.5 text-gold-dark/60" />
                <span className="text-slate-400">Buscar reflexões</span>
                <span className="ml-auto text-[10px] font-bold text-gold-dark bg-gold/10 px-1.5 py-0.5 rounded-full">Premium</span>
              </a>
            )}
          </div>

          {/* Analytics */}
          <button
            onClick={() => setShowAnalytics((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-divine-200 bg-white text-sm font-semibold text-gold-dark hover:bg-divine-50 transition-all"
            title="Análise de humores"
          >
            <BarChart2 className="w-4 h-4" />
          </button>

          {/* Export */}
          <button
            onClick={handleExport}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
              isPremium
                ? "border-divine-200 bg-white text-gold-dark hover:bg-divine-50"
                : "border-divine-200 bg-divine-50/50 text-slate-400 cursor-default"
            }`}
            title={isPremium ? "Exportar diário" : "Premium"}
          >
            {!isPremium && <Lock className="w-3 h-3 text-gold-dark/50 absolute -top-1 -right-1" />}
            <Download className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* ── Analytics panel (Premium) ── */}
      <AnimatePresence>
        {showAnalytics && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="divine-card p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">Humores — este mês</p>
              <button onClick={() => setShowAnalytics(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2.5">
              {moodStats.items.map(({ mood: m, count, pct }) => {
                const def = MOODS[m];
                return (
                  <div key={m} className="flex items-center gap-3">
                    <span className="text-sm w-5 text-center">{def.emoji}</span>
                    <span className="text-xs text-slate-600 w-20 shrink-0">{def.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-divine-100 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`h-full rounded-full ${def.bg.replace("bg-", "bg-").replace("-50", "-300")}`}
                      />
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums w-12 text-right">{count}x · {pct}%</span>
                  </div>
                );
              })}
            </div>
            {!moodStats.hasThisMonth && (
              <p className="text-xs text-slate-400 text-center mt-2">Nenhuma entrada este mês ainda.</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upsell Premium (free, com entradas) ── */}
      {!isPremium && entries.length >= 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl border border-gold/30 bg-gradient-to-r from-amber-50 to-divine-50 px-5 py-4 flex items-center gap-4"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700">Sua jornada merece ser lembrada.</p>
            <p className="text-xs text-slate-500 mt-0.5">Com Premium: busca nas reflexões e exportação completa do seu diário.</p>
          </div>
          <a href="/assinar" className="shrink-0 text-xs font-bold text-gold-dark bg-gold/10 border border-gold/30 px-3 py-2 rounded-xl hover:bg-gold/20 transition-colors whitespace-nowrap">
            ✦ Aprofundar minha jornada
          </a>
        </motion.div>
      )}

      {/* ── Formulário ── */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            className="divine-card overflow-hidden border-l-[3px] border-l-gold/50"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {/* Header — data como diário */}
            <div className="relative px-5 pt-5 pb-4 text-center border-b border-amber-100/80 bg-gradient-to-b from-amber-50/50 to-transparent">
              <button
                onClick={() => setFormOpen(false)}
                className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100/80"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold-dark/70 mb-1">Nova Entrada</p>
              <p className="font-serif text-2xl font-bold text-slate-800 leading-tight">
                {new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">
                {new Date().toLocaleDateString("pt-BR", { weekday: "long" })} · {new Date().getFullYear()}
              </p>
            </div>

            <div className="p-5 space-y-4">
              {/* Mood — botão dropdown */}
              <div ref={moodRef} className="relative">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 px-0.5">Como está seu coração?</p>
                <button
                  onClick={() => setMoodOpen((v) => !v)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all shadow-sm ${
                    MOODS[mood].bg
                  } ${MOODS[mood].border} ${MOODS[mood].color}`}
                >
                  <span className="text-xl leading-none">{MOODS[mood].emoji}</span>
                  <span className="flex-1 text-left font-semibold">{MOODS[mood].label}</span>
                  <ChevronDown className={`w-4 h-4 opacity-60 transition-transform ${moodOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {moodOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-1 z-50 divine-card shadow-divine border border-divine-200 overflow-hidden"
                    >
                      <div className="relative">
                        <div className="max-h-48 overflow-y-auto custom-scroll py-1">
                          {MOOD_ORDER.map((m) => {
                            const def = MOODS[m];
                            const active = mood === m;
                            return (
                              <button
                                key={m}
                                onClick={() => { setMood(m); setMoodOpen(false); }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-colors ${
                                  active ? `${def.bg} ${def.color}` : "text-slate-600 hover:bg-divine-50"
                                }`}
                              >
                                <span className="text-base">{def.emoji}</span>
                                <span className="flex-1 text-left">{def.label}</span>
                                {active && <span className="text-xs opacity-60">✓</span>}
                              </button>
                            );
                          })}
                        </div>
                        {/* Indicador de scroll */}
                        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent rounded-b-2xl" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Prompt inspiracional */}
                <p className={`text-xs mt-2 px-0.5 italic ${MOODS[mood].color} opacity-80`}>
                  {MOODS[mood].prompt}
                </p>
              </div>

              {/* Textarea — estilo caderno */}
              <div className={`rounded-xl border-2 ${MOODS[mood].border} overflow-hidden transition-colors`}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Derrame seu coração diante do Senhor..."
                  className="w-full h-48 px-4 py-3 font-serif text-base text-slate-700 placeholder-slate-300 focus:outline-none resize-none leading-relaxed bg-white/80"
                  maxLength={2000}
                />
                <div className={`flex justify-between items-center px-4 py-2 border-t ${MOODS[mood].border} ${MOODS[mood].bg}`}>
                  <span className={`text-xs tabular-nums font-medium ${MOODS[mood].color} opacity-70`}>{content.length} / 2000</span>
                  <BookMarked className={`w-3 h-3 ${MOODS[mood].color} opacity-40`} />
                </div>
              </div>

              {/* Ações */}
              <div className="space-y-2 pt-1">
                {saveError && (
                  <p className="text-xs text-red-500 text-center bg-red-50 rounded-lg px-3 py-2">
                    ❌ Erro ao guardar. Tente novamente.
                  </p>
                )}
                <button
                  onClick={handleCreate}
                  disabled={saving || !content.trim()}
                  className="w-full btn-divine py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <BookMarked className="w-3.5 h-3.5" />
                      Guardar no diário
                    </>
                  )}
                </button>
                <button
                  onClick={() => setFormOpen(false)}
                  className="w-full py-2 rounded-xl text-sm text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lista ── */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-gold" />
        </div>
      ) : entries.length === 0 ? null : (
        <div className="relative">
          <div className="absolute left-[2.35rem] top-4 bottom-4 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent" />

          <div className="space-y-4">
            <AnimatePresence>
              {filteredEntries.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-slate-400 text-center py-8"
                >
                  Nenhuma reflexão encontrada para &ldquo;{search}&rdquo;.
                </motion.p>
              ) : filteredEntries.map((entry, idx) => {
                const def = MOODS[entry.mood];
                const date = new Date(entry.createdAt);
                const day = date.getDate();
                const month = date.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase();
                const year = date.getFullYear();
                const fullDate = date.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: idx * 0.04 }}
                    layout
                    className="flex gap-4"
                  >
                    {/* Data */}
                    <div className="flex flex-col items-center shrink-0 w-12 pt-3 relative z-10">
                      <div className="flex flex-col items-center bg-white border border-divine-100 rounded-xl px-1.5 py-2 shadow-sm w-full">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gold-dark/70 leading-none">{month}</span>
                        <span className="font-serif text-2xl font-bold text-gold leading-none tabular-nums mt-0.5">{day}</span>
                        <span className="text-[10px] text-slate-400 leading-none mt-0.5">{year}</span>
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex-1 min-w-0">
                      <div className={`divine-card p-4 border-l-[3px] ${def.border}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${def.bg} ${def.color}`}>
                            <span>{def.emoji}</span>
                            {def.label}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize hidden sm:block">{fullDate}</span>
                        </div>

                        <p className="font-serif text-base leading-loose text-slate-700 whitespace-pre-wrap">
                          {entry.content}
                        </p>

                        <div className="flex items-center justify-end mt-3 pt-3 border-t border-divine-100">
                          {confirmDelete === entry.id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500">Excluir esta entrada?</span>
                              <button onClick={() => handleDelete(entry.id)} className="text-xs font-semibold text-red-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                                Sim
                              </button>
                              <button onClick={() => setConfirmDelete(null)} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-divine-50 transition-colors">
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(entry.id)}
                              className="flex items-center gap-1 text-xs text-slate-300 hover:text-red-400 transition-colors py-1 px-2 rounded-lg hover:bg-red-50"
                            >
                              <Trash2 className="w-3 h-3" />
                              Excluir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
