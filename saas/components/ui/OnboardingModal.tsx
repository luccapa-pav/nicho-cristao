"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const STORAGE_KEY = "luzDivina_onboarded";

const FEATURES = [
  {
    icon: "🙏",
    title: "Diário de Oração",
    desc: "Registre pedidos, marque as graças recebidas e ore com sua fraternidade.",
    href: "/oracao",
  },
  {
    icon: "📖",
    title: "Devocional Diário",
    desc: "Uma cápsula de áudio + versículo toda manhã para começar o dia com Deus.",
    href: "/devocional",
  },
  {
    icon: "🔥",
    title: "Ofensiva Diária",
    desc: "Mantenha sua sequência de dias fiéis. Cada check-in conta!",
    href: "/dashboard",
  },
  {
    icon: "👥",
    title: "Fraternidade",
    desc: "Ore e cresça junto com seu grupo. Partilhe gratidão no feed.",
    href: "/fraternidade",
  },
];

export function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Pequeno delay para não bloquear o carregamento inicial
    const t = setTimeout(() => {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-0 inset-x-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-md w-full z-50 px-0 md:px-0"
          >
            <div
              className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden"
              style={{ boxShadow: "0 0 80px rgba(212,175,55,0.18), 0 8px 40px rgba(0,0,0,0.18)" }}
            >
              {/* Header dourado */}
              <div className="relative bg-gradient-to-br from-divine-50 via-amber-50/60 to-divine-100/50 px-6 pt-7 pb-5 text-center">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.22) 0%, transparent 70%)" }}
                />
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="relative text-5xl mb-3 select-none"
                >
                  🙏
                </motion.div>
                <h2 className="relative font-serif text-2xl font-bold text-slate-800 leading-tight">
                  Bem-vindo ao Luz Divina
                </h2>
                <p className="relative text-sm text-slate-500 mt-1">
                  Sua jornada espiritual começa agora
                </p>
              </div>

              {/* Features */}
              <div className="px-5 pt-4 pb-2 grid grid-cols-2 gap-3">
                {FEATURES.map(({ icon, title, desc }) => (
                  <div
                    key={title}
                    className="rounded-2xl bg-divine-50/60 border border-divine-100 p-3.5 flex flex-col gap-1.5"
                  >
                    <span className="text-2xl leading-none">{icon}</span>
                    <p className="text-sm font-bold text-slate-700 leading-tight">{title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-5 pt-3 pb-6 flex flex-col gap-2" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" }}>
                <Link href="/dashboard" onClick={dismiss} className="w-full">
                  <button className="btn-divine py-4 text-base w-full flex items-center justify-center gap-2 font-bold">
                    ✦ Começar minha jornada
                  </button>
                </Link>
                <button
                  onClick={dismiss}
                  className="text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
                >
                  Já conheço o app — pular
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
