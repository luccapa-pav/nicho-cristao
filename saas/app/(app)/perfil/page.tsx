"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { motion } from "framer-motion";
import {
  Camera, BookOpen, MapPin, Loader2, Check, User, FileText, Church, Heart,
  Lock, Eye, EyeOff, ChevronDown, Share2, Star, AlertCircle, LogOut,
} from "lucide-react";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { StreakCalendar } from "@/components/ui/StreakCalendar";
import { MonthlyReport } from "@/components/ui/MonthlyReport";
import { PaywallModal } from "@/components/ui/PaywallModal";
import { FavoritesModal } from "@/components/ui/FavoritesModal";
import { BADGE_DEFS } from "@/lib/badges";
import Image from "next/image";
import { signOut } from "next-auth/react";

interface ProfileData {
  id: string;
  name: string;
  email: string;
  emailVerified?: string | null;
  bio: string | null;
  church: string | null;
  city: string | null;
  verse: string | null;
  ministry: string | null;
  avatarUrl: string | null;
  plan: "FREE" | "PREMIUM" | "FAMILY";
  createdAt: string;
  streak: { currentStreak: number; longestStreak: number; totalDays: number } | null;
  _count: { prayers: number; gratitudePosts: number };
  isAdmin: boolean;
}

interface BadgeState {
  badgeId: string;
  earned: boolean;
}

function resizeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const SIZE = 200;
        canvas.width = SIZE;
        canvas.height = SIZE;
        const ctx = canvas.getContext("2d")!;
        const scale = Math.max(SIZE / img.width, SIZE / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [church, setChurch] = useState("");
  const [city, setCity] = useState("");
  const [verse, setVerse] = useState("");
  const [ministry, setMinistry] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showFavs, setShowFavs] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState("");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("");
  const [badges, setBadges] = useState<BadgeState[]>([]);
  const { premiumTheme, togglePremiumTheme } = useTheme();

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => {
        if (!r.ok) { setError("Usuário não encontrado"); return null; }
        return r.json();
      })
      .then((d: ProfileData | null) => {
        if (!d) return;
        setProfile(d);
        setName(d.name ?? "");
        setBio(d.bio ?? "");
        setChurch(d.church ?? "");
        setCity(d.city ?? "");
        setVerse(d.verse ?? "");
        setMinistry(d.ministry ?? "");
        setAvatarPreview(d.avatarUrl ?? null);
        setIsDirty(false);
      })
      .catch(() => { setError("Não foi possível carregar o perfil"); });
  }, []);

  useEffect(() => {
    fetch("/api/user/badges")
      .then((r) => r.json())
      .then((d) => setBadges(d.badges ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError("Imagem deve ter menos de 8MB"); return; }
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsDirty(true);
    try {
      const base64 = await resizeImageToBase64(file);
      setAvatarPreview(base64);
      setAvatarBase64(base64);
      setError("");
    } catch {
      setError("Não foi possível processar a imagem");
      setAvatarPreview(null);
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  }, []);

  const handleChangePassword = useCallback(async () => {
    if (!currentPassword || !newPassword) { setPwError("Preencha todos os campos"); return; }
    if (newPassword.length < 6) { setPwError("Nova senha deve ter pelo menos 6 caracteres"); return; }
    if (newPassword !== confirmPassword) { setPwError("As senhas não coincidem"); return; }
    setPwSaving(true);
    setPwError("");
    const res = await fetch("/api/user/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setPwSaving(false);
    if (!res.ok) { const d = await res.json(); setPwError(d.error ?? "Erro ao trocar senha"); return; }
    setPwSaved(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => { setPwSaved(false); setPwModalOpen(false); }, 2000);
  }, [currentPassword, newPassword, confirmPassword]);

  const handleShare = useCallback(() => {
    const streak = profile?.streak?.currentStreak ?? 0;
    const prayers = profile?._count.prayers ?? 0;
    const planLabel = profile?.plan === "FREE" ? "Gratuito" : profile?.plan === "PREMIUM" ? "Premium" : "Família";
    const text = `✝️ Minha jornada de fé no Vida com Jesus\n\n👤 ${name}\n🔥 ${streak} dias de sequência\n🙏 ${prayers} orações registradas\n✦ Plano ${planLabel}\n\nVenha caminhar comigo na fé! ${typeof window !== "undefined" ? window.location.origin : ""}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: `${name} — Vida com Jesus`, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text)
        .then(() => {
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2500);
        })
        .catch(() => {});
    }
  }, [profile, name]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) { setNameError("Nome é obrigatório"); return; }
    if (name.trim().length < 2) { setNameError("Nome deve ter pelo menos 2 caracteres"); return; }
    setNameError("");
    setSaved(false);
    setSaving(true);
    setError("");
    const body: Record<string, string | undefined> = { name, bio, church, city, verse, ministry };
    if (avatarBase64 !== undefined) body.avatarUrl = avatarBase64;
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        try { const d = await res.json(); setError(d.error ?? "Erro ao salvar"); }
        catch { setError("Erro ao salvar"); }
        return;
      }
      setSaved(true);
      setIsDirty(false);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }, [name, bio, church, city, verse, ministry, avatarBase64]);

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      {error ? (
        <>
          <p className="text-base text-red-500 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm text-gold-dark underline">Tentar novamente</button>
        </>
      ) : (
        <>
          <Loader2 className="w-10 h-10 text-gold animate-spin" />
          <p className="text-lg text-slate-500">Carregando seu perfil...</p>
        </>
      )}
    </div>
  );

  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const memberSince = new Date(profile.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const isPremium = profile.plan !== "FREE";

  const inputCls = "w-full px-5 py-3 rounded-2xl border-2 border-divine-200 bg-white text-lg text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold focus:bg-divine-50 transition-colors";
  const labelCls = "text-base font-semibold text-slate-700 mb-2 flex items-center gap-2";
  const settingRowCls = "w-full flex items-center gap-3 px-5 py-4 hover:bg-divine-50 transition-colors text-sm font-semibold text-slate-700 text-left";

  const openPaywall = (feature: string) => {
    setPaywallFeature(feature);
    setPaywallOpen(true);
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20 flex flex-col gap-6">

        {/* ── 1. HEADER — Identidade e Status ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="divine-card p-6 flex flex-col items-center gap-3"
        >
          <div
            className="relative group cursor-pointer"
            onClick={() => fileRef.current?.click()}
            role="button"
            aria-label="Trocar foto de perfil"
          >
            <div className={`w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center ${
              isPremium
                ? "ring-4 ring-yellow-500 shadow-[0_0_24px_rgba(234,179,8,0.45)]"
                : "ring-4 ring-white shadow-divine"
            }`}>
              {avatarPreview ? (
                <Image src={avatarPreview} alt="Foto de perfil" width={112} height={112} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-4xl font-bold font-serif">{initials}</span>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

          <div className="text-center">
            <h1 className="font-serif text-2xl font-bold text-slate-900">{name || "Meu Perfil"}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
          </div>

          {isPremium ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-1.5 rounded-full border border-yellow-400/60 bg-yellow-50 text-yellow-700">
              ✦ Membro {profile.plan === "FAMILY" ? "Família" : "Premium"}
            </span>
          ) : (
            <a
              href="/assinar"
              className="mt-1 w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-gold-dark text-white text-sm font-semibold hover:brightness-105 transition-all shadow-md"
            >
              ✝️ Eleve sua jornada. Conheça o plano Premium →
            </a>
          )}

          <p className="text-xs text-slate-400">Membro desde {memberSince}</p>
        </motion.div>

        {/* ── 2. EDITAR INFORMAÇÕES — Collapsible Form ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
          className="divine-card overflow-hidden"
        >
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 group"
          >
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-dark/60">Pessoal</p>
              <h2 className="font-serif text-xl font-bold text-slate-900 mt-0.5">Editar Informações</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 group-hover:text-gold-dark transition-all duration-200 ${formOpen ? "rotate-180" : ""}`} />
          </button>

          {formOpen && (
            <div className="border-t border-divine-100 px-6 pb-6 flex flex-col gap-5">
              {/* Nome */}
              <div className="pt-2">
                <label className={labelCls}><User className="w-4 h-4 text-gold-dark/60" /> Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value.slice(0, 80));
                    setIsDirty(true);
                    if (nameError) setNameError("");
                  }}
                  maxLength={80}
                  placeholder="Seu nome completo"
                  className={`${inputCls} ${nameError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                />
                {nameError && (
                  <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {nameError}
                  </p>
                )}
              </div>

              {/* Bio */}
              <div>
                <label className={labelCls}>
                  <FileText className="w-4 h-4 text-gold-dark/60" /> Sobre mim
                  <span className="text-slate-400 font-normal text-sm ml-1">({bio.length}/300)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => { setBio(e.target.value.slice(0, 300)); setIsDirty(true); }}
                  maxLength={300}
                  rows={4}
                  placeholder="Conte um pouco sobre sua caminhada com Deus..."
                  className={inputCls + " resize-none"}
                />
              </div>

              {/* Igreja e Cidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={labelCls}><Church className="w-4 h-4 text-gold-dark/60" /> Igreja</label>
                  <input
                    type="text"
                    value={church}
                    onChange={(e) => { setChurch(e.target.value.slice(0, 100)); setIsDirty(true); }}
                    placeholder="Nome da sua igreja"
                    maxLength={100}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}><MapPin className="w-4 h-4 text-slate-400" /> Cidade</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => { setCity(e.target.value.slice(0, 80)); setIsDirty(true); }}
                    placeholder="Sua cidade"
                    maxLength={80}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Versículo favorito */}
              <div>
                <label className={labelCls}>
                  <BookOpen className="w-4 h-4 text-gold-dark/60" /> Versículo favorito
                  <span className="text-slate-400 font-normal text-sm ml-1">({verse.length}/200)</span>
                </label>
                <textarea
                  value={verse}
                  onChange={(e) => { setVerse(e.target.value.slice(0, 200)); setIsDirty(true); }}
                  maxLength={200}
                  rows={3}
                  placeholder="Ex: Porque Deus amou o mundo de tal maneira... Jo 3:16"
                  className={inputCls + " resize-none"}
                />
              </div>

              {/* Ministério */}
              <div>
                <label className={labelCls}><Heart className="w-4 h-4 text-gold-dark/60" /> Ministério</label>
                <input
                  type="text"
                  value={ministry}
                  onChange={(e) => { setMinistry(e.target.value.slice(0, 100)); setIsDirty(true); }}
                  placeholder="Ex: Louvor, Intercessão, Diaconato..."
                  maxLength={100}
                  className={inputCls}
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-base text-red-600 font-medium">{error}</p>
                </div>
              )}

              {isDirty && !saving && !saved && (
                <p className="text-sm text-amber-600 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Alterações não salvas
                </p>
              )}

              <motion.button
                onClick={handleSave}
                disabled={saving || saved}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-3 transition-all ${
                  saved
                    ? "bg-divine-50 border-2 border-gold/50 text-gold-dark cursor-default"
                    : "btn-divine disabled:opacity-60"
                }`}
              >
                {saving ? (
                  <><Loader2 className="w-6 h-6 animate-spin" /> Salvando...</>
                ) : saved ? (
                  <><Check className="w-6 h-6 text-gold" /> Salvo!</>
                ) : (
                  "Salvar alterações"
                )}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* ── 3. ESTATÍSTICAS — O Custo Irrecuperável ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}
          className="divine-card p-5 flex flex-col gap-4"
        >
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark/60 text-center">Status da Jornada</p>

          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: "📖", value: profile.streak?.totalDays ?? 0,        label: "Devocionais\nLidos" },
              { emoji: "🔥", value: profile.streak?.longestStreak ?? 0,    label: "Maior\nOfensiva",       unit: "dias" },
              { emoji: "✅", value: profile._count.prayers,                 label: "Orações\nRespondidas" },
            ].map(({ emoji, value, label, unit }) => (
              <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-divine-50/60 text-center">
                <span className="text-xl leading-none">{emoji}</span>
                <p className="text-2xl font-bold text-slate-800 leading-none tabular-nums mt-1">
                  <AnimatedCounter value={value} />
                </p>
                {unit && <p className="text-[10px] text-slate-400 leading-none">{unit}</p>}
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5" style={{ whiteSpace: "pre-line" }}>{label}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => isPremium ? setReportOpen(true) : openPaywall("Relatório Mensal")}
            className="w-full py-2.5 rounded-xl border border-gold/30 text-gold-dark text-sm font-semibold hover:bg-divine-50 transition-colors flex items-center justify-center gap-2"
          >
            Ver Relatórios e Gráficos Detalhados 📊
            {!isPremium && <Lock className="w-3.5 h-3.5 opacity-60" />}
          </button>
        </motion.div>

        {/* ── 4. MINHA JORNADA — Streak Calendar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
          className="divine-card overflow-hidden"
        >
          <button
            onClick={() => setCalendarOpen((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 group"
          >
            <div className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-dark/60">Consistência</p>
              <h2 className="font-serif text-xl font-bold text-slate-900 mt-0.5">Minha Jornada</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 group-hover:text-gold-dark transition-all duration-200 ${calendarOpen ? "rotate-180" : ""}`} />
          </button>
          {calendarOpen && (
            <div className="border-t border-divine-100 px-3 pb-3">
              <StreakCalendar />
            </div>
          )}
        </motion.div>

        {/* ── 5. CONQUISTAS — Admin only (em desenvolvimento) ── */}
        {profile.isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
            className="divine-card p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-gold-dark/60">Sua caminhada</p>
                <h2 className="font-serif text-lg font-bold text-slate-800 mt-0.5">Minhas Conquistas</h2>
              </div>
              <span className="text-xs font-semibold text-gold-dark bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
                {badges.filter((b) => b.earned).length}/{BADGE_DEFS.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 -mt-1">Marcos da sua fidelidade com Deus</p>

            <div
              className="flex gap-3 overflow-x-auto pb-1"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
            >
              {BADGE_DEFS.map((def) => {
                const earned = badges.find((b) => b.badgeId === def.id)?.earned ?? false;
                return (
                  <div
                    key={def.id}
                    title={`${def.label}: ${def.description}`}
                    className={`flex-shrink-0 flex flex-col items-center gap-1.5 p-3 rounded-2xl border w-[76px] text-center transition-all ${
                      earned ? "border-gold/50 bg-amber-50/60" : "border-divine-100 bg-white"
                    }`}
                    style={!earned ? { filter: "grayscale(100%) opacity(0.5)" } : {}}
                  >
                    <span className="text-2xl leading-none">{def.icon}</span>
                    <p className="text-[10px] font-semibold leading-tight text-slate-600">{def.label}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── 6. CONFIGURAÇÕES ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }}
          className="divine-card divide-y divide-divine-100 overflow-hidden"
        >
          {/* 1. Email não verificado */}
          {!profile.emailVerified && (
            <button
              onClick={async (e) => {
                const btn = e.currentTarget;
                btn.disabled = true;
                btn.textContent = "Enviando...";
                const res = await fetch("/api/auth/resend-verification", { method: "POST" }).catch(() => null);
                if (res?.ok) {
                  btn.textContent = "✓ Email enviado!";
                } else {
                  btn.textContent = "Erro — tente novamente";
                  btn.disabled = false;
                }
              }}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-amber-50 transition-colors text-sm font-semibold text-amber-700 text-left"
            >
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              Email não verificado — clique para verificar
            </button>
          )}

          {/* 2. Compartilhar Jornada */}
          <button onClick={handleShare} className={settingRowCls}>
            <Share2 className="w-4 h-4 text-slate-500 flex-shrink-0" />
            {shareCopied ? "✓ Copiado para a área de transferência!" : "Compartilhar minha Jornada"}
          </button>

          {/* 3. Versículos Favoritos */}
          <button onClick={() => setShowFavs(true)} className={settingRowCls}>
            <Star className="w-4 h-4 text-gold flex-shrink-0 fill-gold" />
            Versículos Favoritos
          </button>

          {/* 4. Modo Offline — bait, free only */}
          {!isPremium && (
            <button onClick={() => openPaywall("Modo Offline")} className={settingRowCls}>
              <span className="text-base leading-none flex-shrink-0">📵</span>
              Modo Offline
              <Lock className="w-3.5 h-3.5 text-slate-400 ml-auto" />
            </button>
          )}

          {/* 5. Balanço de Fé */}
          <button onClick={() => isPremium ? setReportOpen(true) : openPaywall("Balanço de Fé")} className={settingRowCls}>
            <span className="text-base leading-none flex-shrink-0">📊</span>
            Balanço de Fé do Mês
            {!isPremium && <Lock className="w-3.5 h-3.5 text-slate-400 ml-auto" />}
          </button>

          {/* 6. Trocar Foto */}
          <button onClick={() => fileRef.current?.click()} className={settingRowCls}>
            <Camera className="w-4 h-4 text-slate-500 flex-shrink-0" />
            Trocar Foto de Perfil
          </button>

          {/* 7. Trocar Senha */}
          <button onClick={() => { setPwModalOpen(true); setPwError(""); setPwSaved(false); }} className={settingRowCls}>
            <Lock className="w-4 h-4 text-slate-500 flex-shrink-0" />
            Trocar Senha
          </button>

          {/* 8. Tema Dourado — premium only */}
          {isPremium && (
            <button onClick={togglePremiumTheme} className={settingRowCls}>
              <span className="text-base leading-none flex-shrink-0 text-gold-dark">✦</span>
              Tema Dourado
              <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full border ${
                premiumTheme ? "border-gold/40 bg-gold/10 text-gold-dark" : "border-slate-200 text-slate-400"
              }`}>
                {premiumTheme ? "Ativo" : "Inativo"}
              </span>
            </button>
          )}

          {/* 9. Sair da Conta */}
          <button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-red-50 transition-colors text-sm font-semibold text-red-500 text-left"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sair da Conta
          </button>
        </motion.div>

      </div>

      {/* ── Modal: Trocar Senha ── */}
      {pwModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setPwModalOpen(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="divine-card w-full max-w-md p-8 flex flex-col gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-divine-50 border border-divine-100 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-5 h-5 text-gold-dark" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-gold-dark/60 mb-1">Segurança</p>
              <h3 className="font-serif text-2xl font-bold text-slate-800">Trocar Senha</h3>
            </div>

            <div className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Senha atual"
                  className={inputCls + " pr-12"}
                  autoFocus
                />
                <button type="button" onClick={() => setShowCurrentPw((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showCurrentPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  className={inputCls + " pr-12"}
                />
                <button type="button" onClick={() => setShowNewPw((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirmar nova senha"
                className={inputCls}
              />
            </div>

            {pwError && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{pwError}</p>}
            {pwSaved && <p className="text-sm text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2 font-medium text-center">✓ Senha alterada com sucesso!</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setPwModalOpen(false)}
                className="flex-1 py-3.5 rounded-2xl border-2 border-divine-200 text-slate-500 font-semibold text-sm hover:bg-divine-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={pwSaving || pwSaved || !currentPassword || !newPassword || !confirmPassword}
                className="flex-1 py-3.5 rounded-2xl text-sm font-bold btn-divine disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {pwSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</> : "Alterar senha"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <MonthlyReport open={reportOpen} onClose={() => setReportOpen(false)} />
      {showFavs && <FavoritesModal onClose={() => setShowFavs(false)} />}
      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} feature={paywallFeature} />
    </>
  );
}
