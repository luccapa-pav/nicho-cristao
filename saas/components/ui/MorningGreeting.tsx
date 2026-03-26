"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";
import { useSession } from "next-auth/react";

const VERSES = [
  { verse: "Este é o dia que o Senhor fez; alegremo-nos e nos regozijemos nele.", ref: "Salmos 118:24" },
  { verse: "As misericórdias do Senhor se renovam a cada manhã. Grande é a tua fidelidade.", ref: "Lamentações 3:23" },
  { verse: "De manhã cedo me levantarei a buscar-te; pois tu és o meu Deus.", ref: "Salmos 63:1" },
  { verse: "Pela manhã, faze-me ouvir a tua benignidade, porque em ti confio.", ref: "Salmos 143:8" },
  { verse: "Espera no Senhor; tem bom ânimo, e ele fortalecerá o teu coração.", ref: "Salmos 27:14" },
  { verse: "A ti clamarei, ó Senhor, minha rocha. Não te cales para mim.", ref: "Salmos 28:1" },
  { verse: "Clama a mim e responder-te-ei, e anunciar-te-ei coisas grandes e ocultas.", ref: "Jeremias 33:3" },
];

export function MorningGreeting() {
  const { data: session } = useSession();
  const [visible, setVisible] = useState(false);
  const firstName = (session?.user?.name ?? "").split(" ")[0];

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5 || hour >= 12) return;

    const today = new Date().toISOString().slice(0, 10);
    const key = `viver-morning-${today}`;
    if (localStorage.getItem(key)) return;

    setVisible(true);
  }, []);

  const verse = VERSES[new Date().getDay() % VERSES.length];

  function dismiss() {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(`viver-morning-${today}`, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.35 }}
          className="divine-card p-6 mb-2 relative overflow-hidden border-gold/40"
          style={{ boxShadow: "0 0 40px rgba(212,175,55,0.12), 0 4px 16px rgba(212,175,55,0.08)" }}
        >
          {/* Glow de fundo */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 70%)" }} />

          <button
            onClick={dismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full text-slate-300 hover:text-slate-500 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative">
            <p className="font-serif text-lg sm:text-xl text-slate-700 italic leading-relaxed">
              &ldquo;{verse.verse}&rdquo;
            </p>
            <p className="text-sm font-semibold text-gold-dark mt-1.5">— {verse.ref}</p>

            <Link href="/oracao" onClick={dismiss}>
              <button className="btn-divine w-full mt-5 py-3.5 text-base flex items-center justify-center gap-2">
                🙏 Começar minha manhã com Deus
              </button>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
