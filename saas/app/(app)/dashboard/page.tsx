"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePlan } from "@/hooks/usePlan";

import { StreakCounter } from "@/components/ui/StreakCounter";
import { VerseCard } from "@/components/ui/VerseCard";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { CellGroup } from "@/components/ui/CellGroup";
import { PrayerList } from "@/components/ui/PrayerList";
import Link from "next/link";
import { GratitudeFeed } from "@/components/ui/GratitudeFeed";
import { SOSModal } from "@/components/ui/SOSModal";
import { InviteModal } from "@/components/ui/InviteModal";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import { NotificationPrompt } from "@/components/ui/NotificationPrompt";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

import { PrayerTimer } from "@/components/ui/PrayerTimer";
import { DevotionalHistory } from "@/components/ui/DevotionalHistory";
import { QuickActionsBar } from "@/components/ui/QuickActionsBar";
import { ShareModal } from "@/components/ui/ShareModal";
import { PaywallModal } from "@/components/ui/PaywallModal";
import { ChevronDown, Lock } from "lucide-react";

type PrayerStatus = "PENDING" | "ANSWERED";

interface Prayer {
  id: string;
  title: string;
  status: PrayerStatus;
  prayedCount: number;
  description?: string;
  testimony?: string;
  createdAt: string;
}

interface Post {
  id: string;
  author: string;
  content: string;
  reactions: { AMEN: number; GLORY: number };
  userReacted: "AMEN" | "GLORY" | null;
  createdAt: string;
}

interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  streakDays: number;
  isOnline: boolean;
}

interface DashboardData {
  user: { name: string; plan: string; emailVerified?: string | null } | null;
  streak: { currentStreak: number; longestStreak: number };
  devotional: {
    id: string;
    title: string;
    verse: string;
    verseRef: string;
    audioUrl: string;
    audioPreviewUrl: string;
    duration: number;
    theme: string;
    completedToday: boolean;
  } | null;
  group: { name: string; progress: number; members: Member[] } | null;
  prayers: Prayer[];
  posts: Post[];
}

const FALLBACK_DEVOTIONAL = {
  id: "",
  title: "Andando pela Fé",
  verse: "Porque andamos por fé e não por vista.",
  verseRef: "2 Coríntios 5:7",
  audioUrl: "",
  audioPreviewUrl: "",
  duration: 0,
  theme: "Confiança",
  completedToday: false,
};

