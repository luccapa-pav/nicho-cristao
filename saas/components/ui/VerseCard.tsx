"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, Share2, Star } from "lucide-react";
import { FavoritesModal } from "./FavoritesModal";

function CrownOfThorns({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* Anel externo da coroa */}
      <ellipse cx="100" cy="100" rx="68" ry="28" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
      {/* Anel interno — textura de cipó entrelaçado */}
      <ellipse cx="100" cy="100" rx="56" ry="20" stroke="currentColor" strokeWidth="2" strokeOpacity="0.35" strokeDasharray="8 5"/>
      {/* Nós da madeira */}
      <circle cx="100" cy="72" r="3" fill="currentColor" fillOpacity="0.3"/>
      <circle cx="152" cy="88" r="2.5" fill="currentColor" fillOpacity="0.3"/>
      <circle cx="48" cy="88" r="2.5" fill="currentColor" fillOpacity="0.3"/>
      <circle cx="148" cy="112" r="2.5" fill="currentColor" fillOpacity="0.3"/>
      <circle cx="52" cy="112" r="2.5" fill="currentColor" fillOpacity="0.3"/>
      <circle cx="100" cy="128" r="3" fill="currentColor" fillOpacity="0.3"/>

      {/* Espinhos — topo */}
      <path d="M100 72 L96 48 L100 68 L104 48 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M130 76 L124 52 L128 73 L133 53 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M70 76 L67 52 L72 73 L76 53 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M155 85 L150 62 L153 83 L158 63 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M45 85 L42 62 L47 83 L50 63 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M170 96 L168 73 L170 94 L174 74 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M30 96 L28 73 L30 94 L34 74 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>

      {/* Espinhos — base */}
      <path d="M100 128 L96 152 L100 132 L104 152 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M130 124 L128 148 L132 127 L136 148 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M70 124 L66 148 L70 127 L74 148 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M155 115 L154 138 L157 118 L162 138 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M45 115 L42 138 L46 118 L50 138 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M170 104 L172 127 L171 106 L176 126 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M30 104 L28 127 L30 107 L34 127 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>

      {/* Fibras entrelaçadas — textura do galho */}
      <path d="M32 88 Q66 80 100 80 Q134 80 168 88" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" fill="none"/>
      <path d="M32 112 Q66 120 100 120 Q134 120 168 112" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" fill="none"/>
    </svg>
  );
}

interface VerseCardProps {
  verse: string;
  reference: string;
  theme?: string;
}

interface FavVerse {
  verse: string;
  reference: string;
  date: string;
}

function getFavs(): FavVerse[] {
  try { return JSON.parse(localStorage.getItem("fav-verses") ?? "[]"); } catch { return []; }
}

export function VerseCard({ verse, reference, theme }: VerseCardProps) {
  const [favorited, setFavorited] = useState(() =>
    getFavs().some((f) => f.reference === reference && f.verse === verse)
  );
  const [showFavs, setShowFavs] = useState(false);

  const toggleFav = useCallback(() => {
    const favs = getFavs();
    if (favorited) {
      const next = favs.filter((f) => !(f.reference === reference && f.verse === verse));
      localStorage.setItem("fav-verses", JSON.stringify(next));
      setFavorited(false);
    } else {
      favs.unshift({ verse, reference, date: new Date().toLocaleDateString("pt-BR") });
      localStorage.setItem("fav-verses", JSON.stringify(favs));
      setFavorited(true);
    }
  }, [favorited, verse, reference]);

  return (
    <>
      <motion.div
        className="divine-card p-5 relative overflow-hidden h-full flex flex-col"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Brilho radial */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 10% 10%, rgba(212,175,55,0.07) 0%, transparent 55%)" }}
        />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20 shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-gold-dark" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-dark leading-none">
                Versículo do Dia
              </p>
              {theme && (
                <span className="text-[0.7rem] font-semibold text-slate-500 leading-none truncate mt-0.5">
                  {theme}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {getFavs().length > 0 && (
              <button
                onClick={() => setShowFavs(true)}
                className="text-[0.65rem] font-medium text-slate-400 hover:text-gold-dark transition-colors px-2 py-1.5 rounded-lg hover:bg-divine-50 min-h-[32px] flex items-center"
                aria-label="Ver favoritos"
              >
                Meus favoritos
              </button>
            )}
            <button
              onClick={toggleFav}
              aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              className="p-1.5 rounded-lg hover:bg-divine-100 transition-all hover:scale-110 active:scale-95 min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <Star className={`w-4 h-4 transition-all ${favorited ? "fill-gold text-gold" : "text-slate-300 hover:text-gold"}`} />
            </button>
          </div>
        </div>

        <div className="divine-divider mb-4" />

        {/* ── CORPO — Zona de Leitura ── */}
        <div className="relative flex flex-col z-10">
          <span className="block font-serif text-5xl leading-none text-gold/20 select-none mb-1 -ml-1" aria-hidden="true">
            &ldquo;
          </span>
          <motion.blockquote
            className="verse-highlight text-xl leading-relaxed text-slate-700 font-serif px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {verse}
          </motion.blockquote>
          <span className="block font-serif text-5xl leading-none text-gold/20 select-none self-end mt-1 -mr-1" aria-hidden="true">
            &rdquo;
          </span>
        </div>

        {/* ── FILLER: coroa de espinhos (só desktop, preenche espaço livre) ── */}
        <div className="hidden lg:flex items-center justify-center flex-1 max-h-32 pointer-events-none select-none mt-2">
          <CrownOfThorns className="w-full max-w-[160px] h-auto text-amber-900/[0.13]" />
        </div>

        <div className="divine-divider mt-4 mb-3" />

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-between relative z-10">
          <motion.span
            className="text-sm font-semibold text-gold-dark tracking-wide"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            — {reference}
          </motion.span>
          <button
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-gold-dark transition-colors py-1.5 px-2 rounded-lg hover:bg-divine-50 active:scale-95 min-h-[32px]"
            aria-label="Compartilhar versículo"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ text: `"${verse}" — ${reference}` }).catch(() => {});
              } else {
                navigator.clipboard.writeText(`"${verse}" — ${reference}`).catch(() => {});
              }
            }}
          >
            <Share2 className="w-3 h-3" />
            Compartilhar
          </button>
        </div>
      </motion.div>

      {showFavs && <FavoritesModal onClose={() => setShowFavs(false)} />}
    </>
  );
}
