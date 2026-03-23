"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Lock, Globe, Plus, Loader2, Link2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { CellGroup } from "@/components/ui/CellGroup";
import { InviteModal } from "@/components/ui/InviteModal";

interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  streakDays: number;
  isOnline: boolean;
}

interface GroupData {
  name: string;
  progress: number;
  isPrivate: boolean;
  members: Member[];
}

interface PublicGroup {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  maxMembers: number;
  isFull: boolean;
}

export default function CelulaPage() {
  const { data: session } = useSession();
  const isPremium = (session?.user as { plan?: string })?.plan === "PREMIUM" ||
                    (session?.user as { plan?: string })?.plan === "FAMILY";

  const [group, setGroup] = useState<GroupData | null | undefined>(undefined); // undefined = loading
  const [publicGroups, setPublicGroups] = useState<PublicGroup[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState("");

  // Form de criação
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    // Carregar dados do grupo do usuário via dashboard API
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setGroup(d.group ?? null))
      .catch(() => setGroup(null));

    // Carregar grupos públicos
    fetch("/api/groups")
      .then((r) => r.json())
      .then((d) => setPublicGroups(Array.isArray(d) ? d : []))
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
    // Recarregar dados
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

  // Loading
  if (group === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  // Usuário já tem grupo
  if (group !== null) {
    return (
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-8 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-1">Minha Fraternidade</p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
            {group.name}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            {group.isPrivate ? (
              <span className="flex items-center gap-1 text-sm text-slate-500"><Lock className="w-3.5 h-3.5" /> Fraternidade privada</span>
            ) : (
              <span className="flex items-center gap-1 text-sm text-slate-500"><Globe className="w-3.5 h-3.5" /> Fraternidade pública</span>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="max-w-2xl mx-auto">
          <CellGroup
            name={group.name}
            progress={group.progress}
            members={group.members}
            onInvite={handleOpenInvite}
            onPray={() => {}}
          />
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

  // Usuário sem grupo — formulário + lista pública
  return (
    <div className="w-full px-6 md:px-10 py-10 md:py-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-10 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-1">Fraternidades</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">
          Encontre sua fraternidade
        </h1>
        <p className="text-lg text-slate-500 mt-2">Caminhe junto com outros irmãos na fé</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">

        {/* Criar fraternidade */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="divine-card p-5 sm:p-6 md:p-8 flex flex-col gap-6">
          <div>
            <h2 className="font-serif text-2xl font-bold text-slate-800 text-center">Criar uma fraternidade</h2>
            <p className="text-sm text-slate-500 text-center mt-1">Você será o líder do grupo</p>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="text-base font-semibold text-slate-700 mb-2 block">Nome da fraternidade</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 60))}
                maxLength={60}
                placeholder="Ex: Fraternidade Esperança, Grupo Família..."
                className="w-full px-4 py-3 rounded-xl border-2 border-divine-200 bg-white text-base text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors"
                required
              />
            </div>

            <div>
              <label className="text-base font-semibold text-slate-700 mb-2 block">
                Descrição <span className="text-slate-500 font-normal text-sm">(opcional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                maxLength={200}
                rows={3}
                placeholder="Fale um pouco sobre o grupo..."
                className="w-full px-4 py-3 rounded-xl border-2 border-divine-200 bg-white text-base text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors resize-none"
              />
            </div>

            {/* Toggle privacidade — apenas Premium */}
            {isPremium ? (
              <div className="flex items-center justify-between p-4 rounded-xl bg-divine-50 border border-divine-200">
                <div className="flex items-center gap-3">
                  {isPrivate ? <Lock className="w-5 h-5 text-gold-dark" /> : <Globe className="w-5 h-5 text-slate-400" />}
                  <div>
                    <p className="text-base font-semibold text-slate-700">{isPrivate ? "Fraternidade privada" : "Fraternidade pública"}</p>
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
                    Grupos privados disponíveis no plano{" "}
                    <span className="text-gold-dark font-semibold">Premium</span>
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
                <><Loader2 className="w-5 h-5 animate-spin" /> Criando...</>
              ) : (
                <><Plus className="w-5 h-5" /> Criar fraternidade</>
              )}
            </button>
          </form>
        </motion.div>

        {/* Fraternidades públicas */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col gap-4">
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold text-slate-800">Fraternidades abertas</h2>
            <p className="text-sm text-slate-500 mt-1">Peça o link de convite ao líder</p>
          </div>

          {publicGroups.length === 0 ? (
            <div className="divine-card p-8 flex flex-col items-center gap-3 text-center">
              <Users className="w-10 h-10 text-divine-300" />
              <p className="text-base text-slate-500">Nenhuma fraternidade pública ainda.</p>
              <p className="text-sm text-slate-400">Crie a primeira!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {publicGroups.map((g) => (
                <div key={g.id} className="divine-card p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-divine-50 border border-divine-200 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-gold-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base font-bold text-slate-800 truncate">{g.name}</p>
                    {g.description && (
                      <p className="text-sm text-slate-500 truncate">{g.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {g.memberCount}/{g.maxMembers} membros
                      {g.isFull && <span className="ml-2 text-amber-500 font-medium">· Cheia</span>}
                    </p>
                  </div>
                  {!g.isFull && (
                    <div className="flex-shrink-0 flex items-center gap-1 text-xs text-gold-dark font-semibold">
                      <Link2 className="w-3.5 h-3.5" />
                      Peça convite
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
