"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Lock, Globe, Plus, Loader2, Link2, LogOut, Search, X, Send, MessageCircle, BookOpen, ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePlan } from "@/hooks/usePlan";
import { CellGroup } from "@/components/ui/CellGroup";
import { GratitudeFeed } from "@/components/ui/GratitudeFeed";
import { InviteModal } from "@/components/ui/InviteModal";
import { useToast } from "@/components/ui/Toast";

interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  streakDays: number;
  isOnline: boolean;
  role?: "LEADER" | "MEMBER";
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

interface GroupPrayer {
  id: string;
  title: string;
  description?: string;
  status: string;
  prayedCount: number;
  createdAt: string;
  author: string;
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

// ── Mock data for blurred showcase ──────────────────────────────────
const MOCK_POSTS = [
  { id: "m1", author: "Ana Clara", content: "Deus abriu uma porta que eu nem esperava hoje. Glória a Ele! 🙏", reactions: { AMEN: 12, GLORY: 8 }, createdAt: "há 2 horas" },
  { id: "m2", author: "Pedro Henrique", content: "Orando pela família. Quem puder interceder, agradeço de coração.", reactions: { AMEN: 7, GLORY: 3 }, createdAt: "há 5 horas" },
  { id: "m3", author: "Maria José", content: "Completei 30 dias de sequência no devocional! Fé que move montanhas ✦", reactions: { AMEN: 21, GLORY: 15 }, createdAt: "há 1 dia" },
];

const MOCK_GROUPS = [
  { name: "Filhos da Promessa", members: 11, max: 12 },
  { name: "Guerreiros do Altar", members: 8, max: 12 },
  { name: "Irmãos na Fé", members: 6, max: 12 },
];

export default function CelulaPage() {
  const { data: session } = useSession();
  const { isPremium } = usePlan();

  const [group, setGroup] = useState<GroupData | null | undefined>(undefined);
  const [publicGroups, setPublicGroups] = useState<PublicGroup[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState("");

  // Gratitude feed
  const [posts, setPosts] = useState<GratitudePost[]>([]);
  const [groupPrayers, setGroupPrayers] = useState<GroupPrayer[]>([]);
  const [prayingId, setPrayingId] = useState<string | null>(null);

  // Form de criação
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joiningRandom, setJoiningRandom] = useState(false);

  // Sort & filter for public groups
  const [groupSearch, setGroupSearch] = useState("");
  const [groupSort, setGroupSort] = useState<"members" | "recent">("members");
  const [loadingGroups, setLoadingGroups] = useState(true);

  // Vitrine overlay CTAs
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showLinkPanel, setShowLinkPanel] = useState(false);

  // Modal de boas-vindas — aparece só na primeira entrada em uma fraternidade
  const [showWelcome, setShowWelcome] = useState(false);

  // Chat interface
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [showChatPaywall, setShowChatPaywall] = useState(false);
  const [chatPaywallFeature, setChatPaywallFeature] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { showToast, ToastElement } = useToast();

  useEffect(() => {
    fetch("/api/inicio")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setGroup(d.group ?? null);
        if (d.group && typeof window !== "undefined" && localStorage.getItem("welcome_pending") === "true") {
          localStorage.removeItem("welcome_pending");
          setShowWelcome(true);
        }
      })
      .catch(() => setGroup(null));

    fetch("/api/groups")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => setPublicGroups(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingGroups(false));