function EmailVerificationBanner() {
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  async function resend() {
    setSending(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-3 text-sm">
      <span className="text-amber-600 font-medium flex-1">
        Confirme seu email para garantir acesso à sua conta.
      </span>
      {sent ? (
        <span className="text-green-600 text-xs font-medium">Email enviado!</span>
      ) : (
        <button onClick={resend} disabled={sending} className="text-gold-dark font-semibold hover:underline text-xs disabled:opacity-50">
          {sending ? "Enviando..." : "Reenviar email"}
        </button>
      )}
      <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-600 text-xs ml-1">✕</button>
    </div>
  );
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

function getUpsellMessage(streak: number, prayerCount: number) {
  if (streak >= 7)
    return {
      title: `🔥 ${streak} dias seguidos — não perca seu histórico`,
      sub: "Premium salva 365 dias de registros espirituais e avisa antes da sequência quebrar.",
    };
  if (prayerCount >= 3)
    return {
      title: `🙏 ${prayerCount} orações registradas — veja o padrão de Deus`,
      sub: "Premium gera relatório mensal com cada pedido e cada resposta de Deus.",
    };
  return {
    title: "Sua fé merece ir mais fundo",
    sub: "Oração guiada, planos de leitura e histórico espiritual completo.",
  };
}

function relativeTime(iso: string) {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)} dias`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { isPremium, isOnTrial, trialDaysLeft, hasUsedTrial } = usePlan();
  const [data, setData] = useState<DashboardData | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [prayerFormOpen, setPrayerFormOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState("");
  const [completedToday, setCompletedToday] = useState(false);
  const [streak, setStreak] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [gratitudeFormOpen, setGratitudeFormOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("");
  const [shareMode, setShareMode] = useState<"versiculo" | "convidar">("versiculo");
  const [groupPrayers, setGroupPrayers] = useState<{ id: string; title: string; description?: string; status: string; prayedCount: number; createdAt: string; author: string }[]>([]);
  const [memorizedCount, setMemorizedCount] = useState(0);
  const [activePlan, setActivePlan] = useState<{ name: string; slug: string; currentDay: number; daysTotal: number } | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      // Inicia todas as requisições em paralelo imediatamente
      const quickPromise = fetch("/api/dashboard?quick=1").then((r) => { if (!r.ok) throw new Error(); return r.json(); });
      const fullPromise = fetch("/api/dashboard").then((r) => { if (!r.ok) throw new Error(); return r.json(); });
      const gpPromise = fetch("/api/prayers/group").then((r) => r.ok ? r.json() : []);
      const versesPromise = fetch("/api/verses/memorized").then((r) => r.ok ? r.json() : []);
      const plansPromise = fetch("/api/reading/plans").then((r) => r.ok ? r.json() : []);

      // Mostra dados críticos assim que o quick responder (sem bloquear o resto)
      quickPromise.then((quick) => {
        setData((prev) => prev ? prev : {
          user: null,
          streak: quick.streak ?? { currentStreak: 0, longestStreak: 0 },
          devotional: quick.devotional ?? null,
          group: null,
          prayers: [],
          posts: [],
        });
        setStreak(quick.streak?.currentStreak ?? 0);
        setCompletedToday(quick.devotional?.completedToday ?? false);
      }).catch(() => {});

      // Aguarda o restante em paralelo
      const [d, gp, verses, plansData] = await Promise.all([fullPromise, gpPromise, versesPromise, plansPromise]);
      setData(d as DashboardData);
      setStreak((d as DashboardData).streak?.currentStreak ?? 0);
      setCompletedToday((d as DashboardData).devotional?.completedToday ?? false);
      setGroupPrayers(gp as typeof groupPrayers);
      setMemorizedCount(Array.isArray(verses) ? verses.length : 0);
      if (!localStorage.getItem("notif")) setShowNotifPrompt(true);
      // Find in-progress plan
      const plans: Array<{ name: string; slug: string; daysTotal: number; progress?: { currentDay: number } }> = Array.isArray(plansData) ? plansData : [];
      const inProgress = plans.find((p) => p.progress && p.progress.currentDay > 0 && p.progress.currentDay < p.daysTotal);
      if (inProgress && inProgress.progress) {
        setActivePlan({ name: inProgress.name, slug: inProgress.slug, currentDay: inProgress.progress.currentDay, daysTotal: inProgress.daysTotal });
      }
    } catch {
      setFetchError(true);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const isRefreshing = usePullToRefresh(async () => {
    setData(null);
    setFetchError(false);
    await fetchAll();
  });

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeaderVisible(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCompleteDevotional = useCallback(async () => {
    if (completedToday) return;
    setCompletedToday(true);
    setStreak((s) => s + 1);
    try {
      const [r1, r2] = await Promise.all([
        fetch("/api/streak/complete", { method: "POST" }),
        fetch("/api/devotional/today", { method: "POST" }),
      ]);
      if (!r1.ok || !r2.ok) throw new Error("fetch failed");
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        new Notification("Parabéns! Ofensiva mantida 🔥", {
          body: "Mais um dia de crescimento espiritual. Continue assim!",
        });
      }
    } catch {
      // Rollback optimistic update
      setCompletedToday(false);
      setStreak((s) => s - 1);
    }
  }, [completedToday]);

  const handleAddPrayer = useCallback(async (title: string, description?: string, isPublic?: boolean): Promise<boolean> => {
    const res = await fetch("/api/prayers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, isPublic }),
    });
    if (!res.ok) return false;
    const prayer = await res.json();
    setData((prev) => prev ? { ...prev, prayers: [{ ...prayer, createdAt: relativeTime(prayer.createdAt) }, ...prev.prayers] } : prev);
    return true;
  }, []);

  const handleMarkAnswered = useCallback(async (id: string, testimony?: string): Promise<boolean> => {
    const res = await fetch(`/api/prayers/${id}/answered`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testimony }),
    });
    if (!res.ok) return false;
    setData((prev) => prev ? {
      ...prev,
      prayers: prev.prayers.map((p): Prayer => p.id === id ? { ...p, status: "ANSWERED", testimony } : p),
    } : prev);
    return true;
  }, []);

  const handleReact = useCallback(async (postId: string, type: "AMEN" | "GLORY") => {
    const res = await fetch(`/api/gratitude/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (!res.ok) return;
    const { userReacted } = await res.json();
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map((p) => {
          if (p.id !== postId) return p;
          const prev_reaction = p.userReacted;
          const reactions = { ...p.reactions };
          if (prev_reaction) reactions[prev_reaction] = Math.max(0, reactions[prev_reaction] - 1);
          if (userReacted) reactions[userReacted as "AMEN" | "GLORY"] += 1;
          return { ...p, reactions, userReacted };
        }),
      };
    });
  }, []);

  const handlePost = useCallback(async (content: string) => {
    const res = await fetch("/api/gratitude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) return;
    const post = await res.json();
    setData((prev) => prev ? { ...prev, posts: [post, ...prev.posts] } : prev);
  }, []);

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? "Bom dia" : greetingHour < 18 ? "Boa tarde" : "Boa noite";
  const upsellMsg = getUpsellMessage(streak, data?.prayers?.length ?? 0);
  const userName = data?.user?.name ?? session?.user?.name ?? "Amigo";
  const devotional = data?.devotional ?? FALLBACK_DEVOTIONAL;

  const prayers = (data?.prayers ?? []).map((p) => ({
    ...p,
    createdAt: typeof p.createdAt === "string" && p.createdAt.includes("T")
      ? relativeTime(p.createdAt) : p.createdAt,
  }));

  const posts = (data?.posts ?? []).map((p) => ({
    ...p,
    createdAt: typeof p.createdAt === "string" && p.createdAt.includes("T")
      ? relativeTime(p.createdAt) : p.createdAt,
  }));

  if (fetchError) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
      <p className="text-4xl">🙏</p>
      <p className="font-serif text-xl text-slate-700">Não foi possível carregar</p>
      <p className="text-sm text-slate-400">Verifique sua conexão e tente novamente.</p>
      <button onClick={() => { setFetchError(false); setData(null); window.location.reload(); }} className="btn-divine py-4 px-8 text-base">
        Tentar novamente
      </button>
    </div>
  );

  if (data === null) return <DashboardSkeleton />;

  const emailUnverified = data.user && !data.user.emailVerified;

  return (
    <>
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-14 left-0 right-0 z-50 flex justify-center pointer-events-none"
          >
            <div className="bg-white border border-amber-100 shadow-divine rounded-full px-4 py-1.5 flex items-center gap-2 text-xs font-semibold text-gold-dark">
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Atualizando...
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email verification banner */}
      {emailUnverified && (
        <EmailVerificationBanner />
      )}
      {/* Sticky mini header — desktop only, aparece ao rolar o greeting */}
      <AnimatePresence>
        {!headerVisible && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="hidden md:flex fixed top-0 z-50 items-center justify-between px-8 h-12 border-b border-amber-100/60 backdrop-blur-md"
            style={{ left: "256px", right: 0, backgroundColor: "rgba(255,254,249,0.92)" }}
          >
            <div className="flex items-center gap-3">
              <span className="font-serif text-sm font-semibold text-slate-700">
                {greeting},{" "}
                <span className="text-gold-dark">{userName.split(" ")[0]}</span>
              </span>
              {streak > 0 && (
                <span className="streak-badge text-xs">🔥 {streak}</span>
              )}
            </div>
            <span className="text-xs text-slate-400 tracking-[0.06em]">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="pointer-events-none fixed top-0 left-0 right-0 h-48 z-0"
        style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(212,175,55,0.10) 0%, transparent 70%)" }}
      />

      <div className="min-h-full relative z-10">
        <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-10">

          {/* Header */}
          <motion.div ref={headerRef} variants={fadeInUp} initial="hidden" animate="visible" custom={0}
            className="relative flex flex-col items-center text-center divine-card px-8 py-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark mb-4">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>

            <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              {greeting},<br className="md:hidden" />
              {" "}<span className="text-gold-dark">{userName.split(" ")[0]}.</span>
            </h1>

            <p className="text-sm text-slate-400 mt-2 tracking-[0.06em] font-light max-w-xs">
              Que este seja mais um dia de glória para o Senhor.
            </p>
            {streak > 0 && (
              <div className="flex items-center justify-center mt-3">
                <span className="streak-badge text-sm">🔥 {streak} {streak === 1 ? "dia" : "dias"}</span>
              </div>
            )}
          </motion.div>

          {/* ── Devocional do Dia ──────────────────────────────── */}
          <div>
            <div className="flex flex-col items-center text-center mb-6 gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold-dark/70">Sua jornada espiritual</p>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-slate-800 tracking-tight">
                Devocional do Dia
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold/50" />
                <span className="text-gold text-base select-none">✦</span>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold/50" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={3} className="md:col-span-1 lg:col-span-1 h-full">
                <VerseCard verse={devotional.verse} reference={devotional.verseRef} theme={devotional.theme} />
              </motion.div>
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={4} className="md:col-span-1 lg:col-span-2 h-full relative">
                <AudioPlayer
                  title={devotional.title}
                  duration={devotional.duration}
                  audioUrl={devotional.audioUrl}
                  audioPreviewUrl={devotional.audioPreviewUrl}
                  date={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  isPremium={isPremium || isOnTrial}
                  onUnlock={() => { setPaywallFeature("Devocional Narrado"); setPaywallOpen(true); }}
                />
              </motion.div>
            </div>

            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={5} className="mt-6">
              <div className="divine-card p-6 flex flex-col items-center gap-4 text-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                  <span className="text-3xl">🙏</span>
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-800">Orar Agora</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">Separe um momento com Deus em silêncio e oração</p>
                </div>
                <div className="flex gap-3 w-full max-w-sm">
                  <Link href="/oracao" className="flex-1">
                    <button className="btn-divine w-full py-3.5 text-sm">🙏 Ir para Oração</button>
                  </Link>
                  <button onClick={() => setPrayerFormOpen(true)} className="btn-ghost-divine flex-1 text-sm">
                    + Novo pedido
                  </button>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Trial countdown banner */}
          {isOnTrial && (
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0.2}
              className="divine-card p-4 border-gold/40 bg-amber-50/60 flex items-center gap-3"
            >
              <span className="text-2xl flex-shrink-0">✨</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gold-dark">
                  Premium ativo — {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"} no trial
                </p>
                <p className="text-xs text-slate-500">Aproveite todos os recursos antes que expire.</p>
              </div>
              <Link href="/assinar" className="text-xs font-bold text-gold-dark hover:underline whitespace-nowrap flex-shrink-0">
                Assinar →
              </Link>
            </motion.div>
          )}

          {showNotifPrompt && (
            <NotificationPrompt onDismiss={() => setShowNotifPrompt(false)} />
          )}

          <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0.4}>
            <QuickActionsBar
              onJaOrei={handleCompleteDevotional}
              completedToday={completedToday}
              onNovaOracao={() => setPrayerFormOpen(true)}
              onGratidao={() => { window.location.href = "/fraternidade"; }}
              onCronometro={() => setTimerOpen(true)}
              onCompartilharVersiculo={() => {
                setShareMode("versiculo");
                setShareOpen(true);
              }}
              onConvidar={() => {
                setShareMode("convidar");
                setShareOpen(true);
              }}
            />
          </motion.div>

          {/* ── Ofensiva + Pedidos (side-by-side) ─────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
            {/* Esquerda: Ofensiva */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0.5} className="h-full">
              <StreakCounter
                days={streak}
                longestStreak={data?.streak?.longestStreak ?? 0}
                onComplete={handleCompleteDevotional}
                completedToday={completedToday}
              />
            </motion.div>

            {/* Direita: Pedidos diante de Deus */}
            <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0.6} className="h-full">
              <PrayerList
                prayers={prayers}
                onAddPrayer={handleAddPrayer}
                onMarkAnswered={handleMarkAnswered}
                autoOpenForm={prayerFormOpen}
                onFormOpened={() => setPrayerFormOpen(false)}
                groupPrayers={groupPrayers}
                isPremium={isPremium}
              />
            </motion.div>
          </div>

          {/* ════════ Cards inferiores — max-w-3xl ════════ */}
          <div className="max-w-3xl mx-auto w-full space-y-10">

          {/* ── Comunidade ─────────────────────────────────────── */}
          <div>
            <div className="flex flex-col items-center text-center mb-4 gap-0.5">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight">
                Comunidade
              </h2>
              <div className="w-8 h-px bg-gold/40 mt-1" />
            </div>
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={6}>
              {data.group ? (
                <CellGroup
                  name={data.group.name}
                  progress={data.group.progress}
                  members={data.group.members}
                  onInvite={async () => {
                    const res = await fetch("/api/groups/invite", { method: "POST" });
                    if (res.ok) {
                      const { token } = await res.json();
                      setInviteToken(token);
                    }
                    setInviteOpen(true);
                  }}
                  onPray={() => {}}
                />
              ) : (
                <div className="relative overflow-hidden rounded-2xl border border-gold/25 p-8 flex flex-col items-center gap-5 text-center justify-center min-h-[220px] fraternity-empty-card"
                  style={{
                    boxShadow: "0 4px 32px rgba(212,175,55,0.13), 0 1px 6px rgba(212,175,55,0.07)",
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none opacity-50"
                    style={{ backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><g fill='none' stroke='%23D4AF37' stroke-width='0.6' opacity='0.35'><circle cx='10' cy='10' r='3'/><circle cx='50' cy='10' r='3'/><circle cx='30' cy='30' r='3'/><circle cx='10' cy='50' r='3'/><circle cx='50' cy='50' r='3'/><line x1='10' y1='10' x2='30' y2='30'/><line x1='50' y1='10' x2='30' y2='30'/><line x1='10' y1='50' x2='30' y2='30'/><line x1='50' y1='50' x2='30' y2='30'/></g></svg>`)}")`, backgroundSize: "60px 60px" }}
                  />
                  <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_2px_14px_rgba(212,175,55,0.4)]"
                    style={{ background: "linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #B8962E 100%)" }}
                  >
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div className="relative">
                    <p className="font-serif text-xl font-bold text-slate-800">Descubra sua Fraternidade</p>
                    <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                      Entre em uma fraternidade e participe da comunidade de gratidão e oração.
                    </p>
                  </div>
                  <a href="/fraternidade" className="relative btn-divine py-3 text-sm px-8">
                    Explorar Fraternidades →
                  </a>
                </div>
              )}
            </motion.div>
          </div>

          {/* ── Memorização ── */}
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={8}>
            <div className="divine-card p-4 flex items-center gap-4">
              <span className="text-3xl flex-shrink-0">📖</span>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">Memorização</p>
                {memorizedCount > 0
                  ? <p className="text-sm text-slate-600 mt-0.5">{memorizedCount} {memorizedCount === 1 ? "versículo memorizado" : "versículos memorizados"}</p>
                  : <p className="text-sm text-slate-400 mt-0.5">Comece a memorizar versículos hoje</p>
                }
              </div>
              <Link href={`/versiculo?verse=${encodeURIComponent(devotional.verse)}&ref=${encodeURIComponent(devotional.verseRef)}`} className="ml-auto flex-shrink-0">
                <span className="text-xs font-semibold text-gold-dark bg-divine-50 px-3 py-2 rounded-lg border border-divine-200 hover:bg-divine-100 transition-colors whitespace-nowrap">
                  {memorizedCount > 0 ? "Praticar →" : "Começar →"}
                </span>
              </Link>
            </div>
          </motion.div>

          {/* ── Continue lendo ── */}
          {activePlan && (
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={8.5}>
              <Link href={`/plano-leitura/${activePlan.slug}`}>
                <div className="divine-card p-4 flex items-center gap-4 hover:border-gold/40 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">📖</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">Continue lendo</p>
                    <p className="text-sm font-semibold text-slate-700 truncate mt-0.5">{activePlan.name}</p>
                    <p className="text-xs text-slate-400">Dia {activePlan.currentDay} de {activePlan.daysTotal}</p>
                    <div className="mt-1.5 h-1 bg-divine-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all"
                        style={{ width: `${Math.round((activePlan.currentDay / activePlan.daysTotal) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90 group-hover:text-gold-dark transition-colors flex-shrink-0" />
                </div>
              </Link>
            </motion.div>
          )}

          {/* ── Histórico ─────────────────────────────────────── */}
          <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} custom={10}>
            <DevotionalHistory />
          </motion.div>

          {/* ── Upsell contextual (último elemento) ── */}
          {!isPremium && !isOnTrial && (
            <motion.div
              variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={11}
              className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-r from-amber-50 via-divine-50 to-amber-50 px-5 py-4 flex flex-col sm:flex-row items-center gap-4"
            >
              <div className="pointer-events-none absolute inset-0 opacity-30"
                style={{ background: "radial-gradient(ellipse at 60% 50%, rgba(212,175,55,0.25) 0%, transparent 70%)" }} />
              <div className="flex-1 text-center sm:text-left relative z-10">
                <p className="font-serif text-base font-bold text-slate-800">{upsellMsg.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{upsellMsg.sub}</p>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  <div className="flex -space-x-1.5">
                    {["A","M","J","P","R"].map((l) => (
                      <div key={l} className="w-5 h-5 rounded-full bg-gold/20 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gold-dark">{l}</div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">+1.200 irmãos crescendo com Premium</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0 w-full sm:w-auto relative z-10">
                <a href="/assinar" className="btn-divine px-5 py-2.5 text-sm whitespace-nowrap text-center block">
                  ✦ Crescer na fé
                </a>
                {!hasUsedTrial && (
                  <p className="text-[10px] text-center text-gold-dark/70">ou testar 7 dias grátis →</p>
                )}
              </div>
            </motion.div>
          )}

          </div>{/* fim max-w-3xl */}

          <div className="h-16" />
        </div>
      </div>

      <motion.button
        onClick={() => setSosOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-20
                   h-14 px-5 rounded-full shadow-divine-lg
                   bg-gradient-to-br from-gold to-gold-dark text-white
                   flex items-center justify-center text-sm font-bold
                   hover:shadow-glow transition-shadow"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{
          y: [0, -4, 0],
          boxShadow: ["0 0 0px rgba(212,175,55,0.3)", "0 0 20px rgba(212,175,55,0.6)", "0 0 0px rgba(212,175,55,0.3)"],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        aria-label="SOS Bíblico"
        title="SOS Bíblico"
      >
        🙏 SOS
      </motion.button>

      
      <SOSModal open={sosOpen} onClose={() => setSosOpen(false)} onRequestPrayer={() => setPrayerFormOpen(true)} />
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} feature={paywallFeature} />
      <PrayerTimer open={timerOpen} onClose={() => setTimerOpen(false)} />
      <ShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        text={
          shareMode === "versiculo"
            ? `"${devotional.verse}" — ${devotional.verseRef}\n\nVia Vida com Jesus`
            : `Oi! Estou usando o *Vida com Jesus*, um app cristão de devocional diário, oração e comunidade. Venha caminhar comigo na fé! 🙏✝️`
        }
        url={shareMode === "convidar" ? (typeof window !== "undefined" ? window.location.origin : "") : ""}
        title={shareMode === "versiculo" ? "Compartilhar Versículo" : "Convidar Amigos"}
      />
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        groupName={data.group?.name ?? "Minha Fraternidade"}
        inviteToken={inviteToken}
      />
    </>
  );
}
