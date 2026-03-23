"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Bell, Settings } from "lucide-react";

import { StreakCounter } from "@/components/ui/StreakCounter";
import { VerseCard } from "@/components/ui/VerseCard";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { CellGroup } from "@/components/ui/CellGroup";
import { PrayerList } from "@/components/ui/PrayerList";
import { GratitudeFeed } from "@/components/ui/GratitudeFeed";
import { SOSModal } from "@/components/ui/SOSModal";
import { InviteModal } from "@/components/ui/InviteModal";

// ─────────────────────────────────────────────────────────────
// DADOS MOCK — substituir por fetch de API/server components
// ─────────────────────────────────────────────────────────────
const MOCK_USER = {
  name: "Maria Silva",
  plan: "PREMIUM" as const,
};

const MOCK_STREAK = { current: 42, longest: 67 };

const MOCK_DEVOTIONAL = {
  title: "Andando pela Fé",
  verse: "Porque andamos por fé e não por vista.",
  verseRef: "2 Coríntios 5:7",
  theme: "Confiança",
  audioUrl: "",
  duration: 345,
  date: "Domingo, 22 de Março de 2026",
};

const MOCK_MEMBERS = [
  { id: "1", name: "João Pedro",  streakDays: 42, isOnline: true },
  { id: "2", name: "Ana Lima",    streakDays: 30, isOnline: true },
  { id: "3", name: "Carlos Melo", streakDays: 15, isOnline: false },
  { id: "4", name: "Beatriz S.",  streakDays: 7,  isOnline: true },
  { id: "5", name: "Rafael T.",   streakDays: 21, isOnline: false },
  { id: "6", name: "Fernanda C.", streakDays: 56, isOnline: true },
  { id: "7", name: "Lucas O.",    streakDays: 3,  isOnline: false },
  { id: "8", name: "Tatiana N.",  streakDays: 11, isOnline: true },
];

type PrayerStatus = "PENDING" | "ANSWERED";

interface Prayer {
  id: string;
  title: string;
  status: PrayerStatus;
  prayedCount: number;
  description?: string;
  createdAt: string;
}

const INITIAL_PRAYERS: Prayer[] = [
  { id: "p1", title: "Saúde do meu pai",     status: "PENDING",  prayedCount: 4,  description: "Precisa de cirurgia na próxima semana.", createdAt: "há 2 dias" },
  { id: "p2", title: "Novo emprego",          status: "PENDING",  prayedCount: 8,  createdAt: "há 5 dias" },
  { id: "p3", title: "Aprovação na faculdade",status: "ANSWERED", prayedCount: 12, createdAt: "há 10 dias" },
];

const INITIAL_POSTS = [
  {
    id: "g1",
    author: "João Pedro",
    content: "Glória a Deus! Consegui o emprego que tanto orei. Em 3 meses de orações, Deus respondeu perfeitamente!",
    reactions: { AMEN: 12, GLORY: 7 },
    userReacted: null as "AMEN" | "GLORY" | null,
    createdAt: "há 1 hora",
  },
  {
    id: "g2",
    author: "Ana Lima",
    content: "Minha mãe recebeu alta hoje do hospital. Foi uma batalha de 2 semanas. Obrigada pelas orações da célula!",
    reactions: { AMEN: 23, GLORY: 15 },
    userReacted: "AMEN" as "AMEN",
    createdAt: "há 3 horas",
  },
];

// ─────────────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
  }),
};

