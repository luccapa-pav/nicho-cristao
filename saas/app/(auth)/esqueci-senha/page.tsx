"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao enviar email."); return; }
      setSent(true);
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
          <p className="text-sm text-slate-400 mt-1">Recuperar senha</p>
        </div>

        {sent ? (
          <div className="divine-card p-6 flex flex-col items-center gap-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <h2 className="font-semibold text-slate-800 text-lg">Email enviado!</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Se existe uma conta com esse email, você receberá um link para redefinir sua senha em breve. Verifique também sua caixa de spam.
            </p>
            <Link href="/sign-in" className="text-gold-dark font-semibold text-sm hover:underline flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Voltar ao login
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="divine-card p-6 flex flex-col gap-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Digite o email da sua conta e enviaremos um link para você criar uma nova senha.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="px-4 py-2.5 rounded-2xl border border-amber-100 bg-white text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
                />
              </div>

              {error && <p className="text-xs text-red-500 text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-divine py-3 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link de recuperação"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400 mt-4">
              <Link href="/sign-in" className="text-gold-dark font-semibold hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Voltar ao login
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
