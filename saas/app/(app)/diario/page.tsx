"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlusCircle, Trash2, BookMarked, Loader2 } from "lucide-react";
import { PremiumGate } from "@/components/ui/PremiumGate";

type JournalMood = "GRATIDAO" | "APRENDIZADO" | "DESAFIO" | "LOUVOR";

interface JournalEntry {
  id: string;
  content: string;
  mood: JournalMood;
  createdAt: string;
}

const MOOD_LABELS: Record<JournalMood, string> = {
  GRATIDAO: "🙏 Gratidão",
  APRENDIZADO: "📖 Aprendizado",
  DESAFIO: "⚔️ Desafio",
  LOUVOR: "🎶 Louvor",
};

const MOOD_COLORS: Record<JournalMood, string> = {
  GRATIDAO: "bg-amber-100 text-amber-800",
  APRENDIZADO: "bg-blue-100 text-blue-800",
  DESAFIO: "bg-red-100 text-red-700",
  LOUVOR: "bg-purple-100 text-purple-800",
};

export default function DiarioPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<JournalMood>("GRATIDAO");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/journal")
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setEntries(data))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = useCallback(async () => {
    if (!content.trim()) return;
    setSaving(true);
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
    }
    setSaving(false);
  }, [content, mood]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/journal/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-10 py-6 space-y-6 min-h-full relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine">
              <BookMarked className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-slate-900">Diário Espiritual</h1>
              <p className="text-xs text-slate-400 tracking-wide">Suas reflexões e aprendizados</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="btn-divine px-4 py-2.5 text-sm flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Nova entrada
        </button>
      </div>

      <PremiumGate feature="Diário Espiritual — registre suas reflexões, aprendizados e momentos com Deus.">
        <div className="space-y-4">
          <AnimatePresence>
            {formOpen && (
              <motion.div
                className="divine-card p-5 space-y-4"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
              >
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(MOOD_LABELS) as JournalMood[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMood(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                        mood === m
                          ? "border-gold bg-gold/10 text-gold-dark"
                          : "border-divine-200 text-slate-500 hover:border-gold/40"
                      }`}
                    >
                      {MOOD_LABELS[m]}
                    </button>
                  ))}
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="O que Deus colocou no seu coração hoje?"
                  className="w-full h-32 px-4 py-3 rounded-2xl border border-amber-100 bg-white text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
                  maxLength={2000}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{content.length}/2000</span>
                  <div className="flex gap-2">
                    <button onClick={() => setFormOpen(false)} className="text-sm text-slate-400 hover:text-slate-600 px-4 py-2">
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={saving || !content.trim()}
                      className="btn-divine px-5 py-2 text-sm disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gold" />
            </div>
          ) : entries.length === 0 ? (
            <div className="divine-card p-10 flex flex-col items-center gap-4 text-center">
              <span className="text-4xl">📖</span>
              <p className="font-serif text-lg font-semibold text-slate-700">Seu diário está vazio</p>
              <p className="text-sm text-slate-400 max-w-xs">Comece registrando o que Deus tem falado ao seu coração hoje.</p>
              <blockquote className="verse-highlight text-sm italic text-slate-600 mt-2">
                &ldquo;Escreve a visão, e grava-a nas tábuas, para que a possa ler, mesmo quem corra.&rdquo;
              </blockquote>
              <p className="text-xs font-semibold text-gold-dark">— Habacuque 2:2</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {entries.map((entry) => (
                  <motion.div
                    key={entry.id}
                    className="divine-card p-5 group"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    layout
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MOOD_COLORS[entry.mood]}`}>
                            {MOOD_LABELS[entry.mood]}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(entry.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="flex-shrink-0 p-1.5 text-slate-300 hover:text-red-400 transition-colors"
                        aria-label="Excluir entrada"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </PremiumGate>
    </div>
  );
}
