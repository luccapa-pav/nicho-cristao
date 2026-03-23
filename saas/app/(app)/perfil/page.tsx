"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Flame, CheckCircle2, BookOpen, MapPin, Loader2, Check } from "lucide-react";
import { BadgeDisplay } from "@/components/ui/BadgeDisplay";
import { StreakCalendar } from "@/components/ui/StreakCalendar";
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
    <div className="w-full px-6 md:px-10 py-10 md:py-14">

      {/* ── Título ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="mb-10 text-center"
      >
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-1">Meu Perfil</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
          Sua jornada de fé
        </h1>
        <p className="text-lg text-slate-500 mt-2">Membro desde {memberSince}</p>
      </motion.div>

      {/* ── Layout 2 colunas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-6">

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
            className="divine-card p-6 flex flex-col gap-4"
          >
            <h3 className="font-serif text-xl font-bold text-slate-800 text-center">Minha jornada</h3>

            {[
              { icon: Flame,        label: "Ofensiva atual",       value: profile.streak?.currentStreak ?? 0, unit: "dias seguidos" },
              { icon: CheckCircle2, label: "Total completados",    value: profile.streak?.totalDays ?? 0,     unit: "dias" },
              { icon: BookOpen,     label: "Orações registradas",  value: profile._count.prayers,             unit: "orações" },
            ].map(({ icon: Icon, label, value, unit }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-divine-50/60">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm flex-shrink-0">
                  <Icon className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-slate-800 leading-none">
                    {value}
                    <span className="text-sm font-normal text-slate-500 ml-1">{unit}</span>
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Plano */}
          <motion.div
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
                <p className="text-sm text-slate-500">Desbloqueie todos os recursos premium.</p>
                <button className="btn-divine w-full py-3 text-sm">
                  Fazer upgrade
                </button>
              </>
            )}
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
            <label className={labelCls}>Nome completo</label>
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
              Sobre mim
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
              <label className={labelCls}>Igreja</label>
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
              Versículo favorito
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
            <label className={labelCls}>Ministério</label>
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
        className="mt-10"
      >
        <div className="mb-4 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-1">Consistência</p>
          <h2 className="font-serif text-2xl font-semibold text-slate-800">Minha Jornada</h2>
        </div>
        <StreakCalendar />
      </motion.div>

      {/* ── Seção: Conquistas — Badge Display ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="mt-10"
      >
        <div className="mb-4 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-1">Gamificação</p>
          <h2 className="font-serif text-2xl font-semibold text-slate-800">Conquistas</h2>
        </div>
        <BadgeDisplay />
      </motion.div>

      <div className="h-10" />
    </div>
  );
}
