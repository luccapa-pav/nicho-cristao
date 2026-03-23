"use client";

import { motion } from "framer-motion";
import { BookOpen, Share2 } from "lucide-react";

interface VerseCardProps {
  verse: string;
  reference: string;
  theme?: string;
}

export function VerseCard({ verse, reference, theme }: VerseCardProps) {
  return (
    <motion.div
      className="divine-card p-8 relative overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Brilho decorativo de fundo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.08) 0%, transparent 60%)",
        }}
      />

      {/* Cruz decorativa sutil */}
      <div className="absolute top-4 right-4 opacity-[0.04] select-none pointer-events-none">
        <span className="text-7xl font-serif text-gold">✝</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-divine-100 flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-gold-dark" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">
            Versículo do Dia
          </p>
          {theme && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-divine-100 text-gold-dark text-[9px] font-bold uppercase tracking-widest">
              {theme}
            </span>
          )}
        </div>
      </div>

      {/* Versículo */}
      <motion.blockquote
        className="verse-highlight text-lg leading-loose text-slate-700 font-serif mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        {'\u201C'}{verse}{'\u201D'}
      </motion.blockquote>

      {/* Referência e ação */}
      <div className="flex items-center justify-between">
        <motion.span
          className="text-sm font-semibold text-gold-dark"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          — {reference}
        </motion.span>
        <button className="btn-ghost-divine py-1.5 px-3 text-xs gap-1">
          <Share2 className="w-3 h-3" />
          Compartilhar
        </button>
      </div>
    </motion.div>
  );
}
