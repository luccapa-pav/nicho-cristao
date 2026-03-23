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
import { GratitudeFeed } from "@/components/ui/GratitudeFeed";
import { SOSModal } from "@/components/ui/SOSModal";
import { InviteModal } from "@/components/ui/InviteModal";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import { NotificationPrompt } from "@/components/ui/NotificationPrompt";
import { PrayerTimer } from "@/components/ui/PrayerTimer";
import { DevotionalHistory } from "@/components/ui/DevotionalHistory";
import { QuickActionsBar } from "@/components/ui/QuickActionsBar";

type PrayerStatus = "PENDING" | "ANSWERED";

interface Prayer {
  id: string;
  title: string;
  status: PrayerStatus;
  prayedCount: number;
  description?: string;
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
  user: { name: string; plan: string } | null;
  streak: { currentStreak: number; longestStreak: number };
  devotional: {
    id: string;
    title: string;
    verse: string;
    verseRef: string;
    audioUrl: string;
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
  duration: 0,
  theme: "Confiança",
  completedToday: false,
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs / 24)} dias`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { isPremium } = usePlan();
  const [data, setData] = useState<DashboardData | null>(null);
  const [sosOpen, setSosOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [prayerFormOpen, setPrayerFormOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState("abc123xyz");
  const [completedToday, setCompletedToday] = useState(false);
  const [streak, setStreak] = useState(0);
  const [fetchError, setFetchError] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);
  const [timerOpen, setTimerOpen] = useState(false);
  const [gratitudeFormOpen, setGratitudeFormOpen] = useState(false);
  const [groupPrayers, setGroupPrayers] = useState<{ id: string; title: string; description?: string; status: string; prayedCount: number; createdAt: string; author: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch("/api/prayers/group").then((r) => r.ok ? r.json() : []),
    ])
      .then(([d, gp]: [DashboardData, typeof groupPrayers]) => {
        setData(d);
        setStreak(d.streak?.currentStreak ?? 0);
        setCompletedToday(d.devotional?.completedToday ?? false);
        setGroupPrayers(gp);
        if (!localStorage.getItem("notif")) setShowNotifPrompt(true);
      })
      .catch(() => setFetchError(true));
  }, []);

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
    await fetch("/api/streak/complete", { method: "POST" });
    await fetch("/api/devotional/today", { method: "POST" });
    if (Notification.permission === "granted") {
      new Notification("Parabéns! Ofensiva mantida 🔥", {
        body: "Mais um dia de crescimento espiritual. Continue assim!",
      });
    }
  }, [completedToday]);

  const handleAddPrayer = useCallback(async (title: string, description?: string, isPublic?: boolean) => {
    const res = await fetch("/api/prayers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, isPublic }),
    });
    if (!res.ok) return;
    const prayer = await res.json();
    setData((prev) => prev ? { ...prev, prayers: [{ ...prayer, createdAt: relativeTime(prayer.createdAt) }, ...prev.prayers] } : prev);
  }, []);

  const handleMarkAnswered = useCallback(async (id: string) => {
    await fetch(`/api/prayers/${id}/answered`, { method: "PATCH" });
    setData((prev) => prev ? {
      ...prev,
      prayers: prev.prayers.map((p): Prayer => p.id === id ? { ...p, status: "ANSWERED" } : p),
    } : prev);
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

  return (
    <>
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
            <span className="font-serif text-sm font-semibold text-slate-700">
              {greeting},{" "}
              <span className="text-gold-dark">{userName.split(" ")[0]}</span>
            </span>
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
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-6 space-y-10">

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
          </motion.div>

          <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0.5}>
            <QuickActionsBar
              onNovaMracao={() => setPrayerFormOpen(true)}
              onGratidao={() => setGratitudeFormOpen(true)}
              onCronometro={() => setTimerOpen(true)}
              onCompartilharVersiculo={() => {
                if (navigator.share) {
                  navigator.share({ text: `"${devotional.verse}" — ${devotional.verseRef}` }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(`"${devotional.verse}" — ${devotional.verseRef}`).catch(() => {});
                }
              }}
            />
          </motion.div>

          {/* Seção 01 */}
          <div>
            <div className="flex flex-col items-center text-center mb-4 gap-0.5">
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight">
                Devocional do Dia
              </h2>
              <div className="w-8 h-px bg-gold/40 mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={1} className="md:col-span-1 lg:col-span-1 h-full">
                <VerseCard verse={devotional.verse} reference={devotional.verseRef} theme={devotional.theme} />
              </motion.div>
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={2} className="md:col-span-1 lg:col-span-2 h-full">
                <AudioPlayer
                  title={devotional.title}
                  duration={devotional.duration}
                  audioUrl={devotional.audioUrl}
                  date={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                />
              </motion.div>
            </div>

            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} custom={3} className="mt-4">
              <DevotionalHistory />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={4} className="md:col-span-1 lg:col-span-1 h-full">
                <StreakCounter
                  days={streak}
                  longestStreak={data?.streak?.longestStreak ?? 0}
                  onComplete={handleCompleteDevotional}
                  completedToday={completedToday}
                />
              </motion.div>
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={5} className="md:col-span-1 lg:col-span-2 h-full">
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
                  <div className="divine-card p-8 flex flex-col items-center gap-5 text-center h-full justify-center min-h-[260px]">
                    <div className="w-16 h-16 rounded-2xl bg-divine-50 border-2 border-dashed border-divine-300 flex items-center justify-center">
                      <Users className="w-8 h-8 text-divine-400" />
                    </div>
                    <div>
                      <p className="font-serif text-xl font-bold text-slate-800">Você ainda não tem uma célula</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
                        Entre em uma célula pelo link de convite de um líder, ou crie a sua para caminhar junto com outros irmãos.
                      </p>
                    </div>
                    <a href="/celula" className="btn-divine py-3 text-sm px-8">
                      Criar minha célula
                    </a>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          <div className="divine-divider" />

          {/* Upsell banner — free only */}
          {!isPremium && (
            <motion.div
              variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} custom={4.5}
              className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-r from-amber-50 via-divine-50 to-amber-50 px-6 py-5 flex flex-col sm:flex-row items-center gap-4 shadow-sm"
            >
              {/* glow */}
              <div className="pointer-events-none absolute inset-0 opacity-30"
                style={{ background: "radial-gradient(ellipse at 60% 50%, rgba(212,175,55,0.25) 0%, transparent 70%)" }} />

              <div className="flex-1 text-center sm:text-left">
                <p className="font-serif text-lg font-bold text-slate-800 leading-tight">
                  Sua fé merece ir mais fundo.
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Oração guiada, planos de leitura bíblica, histórico espiritual completo — ferramentas para quem leva a fé a sério.
                </p>
                <p className="text-xs italic text-gold-dark mt-1.5">
                  "Buscai primeiro o Reino de Deus." — Mt 6:33
                </p>
              </div>

              <a
                href="/perfil"
                className="flex-shrink-0 btn-divine px-6 py-3 text-sm whitespace-nowrap"
              >
                ✦ Quero o Premium
              </a>
            </motion.div>
          )}

          {/* Seção 02 */}
          <div>
            <div className="flex flex-col items-center text-center mb-6 gap-0.5">
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-slate-800 tracking-tight">
                Oração & Comunidade
              </h2>
              <div className="w-8 h-px bg-gold/40 mt-1" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={5} className="h-full">
                <PrayerList prayers={prayers} onAddPrayer={handleAddPrayer} onMarkAnswered={handleMarkAnswered} autoOpenForm={prayerFormOpen} onFormOpened={() => setPrayerFormOpen(false)} groupPrayers={groupPrayers} />
              </motion.div>
              <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} custom={6} className="h-full">
                <GratitudeFeed posts={posts} onReact={handleReact} onPost={handlePost} autoOpenForm={gratitudeFormOpen} onFormOpened={() => setGratitudeFormOpen(false)} />
              </motion.div>
            </div>
          </div>

          <div className="h-6" />
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

      {showNotifPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowNotifPrompt(false)} />
          <div className="relative w-full max-w-sm">
            <NotificationPrompt onDismiss={() => setShowNotifPrompt(false)} />
          </div>
        </div>
      )}
      <SOSModal open={sosOpen} onClose={() => setSosOpen(false)} onRequestPrayer={() => setPrayerFormOpen(true)} />
      <PrayerTimer open={timerOpen} onClose={() => setTimerOpen(false)} />
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        groupName={data.group?.name ?? "Minha Célula"}
        inviteToken={inviteToken}
      />
    </>
  );
}
