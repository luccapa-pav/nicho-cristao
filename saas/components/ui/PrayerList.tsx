"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Plus, X, Heart, Users, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

interface Prayer {
  id: string;
  title: string;
  description?: string;
  testimony?: string;
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
  onMarkAnswered: (id: string, testimony?: string) => void;
  onPrayedFor?: (id: string) => void;
  onDeletePrayer?: (id: string) => void;
  autoOpenForm?: boolean;
  onFormOpened?: () => void;
  groupPrayers?: GroupPrayer[];
  isLoading?: boolean;
  isPremium?: boolean;
}

type Tab = "ALL" | "PENDING" | "ANSWERED" | "CELULA";

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Sem data";
  return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export function PrayerList({
  prayers, onAddPrayer, onMarkAnswered, onPrayedFor, onDeletePrayer, autoOpenForm, onFormOpened,
  groupPrayers = [], isLoading, isPremium,
}: PrayerListProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [tab, setTab] = useState<Tab>("ALL");
  const [awaitingTestimony, setAwaitingTestimony] = useState<string | null>(null);
  const [testimonyText, setTestimonyText] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoOpenForm) { setShowForm(true); onFormOpened?.(); }
  }, [autoOpenForm, onFormOpened]);

  const filtered = tab === "CELULA"
    ? []
    : prayers.filter((p) => tab === "ALL" ? true : p.status === tab);

  const grouped: { month: string; items: Prayer[] }[] = [];
  if (isPremium && filtered.length > 0) {
    filtered.forEach((p) => {
      const m = monthLabel(p.createdAt);
      const last = grouped[grouped.length - 1];
      if (last && last.month === m) last.items.push(p);
      else grouped.push({ month: m, items: [p] });
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddPrayer(title.trim(), description.trim() || undefined, isPublic);
    setTitle(""); setDescription(""); setIsPublic(false); setShowForm(false);
  };

  const confirmAnswer = (id: string) => {
    navigator.vibrate?.([30, 30, 60, 30, 120]);
    onMarkAnswered(id, testimonyText.trim() || undefined);
    setAwaitingTestimony(null);
    setTestimonyText("");
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#D4AF37", "#F5E27A", "#FFFFFF", "#FFA500"] });
  };

  const handlePrayed = async (id: string) => {
    navigator.vibrate?.([20]);
    onPrayedFor?.(id);
    await fetch(`/api/prayers/${id}/prayed`, { method: "POST" });
  };

  const handleExport = async () => {
    const answered = prayers.filter((p) => p.status === "ANSWERED").length;
    const total = prayers.length;
    const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
    const text =
      `📖 Meu Diário de Oração — Luz Divina\n\n` +
      `✦ ${total} pedidos no total\n✓ ${answered} respondidos por Deus (${pct}%)\n` +
      `🙏 ${total - answered} aguardando\n\n"Apresentai os vossos pedidos a Deus" — Fp 4:6`;
    try {
      if (navigator.share) await navigator.share({ title: "Meu Diário de Oração", text });
      else { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    } catch { /* cancelled */ }
  };

  const answeredCount = prayers.filter((p) => p.status === "ANSWERED").length;
  const pendingCount  = prayers.filter((p) => p.status === "PENDING").length;

  return (
    <div className="divine-card p-5 flex flex-col gap-4 h-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0">
            <Heart className="w-5 h-5 text-gold-dark" />
          </div>
          <div>
            <p className="text-sm font-bold text-gold-dark leading-none">
              ✦ Pedidos diante de Deus
            </p>
            <p className="text-xs text-slate-400 mt-0.5 leading-none">
              {answeredCount} respondidas · {pendingCount} pendentes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {prayers.length > 0 && (
            <button
              onClick={handleExport}
              title={copied ? "Copiado!" : "Compartilhar diário"}
              className="w-8 h-8 rounded-lg bg-divine-50 border border-divine-200 flex items-center justify-center text-gold-dark hover:bg-divine-100 transition-colors"
            >
              {copied ? <span className="text-[10px] font-bold">✓</span> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          )}
          {tab !== "CELULA" && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="w-8 h-8 rounded-lg bg-divine-50 border border-divine-200 flex items-center justify-center text-gold-dark hover:bg-divine-100 transition-colors"
            >
              {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="divine-divider" />

      {/* ── Formulário ── */}
      <AnimatePresence>
        {showForm && tab !== "CELULA" && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="flex flex-col gap-2.5 overflow-hidden"
          >
            <p className="text-xs text-slate-400 italic text-center">
              Escreva seu pedido — Deus escuta cada palavra
            </p>
            <input
              type="text"
              placeholder="Título do pedido..."
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 120))}
              className="w-full px-4 py-3 rounded-xl border border-divine-200 bg-divine-50/30 text-base text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold focus:bg-white transition-colors"
              autoFocus
            />
            <textarea
              placeholder="Detalhes (opcional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 600))}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-divine-200 bg-divine-50/30 text-base text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:bg-white transition-colors resize-none"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
              Compartilhar com minha célula
            </label>
            <button type="submit" className="btn-divine py-3 text-base w-full">
              Adicionar pedido 🙏
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* ── Tabs ── */}
      <div className="flex gap-1.5 flex-wrap">
        {(["ALL", "PENDING", "ANSWERED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setTab(f)}
            className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold transition-all ${
              tab === f
                ? "bg-gold text-white shadow-sm"
                : "bg-divine-50 text-slate-600 border border-divine-200 hover:bg-divine-100"
            }`}
          >
            {f === "ALL" ? "Todos" : f === "PENDING" ? "Aguardando" : "Respondidos"}
            {f === "PENDING" && pendingCount > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                tab === "PENDING" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-700"
              }`}>{pendingCount}</span>
            )}
            {f === "ANSWERED" && answeredCount > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                tab === "ANSWERED" ? "bg-white/25 text-white" : "bg-gold/15 text-gold-dark"
              }`}>{answeredCount}</span>
            )}
          </button>
        ))}
        <button
          onClick={() => setTab("CELULA")}
          className={`flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold transition-all ${
            tab === "CELULA"
              ? "bg-gold text-white shadow-sm"
              : "bg-divine-50 text-slate-600 border border-divine-200 hover:bg-divine-100"
          }`}
        >
          <Users className="w-3 h-3" />
          Célula
          {groupPrayers.length > 0 && (
            <span className={`text-xs font-bold px-1 py-0.5 rounded-full ${
              tab === "CELULA" ? "bg-white/20" : "bg-gold/20 text-gold-dark"
            }`}>
              {groupPrayers.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Lista ── */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto custom-scroll pr-0.5 max-h-[32rem]">
        <AnimatePresence initial={false}>
          {isLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-divine-100 animate-pulse">
                <div className="w-5 h-5 rounded-full bg-divine-100 shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3.5 bg-divine-100 rounded w-3/4" />
                  <div className="h-3 bg-divine-50 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : tab === "CELULA" ? (
            groupPrayers.length === 0 ? (
              <div className="text-center py-8 flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-divine-50 flex items-center justify-center">
                  <Users className="w-5 h-5 text-divine-300" />
                </div>
                <p className="text-sm font-semibold text-slate-700">Ore pelos seus irmãos</p>
                <p className="text-xs text-slate-500 max-w-[210px] leading-relaxed text-center italic">
                  &ldquo;Orai uns pelos outros para que sareis.&rdquo; — Tg 5:16
                </p>
                <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed text-center">
                  Com o Premium, interceda pelos pedidos da sua célula em tempo real.
                </p>
                <Link href="/perfil">
                  <button className="btn-divine py-2.5 px-5 text-xs">✦ Quero interceder pela minha célula</button>
                </Link>
              </div>
            ) : (
              groupPrayers.map((gp, i) => (
                <motion.div
                  key={gp.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-divine-100 bg-amber-50/30"
                >
                  <div className="w-6 h-6 rounded-full bg-divine-100 flex items-center justify-center text-gold-dark text-[10px] font-bold shrink-0">
                    {gp.author[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 leading-tight">{gp.title}</p>
                    {gp.description && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{gp.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] text-slate-500">{gp.author}</span>
                      <span className="text-[10px] text-slate-300">·</span>
                      <span className="text-[10px] text-slate-400">{gp.createdAt}</span>
                      {gp.prayedCount > 0 && (
                        <span className="text-[10px] text-rose-400">🙏 {gp.prayedCount}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )
          ) : filtered.length === 0 ? (
            tab === "ANSWERED" ? (
              <div className="text-center py-10 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-divine-50 border border-gold/30 flex items-center justify-center shadow-[0_0_18px_rgba(212,175,55,0.18)]">
                  <span className="text-3xl">✦</span>
                </div>
                <p className="text-base font-semibold text-slate-700">Nenhuma resposta ainda</p>
                <p className="text-sm text-slate-500 max-w-[220px] leading-relaxed text-center italic">
                  &ldquo;Pedi e vos será dado&rdquo; — Mt 7:7
                </p>
                <p className="text-xs text-slate-400 max-w-[200px] text-center">
                  Quando Deus responder, marque o pedido como respondido e registre seu testemunho.
                </p>
              </div>
            ) : (
              <div className="text-center py-10 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-divine-50 border border-divine-200 flex items-center justify-center shadow-[0_0_18px_rgba(212,175,55,0.12)]">
                  <Heart className="w-7 h-7 text-gold/60" />
                </div>
                <p className="text-base font-semibold text-slate-700">Traga seus pedidos ao Senhor</p>
                <p className="text-sm text-slate-500 max-w-[220px] leading-relaxed text-center italic">
                  &ldquo;Apresentai os vossos pedidos a Deus em toda oração&rdquo; — Fp 4:6
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-divine py-2.5 px-6 text-sm mt-1"
                >
                  + Adicionar primeiro pedido
                </button>
              </div>
            )
          ) : isPremium ? (
            grouped.map(({ month, items }) => (
              <div key={month}>
                <p className="text-[10px] text-gold-dark font-bold uppercase tracking-widest py-1.5 px-1 capitalize">
                  {month}
                </p>
                {items.map((prayer, i) => (
                  <PrayerItem
                    key={prayer.id}
                    prayer={prayer}
                    index={i}
                    awaitingTestimony={awaitingTestimony}
                    testimonyText={testimonyText}
                    onSetAwaiting={(id) => { setAwaitingTestimony(id); setTestimonyText(""); }}
                    onTestimonyChange={setTestimonyText}
                    onConfirmAnswer={confirmAnswer}
                    onCancelTestimony={() => setAwaitingTestimony(null)}
                    onPrayed={handlePrayed}
                    onDelete={onDeletePrayer}
                  />
                ))}
              </div>
            ))
          ) : (
            filtered.map((prayer, i) => (
              <PrayerItem
                key={prayer.id}
                prayer={prayer}
                index={i}
                awaitingTestimony={awaitingTestimony}
                testimonyText={testimonyText}
                onSetAwaiting={(id) => { setAwaitingTestimony(id); setTestimonyText(""); }}
                onTestimonyChange={setTestimonyText}
                onConfirmAnswer={confirmAnswer}
                onCancelTestimony={() => setAwaitingTestimony(null)}
                onPrayed={handlePrayed}
                onDelete={onDeletePrayer}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PrayerItem({
  prayer, index, awaitingTestimony, testimonyText,
  onSetAwaiting, onTestimonyChange, onConfirmAnswer, onCancelTestimony, onPrayed, onDelete,
}: {
  prayer: Prayer;
  index: number;
  awaitingTestimony: string | null;
  testimonyText: string;
  onSetAwaiting: (id: string) => void;
  onTestimonyChange: (v: string) => void;
  onConfirmAnswer: (id: string) => void;
  onCancelTestimony: () => void;
  onPrayed: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDelete = async () => {
    await fetch(`/api/prayers/${prayer.id}`, { method: "DELETE" });
    onDelete?.(prayer.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ delay: index * 0.04 }}
      className={`flex flex-col p-3 rounded-xl border transition-all ${
        prayer.status === "ANSWERED"
          ? "border-gold/40 bg-gradient-to-r from-divine-50 to-divine-100/60 shadow-[0_2px_12px_rgba(212,175,55,0.18)]"
          : "border-divine-200 bg-white border-l-[3px] border-l-amber-300"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => { if (prayer.status === "PENDING") onSetAwaiting(prayer.id); }}
          className="shrink-0 mt-0.5 flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:scale-110 hover:bg-divine-100 active:scale-95 group"
          aria-label={prayer.status === "PENDING" ? "Marcar como respondido" : "Pedido respondido"}
        >
          {prayer.status === "ANSWERED"
            ? <CheckCircle2 className="w-5 h-5 text-gold" />
            : <Clock className="w-4 h-4 text-divine-400 group-hover:text-gold-dark transition-colors" />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={`leading-snug ${
            prayer.status === "ANSWERED" ? "text-gold-dark font-semibold" : "text-base font-semibold text-slate-700"
          }`}>
            {prayer.title}
          </p>
          {prayer.status === "ANSWERED" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gold-dark bg-gold/10 border border-gold/20 rounded-full px-2 py-0.5 mt-1">
              ✦ Respondido por Deus
            </span>
          )}
          {prayer.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
              {prayer.description}
            </p>
          )}
          {prayer.testimony && (
            <div className="mt-1.5 pl-2.5 border-l-2 border-gold/30">
              <p className="text-[10px] text-gold-dark font-bold uppercase tracking-wide">Testemunho ✦</p>
              <p className="text-xs text-slate-600 italic mt-0.5">{prayer.testimony}</p>
            </div>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-slate-400">{prayer.createdAt}</span>
            {prayer.status === "PENDING" && (
              <button
                onClick={() => onPrayed(prayer.id)}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-400 hover:bg-rose-100 transition-colors active:scale-95"
                aria-label="Orei por este pedido"
              >
                🙏 {prayer.prayedCount > 0 ? `Orei (${prayer.prayedCount})` : "Orei por isso"}
              </button>
            )}
            {prayer.status === "ANSWERED" && prayer.prayedCount > 0 && (
              <span className="text-xs text-rose-400">🙏 {prayer.prayedCount}</span>
            )}
            {onDelete && !confirmingDelete && (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="ml-auto p-1 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                aria-label="Excluir pedido"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            {confirmingDelete && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-xs text-slate-500">Excluir?</span>
                <button
                  onClick={handleDelete}
                  className="px-2 py-0.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-500 hover:bg-red-100 transition-colors"
                >
                  Sim
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="px-2 py-0.5 rounded-lg border border-slate-200 text-xs text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Não
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {awaitingTestimony === prayer.id && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2.5 flex flex-col gap-2 overflow-hidden"
        >
          <p className="text-xs font-semibold text-gold-dark">✦ Como Deus respondeu?</p>
          <textarea
            placeholder="Escreva seu testemunho (opcional)..."
            value={testimonyText}
            onChange={(e) => onTestimonyChange(e.target.value.slice(0, 400))}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gold/30 bg-white text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={() => onConfirmAnswer(prayer.id)} className="btn-divine py-2 px-3 text-xs flex-1">
              Confirmar ✓
            </button>
            <button
              onClick={onCancelTestimony}
              className="py-2 px-3 text-xs rounded-xl border border-divine-200 text-slate-500 hover:bg-divine-50 transition-colors"
            >
              Pular
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
