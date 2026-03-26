"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, CheckCircle2 } from "lucide-react";

interface LordsPrayerGuideProps {
  onClose: () => void;
}

const STEPS = [
  {
    phrase: "Pai nosso que estás no céu, santificado seja o Teu nome",
    title: "Adoração",
    icon: "✨",
    guide: "Ore adorando a Deus por quem Ele é. Fale sobre Seus atributos — amor, fidelidade, poder.",
    suggestion: "Senhor, eu Te adoro por...",
    verse: "\"Santo, Santo, Santo é o Senhor dos Exércitos.\" — Is 6:3",
  },
  {
    phrase: "Venha o Teu reino, seja feita a Tua vontade",
    title: "Entrega",
    icon: "🕊️",
    guide: "Submeta seus planos e situações à vontade de Deus. Entregue o que está em suas mãos.",
    suggestion: "Senhor, entrego a situação de... e peço que Tua vontade seja feita.",
    verse: "\"Não se faça a minha vontade, mas a Tua.\" — Lc 22:42",
  },
  {
    phrase: "O pão nosso de cada dia nos dá hoje",
    title: "Provisão",
    icon: "🌾",
    guide: "Peça a Deus a provisão material e espiritual de que você precisa hoje.",
    suggestion: "Senhor, provê para... Sustenta minha família em...",
    verse: "\"O meu Deus, segundo as suas riquezas em glória, suprirá todas as vossas necessidades.\" — Fp 4:19",
  },
  {
    phrase: "Perdoa as nossas dívidas assim como perdoamos os nossos devedores",
    title: "Perdão",
    icon: "💛",
    guide: "Confesse seus pecados a Deus e declare perdão às pessoas que te magoaram.",
    suggestion: "Senhor, me perdoa por... E eu perdoo a... pelo que fez.",
    verse: "\"Perdoai-vos uns aos outros, assim como Deus em Cristo vos perdoou.\" — Ef 4:32",
  },
  {
    phrase: "Não nos deixes cair em tentação",
    title: "Proteção",
    icon: "🛡️",
    guide: "Peça guarida e direção divina. Declare proteção sobre sua família e sua mente.",
    suggestion: "Senhor, me guarda contra... Cobre minha mente e minha família com Teu sangue.",
    verse: "\"O Senhor te guardará de todo o mal; guardará a tua alma.\" — Sl 121:7",
  },
  {
    phrase: "Livra-nos do mal",
    title: "Intercessão",
    icon: "🙏",
    guide: "Ore por outras pessoas que estão em necessidade — família, amigos, sua cidade.",
    suggestion: "Senhor, intercedo por... Livra-os de...",
    verse: "\"Orai uns pelos outros para que sareis.\" — Tg 5:16",
  },
  {
    phrase: "Pois Teu é o reino, o poder e a glória para sempre",
    title: "Louvor Final",
    icon: "👑",
    guide: "Encerre sua oração com gratidão e louvor. Declare a soberania de Deus sobre tudo.",
    suggestion: "Senhor, obrigado por... Toda glória seja Tua!",
    verse: "\"De ti procedem a riqueza e a honra.\" — 1 Cr 29:12",
  },
];

export function LordsPrayerGuide({ onClose }: LordsPrayerGuideProps) {
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState<boolean[]>(new Array(STEPS.length).fill(false));
  const [done, setDone] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const markAndAdvance = () => {
    const next = [...completed];
    next[step] = true;
    setCompleted(next);
    if (isLast) {
      setDone(true);
    } else {
      setStep((s) => s + 1);
    }
  };

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-full max-w-md divine-card p-8 text-center flex flex-col items-center gap-4"
        >
          <span className="text-5xl">🙌</span>
          <h2 className="font-serif text-2xl font-bold text-slate-800">Amém!</h2>
          <p className="text-base text-slate-600">Você completou o Pai Nosso. Que Deus honre cada palavra da sua oração.</p>
          <p className="text-sm italic text-gold-dark">&ldquo;A oração eficaz do justo pode muito.&rdquo; — Tg 5:16</p>
          <button onClick={onClose} className="btn-divine py-3 px-8 text-base mt-2">
            Fechar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-md divine-card p-6 flex flex-col gap-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-dark">Pai Nosso Guiado</p>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-divine-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`transition-all rounded-full ${
                i === step ? "w-6 h-2.5 bg-gold" : completed[i] ? "w-2.5 h-2.5 bg-gold/50" : "w-2.5 h-2.5 bg-divine-200"
              }`}
              aria-label={`Ir para etapa ${i + 1}`}
            />
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-4"
          >
            {/* Phrase */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-divine-50 border border-gold/20 p-4 text-center">
              <span className="text-3xl block mb-2">{current.icon}</span>
              <p className="text-xs font-bold uppercase tracking-widest text-gold-dark mb-1">{current.title}</p>
              <p className="font-serif text-base italic text-slate-700 leading-relaxed">
                &ldquo;{current.phrase}&rdquo;
              </p>
            </div>

            {/* Guide */}
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-600 leading-relaxed">{current.guide}</p>
              <div className="rounded-xl border border-divine-200 bg-divine-50/50 px-4 py-3">
                <p className="text-xs font-semibold text-gold-dark mb-1">Sugestão para começar:</p>
                <p className="text-sm text-slate-600 italic">{current.suggestion}</p>
              </div>
              <p className="text-xs text-slate-400 italic text-center">{current.verse}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-1">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 px-4 py-3 rounded-xl border border-divine-200 text-sm font-semibold text-slate-500 hover:bg-divine-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Voltar
            </button>
          )}
          <button
            onClick={markAndAdvance}
            className="flex-1 btn-divine py-3 text-sm flex items-center justify-center gap-2"
          >
            {isLast ? (
              <><CheckCircle2 className="w-4 h-4" /> Concluir oração</>
            ) : (
              <>Próximo <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          Etapa {step + 1} de {STEPS.length}
        </p>
      </motion.div>
    </div>
  );
}
