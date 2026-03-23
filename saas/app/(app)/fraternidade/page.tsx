"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Lock, Globe, Plus, Loader2, Link2, LogOut } from "lucide-react";
import { useSession } from "next-auth/react";
import { CellGroup } from "@/components/ui/CellGroup";
import { GratitudeFeed } from "@/components/ui/GratitudeFeed";
import { InviteModal } from "@/components/ui/InviteModal";

interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  streakDays: number;
  isOnline: boolean;
}

interface GroupData {
  id?: string;
  name: string;
  progress: number;
  isPrivate: boolean;
  link: string | null;
  members: Member[];
  maxMembers?: number;
}

interface PublicGroup {
  id: string;
  name: string;
  description: string | null;
  link: string | null;
  memberCount: number;
  maxMembers: number;
  isFull: boolean;
}

interface GratitudePost {
  id: string;
  author: string;
  avatarUrl?: string;
  content: string;
  reactions: { AMEN: number; GLORY: number };
  userReacted?: "AMEN" | "GLORY" | null;
  createdAt: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} minuto${mins > 1 ? "s" : ""}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `há ${hrs} hora${hrs > 1 ? "s" : ""}`;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

export default function CelulaPage() {
  const { data: session } = useSession();
  const isPremium = (session?.user as { plan?: string })?.plan === "PREMIUM" ||
                    (session?.user as { plan?: string })?.plan === "FAMILY";

  const [group, setGroup] = useState<GroupData | null | undefined>(undefined);
  const [publicGroups, setPublicGroups] = useState<PublicGroup[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState("");

  // Gratitude feed
  const [posts, setPosts] = useState<GratitudePost[]>([]);

  // Form de criação
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setGroup(d.group ?? null))
      .catch(() => setGroup(null));

    fetch("/api/groups")
      .then((r) => r.json())
      .then((d) => setPublicGroups(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch("/api/gratitude")
      .then((r) => r.json())
      .then((d) =>
        setPosts(
          Array.isArray(d)
            ? d.map((p: GratitudePost) => ({ ...p, createdAt: formatDate(p.createdAt) }))
            : []
        )
      )
      .catch(() => {});
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, isPrivate }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) { setCreateError(data.error ?? "Erro ao criar fraternidade"); return; }
    window.location.reload();
  }

  async function handleJoinPublic(groupId: string) {
    setJoiningId(groupId);
    setJoinError(null);
    const res = await fetch("/api/groups/join-public", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId }),
    });
    const data = await res.json();
    if (!res.ok) { setJoiningId(null); setJoinError(data.error ?? "Erro ao entrar no grupo"); return; }
    window.location.reload();
  }

  async function handleOpenInvite() {
    const res = await fetch("/api/groups/invite", { method: "POST" });
    if (res.ok) {
      const { token } = await res.json();
      setInviteToken(token);
    }
    setInviteOpen(true);
  }

  const handleReact = useCallback(async (postId: string, type: "AMEN" | "GLORY") => {
    await fetch(`/api/gratitude/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
  }, []);

  const handlePost = useCallback(async (content: string) => {
    const res = await fetch("/api/gratitude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const newPost = await res.json();
      setPosts((prev) => [{ ...newPost, createdAt: formatDate(newPost.createdAt) }, ...prev]);
    }
  }, []);

  // Loading
  if (group === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // ── Usuário já tem grupo ────────────────────────────────────────────
  if (group !== null) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-14">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 text-center"
        >
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-1">Minha Fraternidade</p>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            {group.name}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            {group.isPrivate ? (
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <Lock className="w-3.5 h-3.5" /> Fraternidade privada
              </span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-slate-500">
                <Globe className="w-3.5 h-3.5" /> Fraternidade pública
              </span>
            )}
          </div>
          <p className="text-xs italic text-slate-400 mt-3 max-w-xs mx-auto">
            &ldquo;Porque onde estiverem dois ou três reunidos em meu nome, ali estou eu no meio deles.&rdquo; — Mt 18:20
          </p>
        </motion.div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: CellGroup widget */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CellGroup
              name={group.name}
              progress={group.progress}
              members={group.members}
              maxMembers={group.maxMembers}
              onInvite={handleOpenInvite}
              onPray={() => {}}
            />
          </motion.div>

          {/* Right: Gratitude feed */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GratitudeFeed
              posts={posts}
              onReact={handleReact}
              onPost={handlePost}
            />
          </motion.div>
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3"
        >
          <button
            onClick={handleOpenInvite}
            className="divine-card p-4 flex flex-col items-center gap-2 text-center hover:border-gold/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-divine-50 flex items-center justify-center group-hover:bg-divine-100 transition-colors">
              <Link2 className="w-5 h-5 text-gold-dark" />
            </div>
            <p className="text-sm font-semibold text-slate-700">Convidar irmão</p>
            <p className="text-xs text-slate-400">Compartilhe o link</p>
          </button>

          <a
            href="/oracao"
            className="divine-card p-4 flex flex-col items-center gap-2 text-center hover:border-gold/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-divine-50 flex items-center justify-center group-hover:bg-divine-100 transition-colors">
              <span className="text-xl">🙏</span>
            </div>
            <p className="text-sm font-semibold text-slate-700">Ir para Oração</p>
            <p className="text-xs text-slate-400">Ver pedidos do grupo</p>
          </a>

          <a
            href="/devocional"
            className="divine-card p-4 flex flex-col items-center gap-2 text-center hover:border-gold/40 transition-all group sm:col-span-1 col-span-2"
          >
            <div className="w-10 h-10 rounded-xl bg-divine-50 flex items-center justify-center group-hover:bg-divine-100 transition-colors">
              <span className="text-xl">📖</span>
            </div>
            <p className="text-sm font-semibold text-slate-700">Devocional</p>
            <p className="text-xs text-slate-400">Estudo do dia</p>
          </a>
        </motion.div>

        {/* Link do grupo */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <GroupLinkEditor groupId={group.id} initialLink={group.link} />
        </motion.div>

        {/* Sair do grupo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-2 flex justify-center"
        >
          <LeaveGroupButton />
        </motion.div>

        <InviteModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          groupName={group.name}
          inviteToken={inviteToken}
        />
      </div>
    );
  }

  // ── Usuário sem grupo ───────────────────────────────────────────────
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-10 md:py-14">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-divine-100 to-divine-50 border border-divine-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Users className="w-8 h-8 text-gold-dark" />
        </div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-1">Fraternidades</p>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
          Encontre sua fraternidade
        </h1>
        <p className="text-base sm:text-lg text-slate-500 mt-2 max-w-md mx-auto">
          Entre numa pública ou crie a sua
        </p>
        <p className="text-xs italic text-slate-400 mt-3">
          &ldquo;O ferro aguça o ferro, e um homem aguça o rosto do outro.&rdquo; — Pv 27:17
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Criar fraternidade */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="divine-card p-5 sm:p-6 md:p-8 flex flex-col gap-6"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-divine-50 border border-divine-200 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-5 h-5 text-gold-dark" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-800 text-center">Criar uma fraternidade</h2>
            <p className="text-sm text-slate-500 text-center mt-1">Você será o líder do grupo</p>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Nome da fraternidade</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 60))}
                maxLength={60}
                placeholder="Ex: Fraternidade Esperança, Grupo Família…"
                className="w-full px-4 py-3 rounded-xl border-2 border-divine-200 bg-white text-base text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors"
                required
              />
              <p className="text-[10px] text-slate-400 text-right mt-0.5">{name.length}/60</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">
                Descrição <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                maxLength={200}
                rows={3}
                placeholder="Fale um pouco sobre o grupo…"
                className="w-full px-4 py-3 rounded-xl border-2 border-divine-200 bg-white text-base text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors resize-none"
              />
            </div>

            {/* Toggle privacidade */}
            {isPremium ? (
              <div className="flex items-center justify-between p-4 rounded-xl bg-divine-50 border border-divine-200">
                <div className="flex items-center gap-3">
                  {isPrivate ? <Lock className="w-5 h-5 text-gold-dark" /> : <Globe className="w-5 h-5 text-slate-400" />}
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{isPrivate ? "Fraternidade privada" : "Fraternidade pública"}</p>
                    <p className="text-xs text-slate-400">{isPrivate ? "Apenas por convite" : "Aparece na lista pública"}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPrivate((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${isPrivate ? "bg-gold" : "bg-slate-200"}`}
                  aria-label="Alternar privacidade"
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isPrivate ? "left-7" : "left-1"}`} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-divine-50 border border-divine-200">
                <Globe className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-600">Fraternidade pública</p>
                  <p className="text-xs text-slate-400">
                    Grupos privados no plano{" "}
                    <a href="/perfil" className="text-gold-dark font-semibold hover:underline">Premium</a>
                  </p>
                </div>
              </div>
            )}

            {createError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600 font-medium text-center">{createError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="btn-divine py-4 text-base disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {creating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Criando…</>
              ) : (
                <><Plus className="w-5 h-5" /> Criar fraternidade</>
              )}
            </button>
          </form>
        </motion.div>

        {/* Fraternidades públicas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="divine-card p-5 sm:p-6 md:p-8 flex flex-col gap-4"
        >
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-divine-50 border border-divine-200 flex items-center justify-center mx-auto mb-3">
              <Users className="w-5 h-5 text-gold-dark" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-800">Fraternidades abertas</h2>
            <p className="text-sm text-slate-500 mt-1">Entre diretamente ou acesse pelo link do grupo</p>
          </div>

          {/* Entrar por link */}
          <EnterByLink />

          {joinError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600 font-medium text-center">{joinError}</p>
            </div>
          )}

          {publicGroups.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-divine-50 border-2 border-dashed border-divine-200 flex items-center justify-center">
                <Users className="w-7 h-7 text-divine-300" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-600">Nenhuma fraternidade pública ainda</p>
                <p className="text-sm text-slate-400 mt-1">Seja o primeiro a criar uma!</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 flex-1">
              {publicGroups.map((g) => (
                <div key={g.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-divine-100 bg-divine-50/40 hover:border-gold/30 hover:bg-divine-50 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-white border border-divine-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Users className="w-4.5 h-4.5 text-gold-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-sm font-bold text-slate-800 truncate">{g.name}</p>
                    {g.description && (
                      <p className="text-xs text-slate-500 truncate">{g.description}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="h-1 flex-1 max-w-[60px] rounded-full bg-divine-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark"
                          style={{ width: `${(g.memberCount / g.maxMembers) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {g.memberCount}/{g.maxMembers}
                        {g.isFull && <span className="ml-1 text-amber-500 font-medium">· Cheia</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    {g.isFull ? (
                      <span className="text-[10px] text-slate-400 font-medium px-2">Cheia</span>
                    ) : (
                      <button
                        onClick={() => handleJoinPublic(g.id)}
                        disabled={joiningId === g.id}
                        className="flex items-center gap-1 text-xs text-white font-semibold bg-gold hover:bg-gold-dark px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                      >
                        {joiningId === g.id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Plus className="w-3 h-3" />
                        }
                        Entrar
                      </button>
                    )}
                    {g.link && (
                      <a
                        href={g.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gold-dark font-semibold border border-gold/40 bg-divine-50 hover:bg-divine-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Link2 className="w-3 h-3" />
                        Link do grupo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center text-xs text-slate-400 pt-1">
            Grupos privados só aceitam membros por convite{" "}
            <span className="text-gold-dark font-medium">(🔒)</span>
          </p>
        </motion.div>

      </div>
    </div>
  );
}

// ── Entrar por link ─────────────────────────────────────────────────
function EnterByLink() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  function handleOpen() {
    if (!url.trim()) return;
    window.open(url.trim(), "_blank", "noopener,noreferrer");
    setUrl("");
    setOpen(false);
  }

  return (
    <div className="rounded-xl border border-divine-200 bg-divine-50/60 p-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 text-sm text-gold-dark font-semibold hover:text-gold transition-colors py-1"
        >
          <Link2 className="w-4 h-4" />
          Tenho o link de uma fraternidade
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500 font-medium">Cole o link do grupo (WhatsApp, Telegram…)</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://chat.whatsapp.com/..."
              autoFocus
              className="flex-1 px-3 py-2 rounded-xl border-2 border-divine-200 bg-white text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors"
              onKeyDown={(e) => e.key === "Enter" && handleOpen()}
            />
            <button
              onClick={handleOpen}
              disabled={!url.trim()}
              className="px-3 py-2 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold-dark disabled:opacity-50 transition-colors"
            >
              Abrir
            </button>
            <button
              onClick={() => { setOpen(false); setUrl(""); }}
              className="px-2 py-2 rounded-xl border border-divine-200 text-slate-400 hover:bg-divine-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Editor de link do grupo ─────────────────────────────────────────
function GroupLinkEditor({ groupId, initialLink }: { groupId?: string; initialLink: string | null }) {
  const [link, setLink] = useState(initialLink ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/groups/link", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ link }),
    });
    setSaving(false);
    if (res.ok) { setEditing(false); setSaved(true); setTimeout(() => setSaved(false), 2500); }
  }

  return (
    <div className="divine-card p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-gold-dark" />
          <p className="text-sm font-semibold text-slate-700">Link do grupo</p>
          <span className="text-[10px] text-slate-400">(WhatsApp, Telegram, Discord…)</span>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-gold-dark hover:underline font-medium"
          >
            {link ? "Editar" : "Adicionar"}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://chat.whatsapp.com/..."
            autoFocus
            className="flex-1 px-3 py-2 rounded-xl border-2 border-divine-200 bg-white text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-3 py-2 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold-dark disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); setLink(initialLink ?? ""); }}
            className="px-3 py-2 rounded-xl border border-divine-200 text-sm text-slate-500 hover:bg-divine-50 transition-colors"
          >
            Cancelar
          </button>
        </form>
      ) : link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-divine-50 border border-divine-200 text-sm text-gold-dark font-medium hover:bg-divine-100 transition-colors w-fit"
        >
          <Link2 className="w-3.5 h-3.5" />
          Abrir link do grupo
          {saved && <span className="text-[10px] text-emerald-500 font-semibold ml-1">✓ Salvo</span>}
        </a>
      ) : (
        <p className="text-xs text-slate-400 italic">
          Nenhum link adicionado. Clique em &ldquo;Adicionar&rdquo; para compartilhar o link do grupo.
        </p>
      )}
    </div>
  );
}

// ── Botão sair do grupo ─────────────────────────────────────────────
function LeaveGroupButton() {
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function handleLeave() {
    setLeaving(true);
    await fetch("/api/groups/leave", { method: "POST" });
    window.location.reload();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors py-1 px-2 rounded-lg hover:bg-red-50"
      >
        <LogOut className="w-3.5 h-3.5" />
        Sair desta fraternidade
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100">
      <p className="text-sm text-red-600 flex-1">Tem certeza que deseja sair?</p>
      <button
        onClick={() => setConfirming(false)}
        className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 rounded-lg border border-slate-200 bg-white"
      >
        Cancelar
      </button>
      <button
        onClick={handleLeave}
        disabled={leaving}
        className="text-xs text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-lg flex items-center gap-1 disabled:opacity-60"
      >
        {leaving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        Sair
      </button>
    </div>
  );
}
