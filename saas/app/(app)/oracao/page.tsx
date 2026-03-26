"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer, BookOpen, CheckCircle2, Clock, Plus, Bell, BellOff,
  ChevronDown, ChevronUp, Lock,
} from "lucide-react";
import Link from "next/link";
import { PrayerList } from "@/components/ui/PrayerList";
import { PrayerTimer } from "@/components/ui/PrayerTimer";
import { PrayerConfigModal } from "@/components/ui/PrayerConfigModal";
import { LordsPrayerGuide } from "@/components/ui/LordsPrayerGuide";
import { usePlan } from "@/hooks/usePlan";
import { PRAYER_VERSES } from "@/lib/prayerVerses";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface Prayer {
  id: string;
  title: string;
  description?: string;
  testimony?: string;
  status: "PENDING" | "ANSWERED" | "CLOSED";
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

// ── Dados das orações consagradas ────────────────────────────────────────────
interface OracaoConsagrada {
  id: string;
  icon: string;
  titulo: string;
  snippet: string;
  partes: Array<{ trecho: string; explicacao: string }>;
}

const ORACOES_CONSAGRADAS: OracaoConsagrada[] = [
  {
    id: "pai_nosso",
    icon: "✝️",
    titulo: "Pai Nosso (Oração do Senhor)",
    snippet: "Pai nosso, que estais nos céus, santificado...",
    partes: [
      {
        trecho: "Pai nosso, que estais nos céus, santificado seja o vosso nome. Venha a nós o vosso reino. Seja feita a vossa vontade, assim na terra como no céu.",
        explicacao: "Reconhecemos a soberania e a proximidade de Deus. Ele é Pai — íntimo — e ao mesmo tempo Senhor de tudo o que existe.",
      },
      {
        trecho: "O pão nosso de cada dia nos dai hoje. Perdoai-nos as nossas ofensas, assim como nós perdoamos a quem nos tem ofendido.",
        explicacao: "Dependemos de Deus para sustento e perdão. Ao pedir perdão, somos chamados a também perdoar — essa é a condição do discípulo.",
      },
      {
        trecho: "E não nos deixeis cair em tentação, mas livrai-nos do mal. Amém.",
        explicacao: "Reconhecemos nossa fragilidade e pedimos proteção divina. A oração termina com plena confiança no poder e na fidelidade de Deus.",
      },
    ],
  },
  {
    id: "ave_maria",
    icon: "🌹",
    titulo: "Ave Maria",
    snippet: "Ave, Maria, cheia de graça, o Senhor é convosco...",
    partes: [
      {
        trecho: "Ave, Maria, cheia de graça, o Senhor é convosco.",
        explicacao: "A saudação do anjo Gabriel a Maria, reconhecendo a graça especial que Deus derramou sobre ela. Lc 1:28.",
      },
      {
        trecho: "Bendita sois vós entre as mulheres e bendito é o fruto do vosso ventre, Jesus.",
        explicacao: "A bênção de Isabel ao encontrar Maria — Lc 1:42. Jesus, fruto bendito, é o centro desta oração.",
      },
      {
        trecho: "Santa Maria, Mãe de Deus, rogai por nós, pecadores, agora e na hora da nossa morte. Amém.",
        explicacao: "Um pedido de intercessão, reconhecendo Maria como Mãe de Deus e invocando sua presença no momento mais decisivo da vida.",
      },
    ],
  },
  {
    id: "sao_francisco",
    icon: "🕊️",
    titulo: "Oração de São Francisco de Assis",
    snippet: "Senhor, fazei-me instrumento de vossa paz...",
    partes: [
      {
        trecho: "Senhor, fazei-me instrumento de vossa paz. Onde houver ódio, que eu leve o amor; onde houver ofensa, que eu leve o perdão.",
        explicacao: "Uma disponibilidade radical ao serviço. Não pedimos que o mundo mude — pedimos que nós sejamos o canal da transformação.",
      },
      {
        trecho: "Onde houver discórdia, que eu leve a união; onde houver dúvida, que eu leve a fé; onde houver desespero, que eu leve a esperança; onde houver tristeza, que eu leve a alegria.",
        explicacao: "Cada situação de escuridão é uma oportunidade de levar luz. São Francisco via o sofrimento do mundo como um chamado à missão.",
      },
      {
        trecho: "Ó Mestre, fazei que eu procure mais consolar que ser consolado; compreender que ser compreendido; amar que ser amado. Pois é dando que se recebe, é perdoando que se é perdoado, e é morrendo que se nasce para a vida eterna.",
        explicacao: "O paradoxo do Reino: a plenitude vem pela entrega. Quem busca preservar sua vida, perde. Quem a entrega por amor, encontra.",
      },
    ],
  },
  {
    id: "credo",
    icon: "📖",
    titulo: "Credo Apostólico",
    snippet: "Creio em Deus Pai todo-poderoso, Criador do céu e da terra...",
    partes: [
      {
        trecho: "Creio em Deus Pai todo-poderoso, Criador do céu e da terra.",
        explicacao: "A base de tudo: existe um Deus pessoal, Pai, que é a origem de toda a criação. Nossa fé começa e se sustenta nele.",
      },
      {
        trecho: "E em Jesus Cristo, seu único Filho, nosso Senhor, que foi concebido pelo poder do Espírito Santo, nasceu da Virgem Maria, padeceu sob Pôncio Pilatos, foi crucificado, morto e sepultado; ressuscitou ao terceiro dia, subiu aos céus.",
        explicacao: "O coração da fé cristã: Jesus é real, histórico, e ressuscitou. Cada afirmação aqui é um fundamento que transforma como vivemos.",
      },
      {
        trecho: "Creio no Espírito Santo, na santa Igreja, na comunhão dos santos, na remissão dos pecados, na ressurreição da carne, na vida eterna. Amém.",
        explicacao: "A vida no Espírito, a comunidade de fé e a esperança além da morte. O Credo nos lembra: não somos cristãos sozinhos.",
      },
    ],
  },
];

// ── Guia de Orações Consagradas — Freemium Taste ─────────────────────────────
// Regra: índice 0 (Pai Nosso) sempre desbloqueado. Demais: mostra 1ª parte livre + soft-block no resto.
function ConsagradasSection({ isPremium }: { isPremium: boolean }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gold/70">
            ✦ Guia de Orações Consagradas
          </p>
          <p className="text-xs text-slate-400 mt-0.5">Orações da tradição cristã</p>
        </div>
        {!isPremium && (
          <Link href="/assinar">
            <span className="flex items-center gap-1 bg-amber-50 border border-gold/30 rounded-full px-2.5 py-1 text-[11px] font-semibold text-gold-dark cursor-pointer">
              <Lock className="w-3 h-3" /> Premium
            </span>
          </Link>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {ORACOES_CONSAGRADAS.map((o, index) => {
          const isLocked = !isPremium && index > 0;
          const isExpanded = expanded === o.id;

          return (
            <div key={o.id} className="divine-card overflow-hidden">
              {/* Header */}
              <button
                className="w-full p-4 text-left flex items-start gap-3"
                onClick={() => setExpanded(isExpanded ? null : o.id)}
                aria-label={`${isExpanded ? "Fechar" : "Abrir"} ${o.titulo}`}
              >
                <span className="text-xl flex-shrink-0 mt-0.5">{o.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-700 text-sm leading-tight">{o.titulo}</p>
                  <p className="text-xs text-slate-400 italic mt-1 leading-relaxed">{o.snippet}</p>
                </div>
                {isLocked ? (
                  <Lock className="w-4 h-4 text-gold/50 flex-shrink-0 mt-1" />
                ) : isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                )}
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    key={o.id + "-content"}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-divine-100 px-4 pb-4 pt-3">
                      {/* Primeira parte — sempre visível */}
                      <div className="py-2">
                        <p className="text-sm text-slate-600 italic leading-relaxed">
                          &ldquo;{o.partes[0].trecho}&rdquo;
                        </p>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {o.partes[0].explicacao}
                        </p>
                      </div>

                      {isLocked ? (
                        /* Soft-block: partes restantes borradas + paywall */
                        <div className="relative mt-1">
                          <div
                            className="pointer-events-none select-none"
                            style={{ filter: "blur(4px)", opacity: 0.55 }}
                            aria-hidden="true"
                          >
                            {o.partes.slice(1).map((parte, i) => (
                              <div key={i} className="py-2 border-t border-divine-100">
                                <p className="text-sm text-slate-600 italic leading-relaxed">
                                  &ldquo;{parte.trecho}&rdquo;
                                </p>
                                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                  {parte.explicacao}
                                </p>
                              </div>
                            ))}
                          </div>
                          {/* Gradient fade */}
                          <div className="absolute inset-0 pointer-events-none paywall-fade" />
                          {/* Paywall CTA */}
                          <div className="absolute inset-0 flex items-end justify-center pb-2">
                            <Link href="/assinar">
                              <button className="btn-divine py-2.5 px-5 text-sm shadow-divine">
                                ✦ Seja Premium — leia a reflexão completa
                              </button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        /* Partes restantes desbloqueadas */
                        o.partes.slice(1).map((parte, i) => (
                          <div key={i} className="py-2 border-t border-divine-100">
                            <p className="text-sm text-slate-600 italic leading-relaxed">
                              &ldquo;{parte.trecho}&rdquo;
                            </p>
                            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                              {parte.explicacao}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function OracaoPage() {
  const { isPremium } = usePlan();
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [groupPrayers, setGroupPrayers] = useState<GroupPrayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [configOpen, setConfigOpen] = useState(false);
  const [configMinutes, setConfigMinutes] = useState(10);
  const [configWithMusic, setConfigWithMusic] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [autoOpenForm, setAutoOpenForm] = useState(false);
  const [error, setError] = useState(false);
  const [lordsPrayerOpen, setLordsPrayerOpen] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);

  const handleConfigStart = (minutes: number, withMusic: boolean) => {
    setConfigMinutes(minutes);
    setConfigWithMusic(withMusic);
    setConfigOpen(false);
    setTimerOpen(true);
  };

  // Lembrete
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [reminderMsg, setReminderMsg] = useState("");
  const [reminderToast, setReminderToast] = useState("");
  const [reminderPermDenied, setReminderPermDenied] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("prayerReminder");
      if (stored) {
        const { enabled, time, msg } = JSON.parse(stored);
        setReminderEnabled(enabled ?? false);
        setReminderTime(time ?? "08:00");
        setReminderMsg(msg ?? "");
      }
    } catch { /* ignore corrupt storage */ }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("prayerReminder", JSON.stringify({ enabled: reminderEnabled, time: reminderTime, msg: reminderMsg }));
    } catch { /* ignore */ }
    if (!reminderEnabled || !reminderTime) return;
    const [h, m] = reminderTime.split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(h, m, 0, 0);
    const alreadyShown = localStorage.getItem("prayerReminderDate") === now.toDateString();
    if (alreadyShown) return;
    const ms = target.getTime() - now.getTime();
    if (ms < 0 || ms > 3 * 60 * 60 * 1000) return;
    const t = setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("Vida com Jesus 🙏", { body: reminderMsg || "Hora da sua oração do dia!", icon: "/cross-crown.svg" });
        localStorage.setItem("prayerReminderDate", new Date().toDateString());
      }
    }, ms);
    return () => clearTimeout(t);
  }, [reminderEnabled, reminderTime, reminderMsg]);

  const showToast = (msg: string) => {
    setReminderToast(msg);
    setTimeout(() => setReminderToast(""), 3000);
  };

  const toggleReminder = async () => {
    if (!reminderEnabled) {
      if ("Notification" in window) {
        const result = await Notification.requestPermission();
        if (result !== "granted") {
          setReminderPermDenied(true);
          return;
        }
      }
      setReminderPermDenied(false);
      setReminderEnabled(true);
      showToast(`✓ Lembrete ativado para as ${reminderTime}`);
    } else {
      setReminderEnabled(false);
      showToast("Lembrete desativado");
    }
  };

  const verses = PRAYER_VERSES["Livre"];
  const [verseIdx] = useState(() => Math.floor(Math.random() * verses.length));
  const currentVerse = verses[verseIdx];

  const fetchPrayers = useCallback(async () => {
    try {
      const [res, groupRes] = await Promise.all([
        fetch("/api/prayers"),
        fetch("/api/prayers/group"),
      ]);
      if (res.ok) setPrayers(await res.json());
      else setError(true);
      if (groupRes.ok) setGroupPrayers(await groupRes.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrayers();
  }, [fetchPrayers]);

  const isRefreshing = usePullToRefresh(async () => {
    setLoading(true);
    setError(false);
    await fetchPrayers();
  });

  const handleAddPrayer = async (title: string, description?: string, isPublic?: boolean): Promise<boolean> => {
    try {
      const res = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isPublic }),
      });
      if (!res.ok) return false;
      const newPrayer = await res.json();
      setPrayers((prev) => [newPrayer, ...prev]);
      return true;
    } catch {
      return false;
    }
  };

  const handleMarkAnswered = async (id: string, testimony?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/prayers/${id}/answered`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testimony }),
      });
      if (!res.ok) return false;
      const updated = await res.json();
      setPrayers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "ANSWERED" as const, testimony: updated.testimony ?? undefined } : p))
      );
      return true;
    } catch {
      return false;
    }
  };

  const handlePrayedFor = (id: string) => {
    setPrayers((prev) => prev.map((p) => p.id === id ? { ...p, prayedCount: p.prayedCount + 1 } : p));
  };

  const handleDeletePrayer = (id: string) => {
    setPrayers((prev) => prev.filter((p) => p.id !== id));
  };

  const answered = prayers.filter((p) => p.status === "ANSWERED").length;
  const pending = prayers.filter((p) => p.status === "PENDING").length;
  const total = prayers.length;
  const totalPrayed = prayers.reduce((sum, p) => sum + p.prayedCount, 0);
  const answeredPct = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <>
      {/* Pull-to-refresh */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-0 right-0 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-white border border-amber-100 shadow-lg rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-semibold text-gold-dark">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Atualizando...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast de lembrete */}
      <AnimatePresence>
        {reminderToast && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg"
          >
            {reminderToast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-gradient-to-b from-divine-50 via-amber-50/30 to-white">
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-10 pb-32 md:pb-14 flex flex-col gap-8">

          {/* ── HEADER — Versículo de meditação ── */}
          <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-5xl block mb-7 select-none"
            >
              🙏
            </motion.span>
            <div className="border border-yellow-200/60 rounded-2xl px-6 py-5 shadow-sm bg-white/60 max-w-sm mx-auto">
              <blockquote className="font-serif text-xl sm:text-2xl md:text-[1.65rem] text-slate-700 italic leading-relaxed">
                &ldquo;{currentVerse.verse}&rdquo;
              </blockquote>
              <p className="mt-4 text-sm font-semibold tracking-wide text-gold-dark">
                — {currentVerse.ref}
              </p>
            </div>
          </motion.section>

          <div className="divine-divider" />

          {/* ── BLOCO 1: INICIAR ORAÇÃO ── */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="flex flex-col items-center gap-4"
          >
            {/* Botão principal */}
            <button
              onClick={() => setConfigOpen(true)}
              className="btn-divine py-5 px-14 text-lg flex items-center gap-3 rounded-2xl w-full sm:w-auto justify-center"
              style={{ boxShadow: "0 4px 28px rgba(212,175,55,0.38), 0 2px 10px rgba(0,0,0,0.08)" }}
              aria-label="Configurar e iniciar oração"
            >
              <Timer className="w-6 h-6" />
              Iniciar Oração
            </button>
          </motion.section>

          {/* ── GUIA DE ORAÇÕES CONSAGRADAS ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.10 }}
          >
            <ConsagradasSection isPremium={isPremium} />
          </motion.div>

          {/* ── BLOCO 2: LEMBRETE DE ORAÇÃO ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="divine-card p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {reminderEnabled
                  ? <Bell className="w-5 h-5 text-gold-dark" />
                  : <BellOff className="w-5 h-5 text-slate-400" />}
                <div>
                  <p className="text-sm font-semibold text-slate-700">Lembrete de Oração</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {reminderEnabled ? `Todos os dias às ${reminderTime}` : "Ative e não perca sua oração amanhã"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleReminder}
                className={`relative w-16 h-9 rounded-full transition-colors flex-shrink-0 ${reminderEnabled ? "bg-gold" : "bg-slate-200"}`}
                aria-label={reminderEnabled ? "Desativar lembrete" : "Ativar lembrete"}
              >
                <span className={`absolute top-1 w-7 h-7 rounded-full bg-white shadow transition-all ${reminderEnabled ? "left-8" : "left-1"}`} />
              </button>
            </div>
            {reminderPermDenied && (
              <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">
                ⚠️ Notificações bloqueadas. Ative nas configurações do seu navegador para receber lembretes.
              </p>
            )}
            {reminderEnabled && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-col gap-2">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-amber-100 bg-white text-base text-slate-700 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <input
                  type="text"
                  placeholder="Mensagem personalizada (ex: Tempo de orar, Senhor!)..."
                  value={reminderMsg}
                  onChange={(e) => setReminderMsg(e.target.value.slice(0, 100))}
                  className="w-full px-4 py-3 rounded-xl border border-divine-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </motion.div>
            )}
          </motion.div>

          {/* ── BLOCO 3: PEDIDOS DIANTE DE DEUS ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
          >
            {error ? (
              <div className="divine-card p-8 text-center text-slate-400">
                <p className="text-base">Não foi possível carregar os pedidos.</p>
                <button
                  onClick={() => { setLoading(true); setError(false); fetchPrayers(); }}
                  className="btn-divine py-3 px-6 mt-4 text-sm"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <PrayerList
                prayers={prayers}
                onAddPrayer={handleAddPrayer}
                onMarkAnswered={handleMarkAnswered}
                onPrayedFor={handlePrayedFor}
                onDeletePrayer={handleDeletePrayer}
                autoOpenForm={autoOpenForm}
                onFormOpened={() => setAutoOpenForm(false)}
                isLoading={loading}
                isPremium={isPremium}
                groupPrayers={groupPrayers}
              />
            )}
          </motion.div>

          <div className="divine-divider -my-1" />

          {/* ── ESTATÍSTICAS ── */}
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
                  { label: "Pedidos",     value: total,   icon: BookOpen,     sub: total === 0 ? "comece a orar" : "no total" },
                  { label: "Pendentes",   value: pending,  icon: Clock,        sub: pending > 0 ? "aguardando" : "em dia!" },
                  { label: "Respondidas", value: answered, icon: CheckCircle2, sub: answered > 0 ? `${answeredPct}% do total` : "ore e creia" },
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

          {/* ── BANNER DE RECURSOS PREMIUM — último elemento da página ── */}
          {!isPremium && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="divine-card border border-dashed border-gold/50 bg-divine-50/40 overflow-hidden"
            >
              <button
                onClick={() => setPremiumOpen((v) => !v)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-divine-50/60 transition-colors"
              >
                <div className="text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">✦ Recursos Premium</p>
                  <p className="text-sm font-serif text-slate-600 mt-0.5">Ore como os discípulos pediram</p>
                </div>
                {premiumOpen
                  ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>

              <AnimatePresence initial={false}>
                {premiumOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6">
                      <p className="text-xs text-slate-400 italic text-center mb-5">&ldquo;Senhor, ensina-nos a orar&rdquo; — Lc 11:1</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-white/70 border border-slate-200 p-4 flex flex-col gap-2.5">
                          <div className="mb-1">
                            <p className="text-sm font-bold text-slate-600">Grátis</p>
                            <p className="text-xs text-slate-400">Para começar sua jornada</p>
                          </div>
                          {[
                            { text: "Timer até 10 min",          sub: "Modo Livre" },
                            { text: "Diário ilimitado",          sub: "Pedidos sem limite" },
                            { text: "Lembretes personalizados",  sub: "Mensagem sua cada dia" },
                            { text: "Marcar respondidas",        sub: "Com seu testemunho" },
                            { text: "Pai Nosso completo",        sub: "Oração guiada em 7 etapas" },
                          ].map(({ text, sub }) => (
                            <div key={text} className="flex items-start gap-2">
                              <span className="text-slate-400 text-sm leading-tight mt-0.5">✓</span>
                              <div>
                                <p className="text-sm font-medium text-slate-600 leading-tight">{text}</p>
                                <p className="text-xs text-slate-400 leading-tight">{sub}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div
                          className="rounded-xl bg-amber-50/70 border border-gold/40 p-4 flex flex-col gap-2.5 relative overflow-hidden"
                          style={{ boxShadow: "inset 0 0 24px rgba(212,175,55,0.10), 0 2px 12px rgba(212,175,55,0.12)" }}
                        >
                          <div className="absolute inset-0 pointer-events-none rounded-xl"
                            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.15) 0%, transparent 70%)" }} />
                          <p className="relative text-sm font-bold text-gold-dark mb-1">Premium ✦</p>
                          {[
                            { text: "Modos guiados",               sub: "Adoração, Intercessão, Lectio" },
                            { text: "Timer ilimitado",             sub: "Digitar qualquer duração" },
                            { text: "Orações da fraternidade",     sub: "Ore com sua fraternidade" },
                            { text: "Música ambiente",             sub: "Foco total na presença de Deus" },
                            { text: "Versículos em voz alta",      sub: "A Palavra soando enquanto ora" },
                            { text: "Guia de Orações Consagradas", sub: "Ave Maria, Credo, São Francisco e mais" },
                          ].map(({ text, sub }) => (
                            <div key={text} className="relative flex items-start gap-2">
                              <span className="text-gold-dark text-sm leading-tight mt-0.5">✦</span>
                              <div>
                                <p className="text-sm font-medium text-amber-800 leading-tight">{text}</p>
                                <p className="text-xs text-amber-600/80 leading-tight">{sub}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Link href="/assinar">
                        <button className="btn-divine py-4 text-base w-full mt-5 flex items-center justify-center gap-2">
                          <span>✦</span> Orar como os discípulos pediram — Mt 6:9
                        </button>
                      </Link>
                      <p className="text-xs text-slate-400 text-center mt-2">R$ 9,90/mês · cancele quando quiser</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* FAB — adicionar pedido */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { if (!autoOpenForm) setAutoOpenForm(true); }}
          className="fixed right-5 bottom-24 sm:bottom-28 md:bottom-10 z-40 w-16 h-16 rounded-full btn-divine flex items-center justify-center"
          style={{ boxShadow: "0 4px 20px rgba(212,175,55,0.45), 0 2px 8px rgba(0,0,0,0.12)" }}
          aria-label="Adicionar pedido de oração"
        >
          <Plus className="w-7 h-7" />
        </motion.button>

        <PrayerConfigModal
          open={configOpen}
          onClose={() => setConfigOpen(false)}
          onStart={handleConfigStart}
          isPremium={isPremium}
        />
        <PrayerTimer
          open={timerOpen}
          onClose={() => setTimerOpen(false)}
          initialDuration={configMinutes * 60}
          autoStartMusic={configWithMusic}
        />
        {lordsPrayerOpen && <LordsPrayerGuide onClose={() => setLordsPrayerOpen(false)} />}
      </div>
    </>
  );
}