    fetch("/api/gratitude")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) =>
        setPosts(
          Array.isArray(d)
            ? d.map((p: GratitudePost) => ({ ...p, createdAt: formatDate(p.createdAt) }))
            : []
        )
      )
      .catch(() => {});

    fetch("/api/prayers/group")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => setGroupPrayers(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Filtered + sorted public groups
  const filteredPublicGroups = useMemo(() => {
    let result = [...publicGroups];
    if (groupSearch.trim()) {
      const q = groupSearch.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(q));
    }
    if (groupSort === "members") {
      result.sort((a, b) => b.memberCount - a.memberCount);
    }
    return result;
  }, [publicGroups, groupSearch, groupSort]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setNameError("Nome da fraternidade é obrigatório"); return; }
    if (name.trim().length < 3) { setNameError("Nome deve ter pelo menos 3 caracteres"); return; }
    setNameError("");
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
    showToast("✓ Fraternidade criada com sucesso!");
    setTimeout(() => window.location.reload(), 700);
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
    showToast("✓ Você entrou na fraternidade!");
    localStorage.setItem("welcome_pending", "true");
    setTimeout(() => window.location.reload(), 700);
  }

  async function handleJoinRandom() {
    setJoiningRandom(true);
    setJoinError(null);
    const res = await fetch('/api/groups/join-random', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) { setJoiningRandom(false); setJoinError(data.error ?? 'Erro ao entrar na fraternidade'); return; }
    showToast(data.created ? 'Nova fraternidade criada para você!' : 'Você entrou em ' + data.groupName + '!');
    localStorage.setItem("welcome_pending", "true");
    setTimeout(() => window.location.reload(), 700);
  }

  async function handleOpenInvite() {
    const maxMembers = group?.maxMembers ?? 12;
    const memberCount = group?.members?.length ?? 0;
    if (!isPremium && memberCount >= maxMembers) {
      triggerChatPaywall("Aumentar limite de membros para 50");
      return;
    }
    const res = await fetch("/api/groups/invite", { method: "POST" });
    if (!res.ok) { showToast("Erro ao gerar link de convite."); return; }
    const { token } = await res.json();
    setInviteToken(token);
    setInviteOpen(true);
  }

  const handlePrayFor = useCallback(async (prayerId: string) => {
    setPrayingId(prayerId);
    await fetch(`/api/prayers/${prayerId}/prayed`, { method: "POST" }).catch(() => {});
    setGroupPrayers((prev) =>
      prev.map((p) => p.id === prayerId ? { ...p, prayedCount: p.prayedCount + 1 } : p)
    );
    showToast("🙏 Oração registrada!");
    setTimeout(() => setPrayingId(null), 600);
  }, [showToast]);

  const handleReact = useCallback(async (postId: string, type: "AMEN" | "GLORY") => {
    const res = await fetch(`/api/gratitude/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    }).catch(() => null);
    if (!res?.ok) return;
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

  // Chat send (usa o mesmo endpoint de gratitude)
  const handleSendChat = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || sendingChat) return;
    setSendingChat(true);
    setChatInput("");
    const res = await fetch("/api/gratitude", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (res.ok) {
      const newPost = await res.json();
      setPosts((prev) => [...prev, { ...newPost, createdAt: formatDate(newPost.createdAt) }]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    setSendingChat(false);
  }, [chatInput, sendingChat]);

  // Auto-scroll quando posts chegam
  useEffect(() => {
    if (posts.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [posts.length]);

  // Trigger paywall para features locked
  const triggerChatPaywall = useCallback((feature: string) => {
    setChatPaywallFeature(feature);
    setShowChatPaywall(true);
  }, []);

  // Loading
  if (group === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // ── Usuário já tem grupo — Hub Social com Chat ───────────────────────
  if (group !== null) {
    const userName = session?.user?.name ?? "";
    const memberCount = group.members?.length ?? 0;

    return (
      <div className="flex flex-col lg:flex-row overflow-hidden bg-gray-50 h-[calc(100dvh-3.5rem-5rem)] md:h-[100dvh]">
        {ToastElement}

        {/* ══ Sidebar esquerda (30%) — desktop only ══ */}
        <aside
          className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 h-full bg-gradient-to-b from-amber-50/60 via-white to-white"
          style={{ boxShadow: "2px 0 16px rgba(0,0,0,0.05)" }}
        >

          {/* Fraternity header */}
          <div className="p-5 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-400 mb-1">Minha Fraternidade</p>
            <h2 className="font-serif text-lg font-bold text-slate-900 leading-tight truncate">{group.name}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              {group.isPrivate
                ? <><Lock className="w-3 h-3 text-slate-400" /><span className="text-xs text-slate-400">Privada</span></>
                : <><Globe className="w-3 h-3 text-slate-400" /><span className="text-xs text-slate-400">Pública</span></>}
              <span className="text-slate-300 mx-1">·</span>
              <Users className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">{memberCount} membros</span>
            </div>
          </div>

          {/* Progress + Members */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">Progresso do grupo</p>
              <p className="text-xs font-bold text-gold-dark">{group.progress}%</p>
            </div>
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark transition-all"
                style={{ width: `${group.progress}%` }}
              />
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {group.members.slice(0, 8).map((m) => (
                <div key={m.id} className="relative" title={m.role === "LEADER" ? `${m.name} — Guardião` : m.name}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gold-dark shadow-sm ${
                    m.role === "LEADER"
                      ? "bg-gradient-to-br from-gold/30 to-gold/10 border-2 border-gold/50"
                      : "bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-white"
                  }`}>
                    {m.name[0]}
                  </div>
                  {m.role === "LEADER" && (
                    <span className="absolute -top-1.5 -right-1 text-xs leading-none">🪔</span>
                  )}
                  {m.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-400 border border-white" />
                  )}
                </div>
              ))}
              {memberCount > 8 && (
                <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                  +{memberCount - 8}
                </div>
              )}
            </div>
          </div>

          {/* Muro de Oração */}
          {groupPrayers.length > 0 && (
            <div className="p-5 border-b border-slate-100 flex flex-col gap-3">
              <p className="text-sm font-semibold text-slate-600">🙏 Muro de Oração</p>
              {groupPrayers.slice(0, 4).map((gp) => (
                <div key={gp.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 truncate">{gp.title}</p>
                    <p className="text-xs text-slate-400">por {gp.author}</p>
                  </div>
                  <button
                    onClick={() => handlePrayFor(gp.id)}
                    disabled={prayingId === gp.id}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-gold-dark hover:bg-gray-50 transition-colors shrink-0 disabled:opacity-60"
                  >
                    🙏 {gp.prayedCount > 0 ? gp.prayedCount : "Orei"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Convidar — desktop sidebar */}
          <div className="px-4 py-3 border-t border-slate-100 shrink-0">
            <button
              onClick={handleOpenInvite}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-600 hover:border-gold/40 hover:text-gold-dark transition-all"
            >
              <Link2 className="w-4 h-4" />
              Convidar ({memberCount}/{group.maxMembers ?? 12})
            </button>
          </div>

          {/* Feed da Comunidade */}
          <div className="flex flex-col flex-1 min-h-0 border-t border-slate-100">
            <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
              <p className="text-sm font-semibold text-slate-500">Feed da Comunidade</p>
              {posts.length > 0 && (
                <span className="text-xs text-slate-400">{posts.length} posts</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {posts.length === 0 ? (
                <p className="text-xs text-slate-400 italic px-1">Nenhuma mensagem ainda.</p>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-xs font-bold text-gold-dark shrink-0">
                        {post.author[0]}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 truncate">{post.author}</p>
                      <p className="text-xs text-slate-400 ml-auto shrink-0">{post.createdAt}</p>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{post.content}</p>
                    {(post.reactions.AMEN > 0 || post.reactions.GLORY > 0) && (
                      <div className="flex gap-2 mt-0.5">
                        {post.reactions.AMEN > 0 && (
                          <span className="text-xs text-slate-400">🙏 {post.reactions.AMEN}</span>
                        )}
                        {post.reactions.GLORY > 0 && (
                          <span className="text-xs text-slate-400">✨ {post.reactions.GLORY}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sair */}
          <div className="mt-auto p-4 border-t border-slate-100 flex justify-center shrink-0">
            <LeaveGroupButton />
          </div>
        </aside>

        {/* ══ Coluna principal (70%) — chat ══ */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

          {/* ── Chat ── */}
          <>
            {/* Mobile compact header */}
            <div className="flex lg:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-100 shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div>
                <p className="text-sm font-bold text-slate-800">{group.name}</p>
                <p className="text-xs text-slate-400">{memberCount} membros</p>
              </div>
              <button
                onClick={handleOpenInvite}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600 hover:border-gold/40 hover:text-gold-dark transition-all"
              >
                <Link2 className="w-3.5 h-3.5" />
                Convidar ({memberCount}/{group.maxMembers ?? 12})
              </button>
            </div>
            {/* Desktop chat header */}
            <div className="hidden lg:flex items-center px-4 py-3 bg-white border-b border-slate-100 shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <MessageCircle className="w-4 h-4 text-gold-dark mr-2" />
              <p className="text-sm font-semibold text-slate-700">Chat da Fraternidade</p>
            </div>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-3 min-h-0">
                {posts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <MessageCircle className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">Seja o primeiro a compartilhar!</p>
                    <p className="text-xs text-slate-400 max-w-[220px] leading-relaxed">
                      Este é o espaço da sua fraternidade. Compartilhe gratidão, pedidos e vitórias.
                    </p>
                  </div>
                ) : (
                  posts.map((msg) => {
                    const isOwn = msg.author === userName;
                    return (
                      <div key={msg.id} className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                        {/* Avatar */}
                        {!isOwn && (
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center text-xs font-bold text-gold-dark shrink-0 mt-0.5">
                            {msg.author[0]}
                          </div>
                        )}
                        <div className={`flex flex-col gap-1 max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
                          {!isOwn && (
                            <p className="text-xs font-semibold text-slate-500 px-1">{msg.author}</p>
                          )}
                          <div
                            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isOwn
                                ? "bg-gradient-to-br from-gold to-gold-dark text-white rounded-tr-sm"
                                : "bg-white text-slate-800 rounded-tl-sm"
                            }`}
                            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}
                          >
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-2 px-1">
                            <p className="text-xs text-slate-400">{msg.createdAt}</p>
                            <button
                              onClick={() => handleReact(msg.id, "AMEN")}
                              className="text-xs text-slate-400 hover:text-gold-dark transition-colors"
                            >
                              🙏 {msg.reactions.AMEN > 0 ? msg.reactions.AMEN : ""}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar — fixa no rodapé do chat */}
              <div
                className="bg-white/90 backdrop-blur-sm px-4 py-3 flex items-center gap-2 shrink-0"
                style={{ boxShadow: "0 -2px 16px rgba(0,0,0,0.07)" }}
              >
                {/* Text input — pill shape */}
                <div className="flex-1 min-w-0 relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendChat()}
                    placeholder="Compartilhe com sua fraternidade…"
                    className="w-full bg-white border border-slate-200 rounded-full px-5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
                    style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}
                  />
                </div>

                {/* Send button — dourado sólido */}
                <button
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || sendingChat}
                  className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-gold to-gold-dark text-white flex items-center justify-center shadow-md hover:opacity-90 active:scale-95 transition-all disabled:opacity-35"
                  aria-label="Enviar"
                >
                  {sendingChat
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4" />}
                </button>
              </div>
          </>

          {/* ── Muro de Oração colapsável (mobile only) ── */}
          {groupPrayers.length > 0 && (
            <details className="lg:hidden shrink-0 border-t border-slate-100 bg-white">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer text-sm font-semibold text-slate-600 list-none select-none">
                <span>🙏</span> Muro de Oração ({groupPrayers.length})
                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto" />
              </summary>
              <div className="px-4 pb-4 flex flex-col gap-3">
                {groupPrayers.slice(0, 4).map((gp) => (
                  <div key={gp.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{gp.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">por {gp.author}</p>
                    </div>
                    <button
                      onClick={() => handlePrayFor(gp.id)}
                      disabled={prayingId === gp.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-gold-dark hover:bg-gray-50 transition-colors shrink-0 disabled:opacity-60"
                    >
                      🙏 {gp.prayedCount > 0 ? gp.prayedCount : ""} Orei
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>

        {/* ── Chat Paywall Modal ── */}
        <AnimatePresence>
          {showChatPaywall && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowChatPaywall(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.25 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7 flex flex-col items-center gap-5 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-slate-900">Recurso Premium</h2>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    <strong className="text-slate-700">{chatPaywallFeature}</strong> é exclusivo do plano Premium. Eleve sua experiência espiritual e lidere sua comunidade com mais poder.
                  </p>
                </div>
                <a href="/assinar" className="btn-divine w-full py-3.5 text-sm font-bold">
                  Desbloquear Premium
                </a>
                <button onClick={() => setShowChatPaywall(false)} className="text-xs text-slate-400 hover:text-slate-600">
                  Agora não
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <InviteModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          groupName={group.name}
          inviteToken={inviteToken}
        />

        {/* ── Modal de Boas-Vindas — só dispara na primeira entrada ── */}
        <WelcomeFraternityModal
          open={showWelcome}
          groupName={group.name}
          onClose={() => setShowWelcome(false)}
        />
      </div>
    );
  }

  // ── Usuário sem grupo — Vitrine Borrada ──────────────────────────────
  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {ToastElement}

      {/* ── Fundo borrado: conteúdo simulado ── */}
      <div
        className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-10 pointer-events-none select-none"
        style={{ filter: "blur(12px)", opacity: 0.55 }}
        aria-hidden="true"
      >
        {/* Header mockado */}
        <div className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-1">Minha Fraternidade</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">Filhos da Promessa</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-sm text-slate-500">
              <Globe className="w-3.5 h-3.5" /> Fraternidade pública
            </span>
          </div>
        </div>

        {/* Mock membros */}
        <div className="divine-card p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-gold-dark" />
            <p className="font-serif text-lg font-bold text-slate-800">Membros</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {["Ana Clara", "Pedro H.", "Maria J.", "João P.", "Lúcia F."].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-divine-200 to-divine-100 border-2 border-white flex items-center justify-center text-xs font-bold text-gold-dark">
                  {n[0]}
                </div>
                <p className="text-xs text-slate-500 truncate max-w-[48px] text-center">{n.split(" ")[0]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mock posts de gratidão */}
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-divine-200" />
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-gold-dark/60">Gratidão da Comunidade</p>
          <div className="h-px flex-1 bg-divine-200" />
        </div>
        <div className="flex flex-col gap-3">
          {MOCK_POSTS.map((post) => (
            <div key={post.id} className="divine-card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-divine-200 to-divine-100 flex items-center justify-center text-xs font-bold text-gold-dark">
                  {post.author[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{post.author}</p>
                  <p className="text-xs text-slate-400">{post.createdAt}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">{post.content}</p>
              <div className="flex gap-2">
                <span className="text-xs text-slate-400 bg-divine-50 px-2 py-0.5 rounded-full">🙏 Amém {post.reactions.AMEN}</span>
                <span className="text-xs text-slate-400 bg-divine-50 px-2 py-0.5 rounded-full">✨ Glória {post.reactions.GLORY}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Mock fraternidades lista */}
        <div className="mt-8 flex flex-col gap-3">
          {MOCK_GROUPS.map((g) => (
            <div key={g.name} className="flex items-center gap-3 p-3.5 rounded-xl border border-divine-100 bg-divine-50/40">
              <div className="w-10 h-10 rounded-xl bg-white border border-divine-200 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-gold-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-serif text-sm font-bold text-slate-800">{g.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-1 flex-1 max-w-[60px] rounded-full bg-divine-200 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark" style={{ width: `${(g.members / g.max) * 100}%` }} />
                  </div>
                  <p className="text-xs text-slate-400">{g.members}/{g.max}</p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-gold text-white text-xs font-semibold">Entrar</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Overlay: Caixa "Descubra sua Fraternidade" — fixo na tela ── */}
      <div className="fixed inset-0 z-30 flex items-center justify-center px-4 bg-black/30 dark:bg-black/60 backdrop-blur-[2px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm rounded-2xl shadow-2xl border border-gold/30 dark:border-gold/20 p-7 flex flex-col items-center gap-5 relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #FEFDF8 0%, #FBF8F0 60%, #F9F5E8 100%)" }}
        >
          {/* Dark mode overlay */}
          <div className="absolute inset-0 hidden dark:block rounded-2xl" style={{ background: "linear-gradient(160deg, #1a1810 0%, #1e1c12 60%, #201e14 100%)" }} />

          {/* Textura de fundo sutil */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" style={{ opacity: 0.05 }}>
            <defs>
              <pattern id="conn-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="#B8960C" />
                <line x1="20" y1="20" x2="40" y2="20" stroke="#B8960C" strokeWidth="0.5" />
                <line x1="20" y1="20" x2="20" y2="40" stroke="#B8960C" strokeWidth="0.5" />
                <line x1="20" y1="20" x2="40" y2="40" stroke="#B8960C" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#conn-pattern)" />
          </svg>

          {/* Icon + Title */}
          <div className="text-center relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Users className="w-8 h-8 text-gold-dark" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-900 dark:text-zinc-100">Descubra sua Fraternidade</h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed max-w-[260px] mx-auto">
              Encontre o seu lugar único numa comunidade de irmãos que caminham na fé, onde cada conexão é pensada para se encaixar na sua jornada pessoal.
            </p>
            <p className="text-xs italic text-slate-400 dark:text-zinc-500 mt-2.5">
              &ldquo;O ferro aguça o ferro, e um homem aguça o rosto do outro.&rdquo; — Pv 27:17
            </p>
          </div>

          {/* CTAs */}
          <div className="w-full flex flex-col gap-3 relative z-10">

            {/* CTA 1: Escolher uma Fraternidade — destaque primário */}
            <button
              onClick={() => { setShowSearchModal(true); setShowLinkPanel(false); }}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #D4AF37 0%, #9A7A1E 100%)", boxShadow: "0 4px 14px rgba(212,175,55,0.4)" }}
            >
              <Search className="w-4 h-4" />
              Escolher uma Fraternidade
            </button>

            {/* CTA 2: Entrar por Link */}
            <button
              onClick={() => { setShowLinkPanel(true); setShowSearchModal(false); }}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl border-2 border-gold/40 dark:border-gold/30 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:border-gold/70 hover:bg-gold/5 transition-all active:scale-95"
            >
              <Link2 className="w-4 h-4 text-gold-dark" />
              Entrar por Link
            </button>

            {/* CTA 3: Entrar Aleatório */}
            <button
              onClick={handleJoinRandom}
              disabled={joiningRandom}
              className="w-full flex flex-col items-center justify-center gap-0.5 py-3.5 px-4 rounded-xl border-2 border-gold/40 dark:border-gold/30 text-sm font-semibold text-slate-700 dark:text-zinc-200 hover:border-gold/70 hover:bg-gold/5 transition-all disabled:opacity-60 active:scale-95"
            >
              {joiningRandom ? (
                <span className="flex items-center gap-2 text-gold-dark">
                  <span className="animate-spin text-base">✦</span> Buscando irmãos…
                </span>
              ) : (
                <>
                  <span>Entrar Aleatório <span className="text-gold-dark">✦</span></span>
                  <span className="text-xs font-normal text-slate-400 dark:text-zinc-500">Deixe Deus escolher sua Fraternidade</span>
                </>
              )}
            </button>

          </div>

          {joinError && (
            <p className="text-xs text-red-500 text-center -mt-1 relative z-10">{joinError}</p>
          )}
        </motion.div>
      </div>

      {/* ── Modal: Escolher Fraternidade ── */}
      <AnimatePresence>
        {showSearchModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowSearchModal(false)}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-7 flex flex-col gap-5 max-h-[85vh] overflow-y-auto"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">Escolher Fraternidade</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Entre numa existente ou crie a sua</p>
                </div>
                <button onClick={() => setShowSearchModal(false)} className="p-2 rounded-xl hover:bg-divine-50 transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search + Sort */}
              {publicGroups.length > 0 && (
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={groupSearch}
                      onChange={(e) => setGroupSearch(e.target.value)}
                      placeholder="Buscar fraternidade..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-divine-200 bg-white text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors"
                    />
                  </div>
                  <select
                    value={groupSort}
                    onChange={(e) => setGroupSort(e.target.value as "members" | "recent")}
                    className="px-2.5 py-2 rounded-xl border border-divine-200 bg-white text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-gold/30 transition-colors"
                  >
                    <option value="members">Mais membros</option>
                    <option value="recent">Mais recente</option>
                  </select>
                </div>
              )}

              {joinError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm text-red-600 font-medium text-center">{joinError}</p>
                </div>
              )}

              {/* Groups list */}
              {loadingGroups ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-divine-100/50 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : filteredPublicGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-divine-50 border-2 border-dashed border-divine-200 flex items-center justify-center">
                    <Users className="w-6 h-6 text-divine-300" />
                  </div>
                  <p className="text-sm text-slate-500">
                    {groupSearch ? `Nenhuma fraternidade para "${groupSearch}"` : "Nenhuma fraternidade pública ainda"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredPublicGroups.map((g) => (
                    <div key={g.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-divine-100 bg-divine-50/40 hover:border-gold/30 hover:bg-divine-50 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-white border border-divine-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Users className="w-4 h-4 text-gold-dark" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-serif text-sm font-bold text-slate-800 truncate">{g.name}</p>
                        {g.description && <p className="text-xs text-slate-500 truncate">{g.description}</p>}
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="h-1 flex-1 max-w-[60px] rounded-full bg-divine-200 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-gold to-gold-dark" style={{ width: `${(g.memberCount / g.maxMembers) * 100}%` }} />
                          </div>
                          <p className="text-xs text-slate-400">
                            {g.memberCount}/{g.maxMembers}
                            {g.isFull && <span className="ml-1 text-amber-500 font-medium">· Cheia</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                        {g.isFull ? (
                          <button disabled className="text-xs text-slate-300 font-medium px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 cursor-not-allowed">
                            Cheia
                          </button>
                        ) : (
                          <button
                            onClick={() => handleJoinPublic(g.id)}
                            disabled={joiningId === g.id}
                            className="flex items-center gap-1 text-xs text-white font-semibold bg-gold hover:bg-gold-dark px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60"
                          >
                            {joiningId === g.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Entrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Criar fraternidade */}
              <div className="border-t border-divine-100 pt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Ou crie sua própria</p>
                <form onSubmit={handleCreate} className="flex flex-col gap-3">
                  <div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => { setName(e.target.value.slice(0, 60)); if (nameError) setNameError(""); }}
                      maxLength={60}
                      placeholder="Nome da fraternidade…"
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-base text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 transition-colors ${nameError ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-divine-200 focus:ring-gold/30 focus:border-gold"}`}
                    />
                    {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                    maxLength={200}
                    rows={2}
                    placeholder="Descrição (opcional)…"
                    className="w-full px-4 py-3 rounded-xl border-2 border-divine-200 bg-white text-base text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors resize-none"
                  />
                  {createError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600 font-medium text-center">{createError}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={creating || !name.trim()}
                    className="btn-divine py-3.5 text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Criando…</> : <><Plus className="w-4 h-4" /> Criar fraternidade</>}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Panel: Entrar por Link ── */}
      <AnimatePresence>
        {showLinkPanel && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowLinkPanel(false)}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 sm:p-7 flex flex-col gap-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">Entrar por Link</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Cole o link do convite da fraternidade</p>
                </div>
                <button onClick={() => setShowLinkPanel(false)} className="p-2 rounded-xl hover:bg-divine-50 transition-colors text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <LinkEntryPanel onClose={() => setShowLinkPanel(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Entrar por link (painel inline) ─────────────────────────────────
function LinkEntryPanel({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState("");

  function handleOpen() {
    if (!url.trim()) return;
    window.open(url.trim(), "_blank", "noopener,noreferrer");
    setUrl("");
    onClose();
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">Cole o link do grupo (WhatsApp, Telegram, Discord…)</p>
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://chat.whatsapp.com/..."
          autoFocus
          className="flex-1 px-3 py-3 rounded-xl border-2 border-divine-200 bg-white text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors"
          onKeyDown={(e) => e.key === "Enter" && handleOpen()}
        />
        <button
          onClick={handleOpen}
          disabled={!url.trim()}
          className="px-4 py-3 rounded-xl bg-gold text-white text-sm font-semibold hover:bg-gold-dark disabled:opacity-50 transition-colors"
        >
          Abrir
        </button>
      </div>
    </div>
  );
}

// ── Botão sair do grupo ─────────────────────────────────────────────
function LeaveGroupButton() {
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function handleLeave() {
    setLeaving(true);
    const res = await fetch("/api/groups/leave", { method: "POST" });
    if (!res.ok) {
      setLeaving(false);
      setConfirming(false);
      alert("Erro ao sair da fraternidade. Tente novamente.");
      return;
    }
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

// ── Modal de Boas-Vindas à Fraternidade ─────────────────────────────
function WelcomeFraternityModal({
  open,
  groupName,
  onClose,
}: {
  open: boolean;
  groupName: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl shadow-2xl border border-divine-200/80 p-8 flex flex-col items-center gap-5 text-center"
        style={{ background: "linear-gradient(160deg, #FEFDF8 0%, #FBF8F0 60%, #F9F5E8 100%)" }}
      >
        {/* Ícone de comunidade */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-divine-100 to-divine-50 border border-divine-200 flex items-center justify-center shadow-sm">
          <Users className="w-8 h-8 text-gold-dark" />
        </div>

        {/* Título */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-slate-900">
            Bem-vindo à sua Fraternidade!
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed max-w-[260px] mx-auto">
            Que alegria ter você conosco! Este é o seu espaço seguro para compartilhar pedidos de oração, celebrar vitórias e caminhar na fé junto com seus irmãos.{" "}
            <span className="text-slate-600 font-medium">Sinta-se em casa.</span>
          </p>
          <p className="text-xs italic text-slate-400 mt-3">
            &ldquo;Onde estiverem dois ou três reunidos em meu nome, ali estou eu no meio deles.&rdquo; — Mt 18:20
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full btn-divine py-3.5 text-sm font-bold"
        >
          Conhecer meus irmãos em {groupName}
        </button>
      </motion.div>
    </div>
  );
}
