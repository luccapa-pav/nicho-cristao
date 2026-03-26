"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Users, Loader2, CheckCircle2, XCircle, LogIn } from "lucide-react";
import Link from "next/link";

interface InviteInfo {
  groupName: string;
  memberCount: number;
  maxMembers: number;
  senderName: string;
}

export default function EntrarPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [joinError, setJoinError] = useState("");

  // Fetch invite info (public — no auth required to preview)
  useEffect(() => {
    fetch(`/api/groups/invite-info?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setFetchError(d.error);
        else setInvite(d);
      })
      .catch(() => setFetchError("Não foi possível carregar o convite"));
  }, [token]);

  async function handleJoin() {
    if (!session) return;
    setJoining(true);
    setJoinError("");
    const res = await fetch("/api/groups/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    setJoining(false);
    if (!res.ok) { setJoinError(data.error ?? "Erro ao entrar na fraternidade"); return; }
    setJoined(true);
    setTimeout(() => router.push("/fraternidade"), 2500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFEF9] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine mb-3">
            <span className="text-white text-2xl">✝</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">Vida com Jesus</h1>
          <p className="text-sm text-slate-400 mt-1">Convite para fraternidade</p>
        </div>

        <div className="divine-card p-6 flex flex-col gap-5">

          {/* Loading invite info */}
          {!invite && !fetchError && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 text-gold animate-spin" />
              <p className="text-sm text-slate-500">Verificando convite...</p>
            </div>
          )}

          {/* Error loading invite */}
          {fetchError && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <XCircle className="w-10 h-10 text-red-400" />
              <p className="text-base font-semibold text-slate-700">{fetchError}</p>
              <p className="text-sm text-slate-400">O link pode ter expirado ou já ter sido usado.</p>
              <Link href="/dashboard" className="btn-divine py-2.5 text-sm w-full text-center mt-2">
                Ir para o início
              </Link>
            </div>
          )}

          {/* Invite loaded — joined success */}
          {invite && joined && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="w-12 h-12 text-gold" />
              <p className="font-serif text-xl font-bold text-slate-800">Bem-vindo à fraternidade!</p>
              <p className="text-sm text-slate-500">
                Você entrou em <strong>{invite.groupName}</strong>. Redirecionando...
              </p>
              <Loader2 className="w-5 h-5 text-gold animate-spin mt-1" />
            </div>
          )}

          {/* Invite loaded — show details */}
          {invite && !joined && (
            <>
              {/* Group info */}
              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 flex items-center justify-center mb-1">
                  <Users className="w-8 h-8 text-gold-dark" />
                </div>
                <p className="text-sm text-slate-400 font-medium">Você foi convidado para</p>
                <p className="font-serif text-2xl font-bold text-slate-800">{invite.groupName}</p>
                <p className="text-sm text-slate-500">
                  {invite.memberCount}/{invite.maxMembers} membros · convidado por{" "}
                  <strong className="text-slate-700">{invite.senderName}</strong>
                </p>
              </div>

              <div className="h-px bg-divine-100" />

              {/* Not logged in */}
              {status === "unauthenticated" && (
                <div className="flex flex-col gap-3 text-center">
                  <p className="text-sm text-slate-500">
                    Entre na sua conta para aceitar o convite.
                  </p>
                  <Link
                    href={`/sign-in?callbackUrl=/entrar/${token}`}
                    className="btn-divine py-3 text-sm flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-4 h-4" />
                    Entrar na conta
                  </Link>
                  <Link href={`/sign-up?callbackUrl=/entrar/${token}`} className="text-sm text-gold-dark font-semibold hover:underline">
                    Criar conta grátis
                  </Link>
                </div>
              )}

              {/* Loading session */}
              {status === "loading" && (
                <div className="flex justify-center py-2">
                  <Loader2 className="w-5 h-5 text-gold animate-spin" />
                </div>
              )}

              {/* Logged in — join button */}
              {status === "authenticated" && (
                <div className="flex flex-col gap-3">
                  {joinError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600 font-medium text-center">{joinError}</p>
                    </div>
                  )}
                  <button
                    onClick={handleJoin}
                    disabled={joining}
                    className="btn-divine py-3.5 text-base disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {joining ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Entrando...</>
                    ) : (
                      <><Users className="w-5 h-5" /> Entrar na fraternidade</>
                    )}
                  </button>
                  <p className="text-xs text-center text-slate-400">
                    Entrando como <strong>{session.user?.name}</strong>
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
