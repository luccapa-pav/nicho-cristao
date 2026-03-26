"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6)  { setError("Senha deve ter pelo menos 6 caracteres."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao redefinir senha."); return; }
      setDone(true);
      setTimeout(() => router.push("/sign-in"), 3000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFEF9] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine mb-3">
            <span className="text-white text-2xl">✝</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">Vida com Jesus</h1>
          <p className="text-sm text-slate-400 mt-1">Nova senha</p>
        </div>

        {done ? (
          <div className="divine-card p-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <h2 className="font-semibold text-slate-800 text-lg">Senha redefinida!</h2>
            <p className="text-sm text-slate-500">Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="divine-card p-6 flex flex-col gap-4">
            <p className="text-sm text-slate-500">Crie uma nova senha para sua conta.</p>

            {[
              { label: "Nova senha", value: password, set: setPassword, show: showPw, toggle: () => setShowPw((v) => !v) },
              { label: "Confirmar senha", value: confirm, set: setConfirm, show: showPw, toggle: undefined },
            ].map(({ label, value, set, show, toggle }) => (
              <div key={label} className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 rounded-2xl border border-amber-100 bg-white text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold pr-10"
                  />
                  {toggle && (
                    <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            {error && <p className="text-xs text-red-500 text-center">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-divine py-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar nova senha"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-400 mt-4">
          <Link href="/sign-in" className="text-gold-dark font-semibold hover:underline">
            Voltar ao login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
