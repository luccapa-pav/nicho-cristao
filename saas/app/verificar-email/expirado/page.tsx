"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";

export default function VerificacaoExpiradaPage() {
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setLoading(true);
    try {
      await fetch("/api/auth/resend-verification", { method: "POST" });
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFEF9] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine mb-3">
            <span className="text-white text-2xl">✝</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">Luz Divina</h1>
        </div>
        <div className="divine-card p-8 flex flex-col items-center gap-4">
          <AlertCircle className="w-14 h-14 text-amber-400" />
          <h2 className="font-serif text-xl font-bold text-slate-800">Link expirado</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Este link de verificação já expirou ou foi usado. Faça login e solicite um novo email de verificação.
          </p>
          {sent ? (
            <p className="text-sm text-green-600 font-medium">Novo email enviado! Verifique sua caixa de entrada.</p>
          ) : (
            <button
              onClick={handleResend}
              disabled={loading}
              className="btn-divine py-3 px-8 mt-2 disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reenviar email"}
            </button>
          )}
          <Link href="/sign-in" className="text-sm text-gold-dark hover:underline">
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
