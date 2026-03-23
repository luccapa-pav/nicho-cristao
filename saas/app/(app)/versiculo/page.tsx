"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { PremiumGate } from "@/components/ui/PremiumGate";

function blankWords(verse: string, phase: 2 | 3 | 4): string {
  const words = verse.split(" ");
  return words.map((w, i) => {
    if (phase === 2) return i % 3 === 2 ? "___" : w;
    if (phase === 3) return i % 2 === 1 ? "___" : w;
    return i % 5 === 0 ? w : "___";
  }).join(" ");
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúüçñ\s]/gi, "").replace(/\s+/g, " ").trim();
}

function VersiculoContent() {
  const searchParams = useSearchParams();
  const verseParam = searchParams.get("verse") ?? "";
  const refParam = searchParams.get("ref") ?? "";

  const [phase, setPhase] = useState<1 | 2 | 3 | 4>(1);
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  const verseToMemorize = verseParam || "Porque Deus amou o mundo de tal maneira que deu o seu Filho unigênito, para que todo aquele que nele crê não pereça, mas tenha a vida eterna.";
  const reference = refParam || "João 3:16";

  const checkAnswer = () => {
    const correct = normalize(userInput) === normalize(verseToMemorize);
    setResult(correct ? "correct" : "wrong");
    if (correct && phase < 4) {
      setTimeout(() => { setPhase((p) => (p + 1) as 2 | 3 | 4); setResult(null); setUserInput(""); }, 1200);
    }
    if (correct && phase === 4) {
      const saved = JSON.parse(localStorage.getItem("memorized-verses") ?? "[]");
      const already = saved.find((v: { reference: string }) => v.reference === reference);
      if (!already) {
        saved.unshift({ reference, verse: verseToMemorize, completedAt: new Date().toISOString() });
        localStorage.setItem("memorized-verses", JSON.stringify(saved));
      }
    }
  };

  const restart = () => { setPhase(1); setUserInput(""); setResult(null); };

  return (
    <div className="w-full px-6 md:px-16 py-6 space-y-6 min-h-full relative z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-slate-900">Versículo do Coração</h1>
          <p className="text-xs text-slate-400">Memorize a Palavra passo a passo</p>
        </div>
      </div>

      <PremiumGate feature="Versículo do Coração — memorize versículos bíblicos de forma lúdica e progressiva.">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Phase indicator */}
          <div className="flex items-center gap-2">
            {([1, 2, 3, 4] as const).map((p) => (
              <div key={p} className={`flex-1 h-1.5 rounded-full transition-colors ${phase >= p ? "bg-gold" : "bg-divine-200"}`} />
            ))}
          </div>
          <p className="text-xs text-center text-slate-400 font-medium uppercase tracking-widest">
            {phase === 1 ? "Fase 1 — Leitura" : phase === 2 ? "Fase 2 — Primeiros blancos" : phase === 3 ? "Fase 3 — Mais difícil" : "Fase 4 — Memorizando!"}
          </p>

          <div className="divine-card p-6 space-y-5">
            <div>
              {phase === 1 ? (
                <p className="font-serif text-lg leading-relaxed text-slate-700">{verseToMemorize}</p>
              ) : (
                <p className="font-serif text-lg leading-relaxed text-slate-500">{blankWords(verseToMemorize, phase)}</p>
              )}
              <p className="text-sm font-semibold text-gold-dark mt-3">— {reference}</p>
            </div>

            {phase === 1 ? (
              <button onClick={() => setPhase(2)} className="btn-divine w-full py-3">
                Próxima fase →
              </button>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={userInput}
                  onChange={(e) => { setUserInput(e.target.value); setResult(null); }}
                  placeholder="Digite o versículo completo..."
                  className="w-full h-28 px-4 py-3 rounded-2xl border border-amber-100 bg-white text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 resize-none"
                />
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex items-center gap-2 text-sm font-semibold ${result === "correct" ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {result === "correct" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {result === "correct" ? (phase < 4 ? "Correto! Avançando..." : "Parabéns! Versículo memorizado! 🎉") : "Tente de novo — releia o versículo"}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex gap-2">
                  <button onClick={restart} className="p-2.5 rounded-xl border border-divine-200 text-slate-400 hover:text-slate-600 transition-colors">
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button onClick={checkAnswer} className="flex-1 btn-divine py-3 text-sm">
                    Verificar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </PremiumGate>
    </div>
  );
}

export default function VersiculoPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-20"><div className="w-6 h-6 rounded-full border-2 border-gold border-t-transparent animate-spin" /></div>}>
      <VersiculoContent />
    </Suspense>
  );
}
