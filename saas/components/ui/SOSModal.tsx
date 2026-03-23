"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Heart, MessageCircle, Shield } from "lucide-react";

const SOS_VERSES = [
  { verse: "Não temas, porque eu sou contigo; não te assombres, porque eu sou o teu Deus.", ref: "Isaías 41:10" },
  { verse: "O Senhor é o meu pastor; nada me faltará.", ref: "Salmos 23:1" },
  { verse: "Tudo posso naquele que me fortalece.", ref: "Filipenses 4:13" },
  { verse: "Lançando sobre ele toda a vossa ansiedade, porque ele tem cuidado de vós.", ref: "1 Pedro 5:7" },
  { verse: "Porque eu sei os planos que tenho para vocês... planos de fazê-los prosperar e não de causar dano.", ref: "Jeremias 29:11" },
];

interface SOSModalProps {
  open: boolean;
  onClose: () => void;
}

export function SOSModal({ open, onClose }: SOSModalProps) {
  const [verse] = useState(() => SOS_VERSES[Math.floor(Math.random() * SOS_VERSES.length)]);
  const [breathePhase, setBreathePhase] = useState<"inhale" | "hold" | "exhale" | null>(null);
  const [breatheCount, setBreatheCount] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Limpa todos os timeouts pendentes quando o modal fecha ou desmonta
  useEffect(() => {
    if (!open) {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      setBreathePhase(null);
      setBreatheCount(0);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const startBreathing = () => {
    let count = 0;
    setBreathePhase("inhale");

    const cycle = () => {
      setBreathePhase("inhale");
      const t1 = setTimeout(() => {
        setBreathePhase("hold");
        const t2 = setTimeout(() => {
          setBreathePhase("exhale");
          const t3 = setTimeout(() => {
            count++;
            setBreatheCount(count);
            if (count < 3) cycle();
            else setBreathePhase(null);
          }, 4000);
          timeoutsRef.current.push(t3);
        }, 4000);
        timeoutsRef.current.push(t2);
      }, 4000);
      timeoutsRef.current.push(t1);
    };
    cycle();
  };

  const breatheText: Record<string, string> = {
    inhale: "Inspire... (4s)",
    hold: "Segure... (4s)",
    exhale: "Expire... (4s)",
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[420px] z-50"
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="divine-card p-6 flex flex-col gap-5 relative overflow-hidden">
              {/* Brilho de fundo */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.1) 0%, transparent 60%)" }}
              />

              {/* Close */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gold" />
                  <h2 className="font-serif text-lg font-bold text-slate-800">SOS Bíblico</h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-divine-50 flex items-center justify-center text-slate-400 hover:bg-divine-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm text-slate-500 -mt-2">
                Você não está sozinho. Respire fundo e receba uma palavra de Deus.
              </p>

              {/* Versículo */}
              <div className="divine-card p-4 border-gold/20">
                <div className="flex gap-2 items-start">
                  <BookOpen className="w-4 h-4 text-gold mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-serif italic text-slate-700 leading-relaxed">
                      "{verse.verse}"
                    </p>
                    <p className="text-xs font-semibold text-gold-dark mt-2">— {verse.ref}</p>
                  </div>
                </div>
              </div>

              {/* Exercício de respiração */}
              <div className="flex flex-col items-center gap-3">
                {breathePhase ? (
                  <>
                    <motion.div
                      className="w-20 h-20 rounded-full border-4 border-gold/30 flex items-center justify-center relative"
                      animate={{
                        scale: breathePhase === "inhale" ? 1.3 : breathePhase === "hold" ? 1.3 : 1,
                        borderColor: breathePhase === "exhale" ? "rgba(212,175,55,0.6)" : "rgba(212,175,55,0.3)",
                      }}
                      transition={{ duration: 4, ease: "easeInOut" }}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-full bg-gold/10"
                        animate={{ scale: breathePhase === "inhale" ? 1 : 0.7 }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                      />
                      <span className="text-2xl z-10">🕊️</span>
                    </motion.div>
                    <p className="text-sm font-medium text-gold-dark animate-pulse">
                      {breathePhase ? breatheText[breathePhase] : ""}
                    </p>
                    <p className="text-xs text-slate-400">Ciclo {breatheCount + 1}/3</p>
                  </>
                ) : (
                  <button
                    onClick={startBreathing}
                    className="flex items-center gap-2 text-sm text-gold-dark hover:text-gold transition-colors font-medium"
                  >
                    <Heart className="w-4 h-4" />
                    Exercício de respiração guiada
                  </button>
                )}
              </div>

              {/* Ações rápidas */}
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-ghost-divine text-xs py-2 justify-center">
                  <MessageCircle className="w-3.5 h-3.5" />
                  Pedir oração à célula
                </button>
                <button className="btn-divine text-xs py-2">
                  <BookOpen className="w-3.5 h-3.5" />
                  Ler salmos
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
