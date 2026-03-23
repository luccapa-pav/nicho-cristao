"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFEF9] px-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine">
            <span className="text-white text-3xl">✝</span>
          </div>
        </div>
        <h2 className="font-serif text-xl font-semibold text-slate-800 mb-3">Algo deu errado</h2>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          Ocorreu um erro inesperado. Nossa equipe foi notificada. Tente novamente ou volte ao início.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button onClick={reset} className="btn-divine py-3 px-8 flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Tentar novamente
          </button>
          <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
