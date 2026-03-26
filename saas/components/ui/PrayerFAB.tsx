"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export function PrayerFAB() {
  const pathname = usePathname();
  // Não mostrar na oração (destino) nem no dashboard (já tem ações de oração)
  if (pathname === "/oracao" || pathname === "/inicio") return null;

  return (
    <Link href="/oracao" aria-label="Orar agora">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 md:bottom-8 md:right-8 z-40
                   w-16 h-16 rounded-full
                   bg-gradient-to-br from-gold to-gold-dark
                   shadow-[0_4px_24px_rgba(212,175,55,0.45)]
                   flex flex-col items-center justify-center gap-0.5
                   cursor-pointer select-none"
      >
        <span className="text-2xl leading-none">🙏</span>
        <span className="text-white text-[9px] font-bold tracking-wide leading-none">ORAR</span>
      </motion.div>
    </Link>
  );
}