export default function DashboardPage() {
  const [prayers, setPrayers]       = useState<Prayer[]>(INITIAL_PRAYERS);
  const [posts, setPosts]           = useState(INITIAL_POSTS);
  const [sosOpen, setSosOpen]       = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [streak, setStreak]         = useState(MOCK_STREAK.current);
  const [completedToday, setCompletedToday] = useState(false);

  const handleCompleteDevotional = useCallback(() => {
    if (completedToday) return;
    setCompletedToday(true);
    setStreak((s) => s + 1);
  }, [completedToday]);

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Bom dia" : greetingHour < 18 ? "Boa tarde" : "Boa noite";

  const handleAddPrayer = useCallback((title: string, description?: string) => {
    setPrayers((prev) => [
      { id: `p${Date.now()}`, title, description, status: "PENDING" as PrayerStatus, prayedCount: 0, createdAt: "agora" },
      ...prev,
    ]);
  }, []);

  const handleMarkAnswered = useCallback((id: string) => {
    setPrayers((prev) =>
      prev.map((p): Prayer => p.id === id ? { ...p, status: "ANSWERED" } : p)
    );
  }, []);

  const handleReact = useCallback((_postId: string, _type: "AMEN" | "GLORY") => {
    // TODO: API call
  }, []);

  const handlePost = useCallback((content: string) => {
    setPosts((prev) => [
      {
        id: `g${Date.now()}`,
        author: MOCK_USER.name,
        content,
        reactions: { AMEN: 0, GLORY: 0 },
        userReacted: null,
        createdAt: "agora",
      },
      ...prev,
    ]);
  }, []);

  return (
    <>
      {/* Brilho dourado superior */}
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 h-48 z-0"
        style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(212,175,55,0.10) 0%, transparent 70%)" }}
      />

      <div className="min-h-screen relative z-10">
        <div className="max-w-5xl mx-auto px-8 md:px-16 py-14 md:py-20 space-y-20 md:space-y-28">

          {/* ── Header editorial ────────────────────────── */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={0}
            className="relative flex flex-col items-center text-center"
          >
            {/* Ações — canto direito absoluto */}
            <div className="absolute right-0 top-0 flex items-center gap-2">
              <button className="w-9 h-9 rounded-full bg-white border border-divine-200 flex items-center justify-center text-slate-400 hover:border-gold hover:text-gold transition-all shadow-sm">
                <Bell className="w-4 h-4" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white font-bold text-sm shadow-divine">
                {MOCK_USER.name[0]}
              </div>
            </div>

            {/* Data */}
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-dark mb-4">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
            </p>

            {/* Saudação */}
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
              {greeting},<br />
              <span className="text-gold-dark">{MOCK_USER.name.split(" ")[0]}.</span>
            </h1>

            {/* Subtítulo */}
            <p className="text-sm text-slate-400 mt-4 tracking-[0.06em] font-light max-w-xs">
              Que este seja mais um dia de glória para o Senhor.
            </p>
          </motion.div>

          {/* ── Divisor ──────────────────────────────────── */}
          <div className="divine-divider" />

          {/* ── SEÇÃO 01 ─────────────────────────────────── */}
          <div>
            <div className="flex flex-col items-center text-center mb-10 gap-1">
              <span className="text-[0.625rem] font-bold uppercase tracking-[0.35em] text-gold-dark/50">01</span>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight">
                Devocional do Dia
              </h2>
              <div className="w-8 h-px bg-gold/40 mt-1" />
            </div>
            {/* Linha 1 — Ofensiva + Cápsula de Áudio */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={1} className="lg:col-span-1 h-full">
                <StreakCounter days={streak} longestStreak={MOCK_STREAK.longest} onComplete={handleCompleteDevotional} completedToday={completedToday} />
              </motion.div>
              <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={2} className="lg:col-span-2 h-full">
                <AudioPlayer title={MOCK_DEVOTIONAL.title} duration={MOCK_DEVOTIONAL.duration} audioUrl={MOCK_DEVOTIONAL.audioUrl} date={MOCK_DEVOTIONAL.date} />
              </motion.div>
            </div>

            {/* Linha 2 — Versículo + Célula */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={3} className="lg:col-span-1">
                <VerseCard verse={MOCK_DEVOTIONAL.verse} reference={MOCK_DEVOTIONAL.verseRef} theme={MOCK_DEVOTIONAL.theme} />
              </motion.div>
              <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={4} className="lg:col-span-2">
                <CellGroup name="Célula Filhos da Luz" progress={68} members={MOCK_MEMBERS} onInvite={() => setInviteOpen(true)} onPray={() => {}} />
              </motion.div>
            </div>
          </div>

          {/* ── Divisor ─────────────────────────────────── */}
          <div className="divine-divider" />

          {/* ── SEÇÃO 02 ─────────────────────────────────── */}
          <div>
            <div className="flex flex-col items-center text-center mb-10 gap-1">
              <span className="text-[0.625rem] font-bold uppercase tracking-[0.35em] text-gold-dark/50">02</span>
              <h2 className="font-serif text-2xl md:text-3xl font-semibold text-slate-800 tracking-tight">
                Oração & Comunidade
              </h2>
              <div className="w-8 h-px bg-gold/40 mt-1" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={4}>
                <PrayerList prayers={prayers} onAddPrayer={handleAddPrayer} onMarkAnswered={handleMarkAnswered} />
              </motion.div>
              <motion.div variants={fadeInUp} initial="hidden" animate="visible" custom={5}>
                <GratitudeFeed posts={posts} onReact={handleReact} onPost={handlePost} />
              </motion.div>
            </div>
          </div>

          <div className="h-20" />
        </div>
      </div>

      {/* ── FAB SOS ─────────────────────────────────────── */}
      <motion.button
        onClick={() => setSosOpen(true)}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-20
                   w-14 h-14 rounded-full shadow-divine-lg
                   bg-gradient-to-br from-gold to-gold-dark text-white
                   flex items-center justify-center text-xl
                   hover:shadow-glow transition-shadow"
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={{
          y: [0, -4, 0],
          boxShadow: ["0 0 0px rgba(212,175,55,0.3)", "0 0 20px rgba(212,175,55,0.6)", "0 0 0px rgba(212,175,55,0.3)"],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        title="SOS Bíblico"
      >
        🆘
      </motion.button>

      {/* ── Modais ─────────────────────────────────────── */}
      <SOSModal open={sosOpen} onClose={() => setSosOpen(false)} />
      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        groupName="Célula Filhos da Luz"
        inviteToken="abc123xyz"
      />
    </>
  );
}
