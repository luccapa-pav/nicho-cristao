"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { motion } from "framer-motion";
import { Camera, Flame, CheckCircle2, BookOpen, MapPin, Loader2, Check, User, FileText, Church, Heart, UserPlus } from "lucide-react";
import { BadgeDisplay } from "@/components/ui/BadgeDisplay";
import { StreakCalendar } from "@/components/ui/StreakCalendar";
import { MonthlyReport } from "@/components/ui/MonthlyReport";
import Image from "next/image";

interface ProfileData {
  id: string;
  name: string;
  email: string;
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
  const [reportOpen, setReportOpen] = useState(false);
  const { premiumTheme, togglePremiumTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d: ProfileData) => {
        setProfile(d);
        setName(d.name ?? "");
        setBio(d.bio ?? "");
        setChurch(d.church ?? "");
        setCity(d.city ?? "");
        setVerse(d.verse ?? "");
        setMinistry(d.ministry ?? "");
        setAvatarPreview(d.avatarUrl ?? null);
      })
      .catch(console.error);
  }, []);

  const handleAvatarChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { setError("Imagem deve ter menos de 8MB"); return; }
    try {
      const base64 = await resizeImageToBase64(file);
      setAvatarPreview(base64);
      setAvatarBase64(base64);
      setError("");
    } catch {
      setError("Não foi possível processar a imagem");
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) { setError("Nome é obrigatório"); return; }
    setSaving(true);
    setError("");
    const body: Record<string, string | undefined> = { name, bio, church, city, verse, ministry };
    if (avatarBase64 !== undefined) body.avatarUrl = avatarBase64;
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Erro ao salvar"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, [name, bio, church, city, verse, ministry, avatarBase64]);

  const profileFields = [
    { key: "name",      filled: typeof name !== "undefined" && name.trim().length > 0 },
    { key: "bio",       filled: typeof bio !== "undefined" && bio.trim().length > 0 },
    { key: "church",    filled: typeof church !== "undefined" && church.trim().length > 0 },
    { key: "city",      filled: typeof city !== "undefined" && city.trim().length > 0 },
    { key: "verse",     filled: typeof verse !== "undefined" && verse.trim().length > 0 },
    { key: "ministry",  filled: typeof ministry !== "undefined" && ministry.trim().length > 0 },
    { key: "avatarUrl", filled: !!avatarPreview },
  ];
  const completionPercent = Math.round(profileFields.filter((f) => f.filled).length / profileFields.length * 100);
  const FIELD_LABELS: Record<string, string> = {
    name: "nome", bio: "sobre mim", church: "igreja",
    city: "cidade", verse: "versículo", ministry: "ministério", avatarUrl: "foto",
  };

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-10 h-10 text-gold animate-spin" />
      <p className="text-lg text-slate-500">Carregando seu perfil...</p>
    </div>
  );

  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const memberSince = new Date(profile.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const inputCls = "w-full px-5 py-4 rounded-2xl border-2 border-divine-200 bg-white text-lg text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold focus:bg-divine-50 transition-colors";
  const labelCls = "text-base font-semibold text-slate-700 mb-2 flex items-center gap-2";

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Título ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-8 text-center"
      >
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-1">Meu Perfil</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          {name || "Sua jornada de fé"}
        </h1>
        <div className="flex items-center justify-center gap-2 mt-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
            profile.plan === "FREE"
              ? "text-slate-500 bg-slate-50 border-slate-200"
              : "text-gold-dark bg-gold/10 border-gold/30"
          }`}>
            {profile.plan === "FREE" ? "Gratuito" : profile.plan === "PREMIUM" ? "✦ Premium" : "✦ Família"}
          </span>
          <span className="text-sm text-slate-400">· Membro desde {memberSince}</span>
        </div>
      </motion.div>

      {/* ── Profile Completion Bar ── */}
      <div className="divine-card p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">
            Perfil {completionPercent}% completo
          </p>
          {completionPercent === 100 && (
            <span className="text-xs font-bold text-gold-dark">✦ Perfil completo!</span>
          )}
        </div>
        <div className="h-2.5 rounded-full bg-divine-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        {completionPercent < 100 && (
          <p className="text-xs text-slate-400 mt-2">
            Complete: {profileFields.filter((f) => !f.filled).map((f) => FIELD_LABELS[f.key]).join(", ")}
          </p>
        )}
      </div>

      {/* ── Layout 2 colunas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">

          {/* Avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="divine-card p-6 flex flex-col items-center gap-4"
          >
            <div
              className="relative group cursor-pointer"
              onClick={() => fileRef.current?.click()}
              role="button"
              aria-label="Trocar foto de perfil"
            >
              <div className="w-40 h-40 rounded-full ring-4 ring-white shadow-divine overflow-hidden bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Foto de perfil" width={160} height={160} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-5xl font-bold font-serif">{initials}</span>
                )}
              </div>
              {/* Overlay hover */}
              <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-10 h-10 text-white" />
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            {/* Nome e email acima do botão */}
            <div className="text-center">
              <p className="text-xl font-serif font-bold text-slate-800">{name || "Sem nome"}</p>
              <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
            </div>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-3.5 rounded-xl border-2 border-gold/40 text-gold-dark font-semibold text-base hover:bg-divine-50 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Trocar foto
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="divine-card p-5"
          >
            <h3 className="font-serif text-base font-bold text-slate-700 text-center mb-4">Minha jornada</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: Flame,        label: "Ofensiva",   value: profile.streak?.currentStreak ?? 0, unit: "dias" },
                { icon: CheckCircle2, label: "Completados", value: profile.streak?.totalDays ?? 0,     unit: "dias" },
                { icon: BookOpen,     label: "Orações",    value: profile._count.prayers,             unit: "" },
              ].map(({ icon: Icon, label, value, unit }) => (
                <div key={label} className="flex flex-col items-center gap-1 p-3 rounded-xl bg-divine-50/60 text-center">
                  <Icon className="w-4 h-4 text-gold mb-0.5" />
                  <p className="text-2xl font-bold text-slate-800 leading-none tabular-nums">{value}</p>
                  <p className="text-[11px] text-slate-500 leading-tight">{unit || label}</p>
                  {unit && <p className="text-[10px] text-slate-400 leading-none">{label}</p>}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Plano */}
          <motion.div
            id="plano"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="divine-card p-6 flex flex-col gap-3"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark text-center">Plano atual</p>
            <div className="flex items-center justify-between">
              <p className="font-serif text-2xl font-bold text-slate-800">
                {profile.plan === "FREE" ? "Gratuito" : profile.plan === "PREMIUM" ? "Premium" : "Família"}
              </p>
              {profile.plan !== "FREE" && (
                <span className="text-sm font-bold text-gold-dark px-3 py-1 rounded-full bg-gold/10 border border-gold/30">
                  ✦ Ativo
                </span>
              )}
            </div>
            {profile.plan === "FREE" && (
              <>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Sua jornada com Deus merece mais profundidade.<br />
                  <span className="italic text-slate-400 text-xs">&ldquo;Buscai primeiro o Reino de Deus&rdquo; — Mt 6:33</span>
                </p>
                <button className="btn-divine w-full py-3 text-sm">
                  ✦ Crescer na graça — "Buscai primeiro o Reino" Mt 6:33
                </button>
              </>
            )}
            <button
              onClick={() => setReportOpen(true)}
              className="w-full mt-2 py-2.5 rounded-xl border border-gold/30 text-gold-dark font-semibold text-sm hover:bg-divine-50 transition-colors"
            >
              📊 Ver Relatório do Mês
            </button>
            {profile?.plan && profile.plan !== "FREE" && (
              <button
                onClick={togglePremiumTheme}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all border mt-2 ${
                  premiumTheme
                    ? "border-gold bg-gold/15 text-gold-dark"
                    : "border-gold/30 text-gold-dark hover:bg-divine-50"
                }`}
              >
                {premiumTheme ? "✦ Tema Dourado ativo — desativar" : "Ativar Tema Dourado ✦"}
              </button>
            )}
          </motion.div>

          {/* Convidar Amigos */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="divine-card p-5 flex flex-col gap-3"
          >
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark text-center">Convidar Amigos</p>
            <p className="text-sm text-slate-500 text-center leading-relaxed">
              Chame alguém para caminhar com Deus ao seu lado.
            </p>
            <button
              onClick={() => {
                const msg = encodeURIComponent(
                  `Oi! Estou usando o *Luz Divina*, um app cristão de devocional diário, oração e comunidade. Venha caminhar comigo na fé! 🙏✝️\n${window.location.origin}`
                );
                window.open(`https://wa.me/?text=${msg}`, "_blank");
              }}
              className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#1ebe59] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Convidar pelo WhatsApp
            </button>
          </motion.div>

        </div>

        {/* ── COLUNA DIREITA — Formulário ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="divine-card p-8 md:p-10 flex flex-col gap-8"
        >
          <h2 className="font-serif text-3xl font-bold text-slate-800 text-center">Informações pessoais</h2>

          {/* Nome */}
          <div>
            <label className={labelCls}><User className="w-4 h-4 text-gold-dark/60" /> Nome completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 80))}
              maxLength={80}
              placeholder="Seu nome completo"
              className={inputCls}
            />
          </div>

          {/* Bio */}
          <div>
            <label className={labelCls}>
              <FileText className="w-4 h-4 text-gold-dark/60" /> Sobre mim
              <span className="text-slate-400 font-normal text-sm ml-1">({bio.length}/300)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 300))}
              maxLength={300}
              rows={4}
              placeholder="Conte um pouco sobre sua caminhada com Deus..."
              className={inputCls + " resize-none"}
            />
          </div>

          {/* Igreja e Cidade — lado a lado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelCls}><Church className="w-4 h-4 text-gold-dark/60" /> Igreja</label>
              <input
                type="text"
                value={church}
                onChange={(e) => setChurch(e.target.value.slice(0, 100))}
                placeholder="Nome da sua igreja"
                maxLength={100}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <MapPin className="w-4 h-4 text-slate-400" /> Cidade
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value.slice(0, 80))}
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
              onChange={(e) => setVerse(e.target.value.slice(0, 200))}
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
              onChange={(e) => setMinistry(e.target.value.slice(0, 100))}
              placeholder="Ex: Louvor, Intercessão, Diaconato..."
              maxLength={100}
              className={inputCls}
            />
          </div>

          {/* Erro */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-base text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Botão salvar */}
          <motion.button
            onClick={handleSave}
            disabled={saving || saved}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-5 rounded-2xl text-xl font-bold flex items-center justify-center gap-3 transition-all ${
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
        </motion.div>

      </div>

      {/* ── Seção: Minha Jornada — Streak Calendar ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="mt-8 max-w-xl mx-auto w-full"
      >
        <div className="mb-3 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-0.5">Consistência</p>
          <h2 className="font-serif text-xl font-semibold text-slate-800">Minha Jornada</h2>
        </div>
        <StreakCalendar />
      </motion.div>

      {/* ── Seção: Conquistas — Badge Display ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="mt-8"
      >
        <div className="mb-3 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-0.5">Sua caminhada</p>
          <h2 className="font-serif text-xl font-semibold text-slate-800">Conquistas Espirituais</h2>
          <p className="text-xs text-slate-400 mt-1">Marcos da sua jornada de fidelidade com Deus</p>
        </div>
        <BadgeDisplay />
      </motion.div>

      <div className="h-10" />
      <MonthlyReport open={reportOpen} onClose={() => setReportOpen(false)} />
    </div>
  );
}
