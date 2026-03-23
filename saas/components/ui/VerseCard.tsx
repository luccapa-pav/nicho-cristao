"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, Share2, Star } from "lucide-react";
import { FavoritesModal } from "./FavoritesModal";

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
  const [favorited, setFavorited] = useState(() => getFavs().some((f) => f.reference === reference && f.verse === verse));
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
        className="divine-card p-8 relative overflow-hidden h-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Brilho decorativo de fundo */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(212,175,55,0.08) 0%, transparent 60%)" }}
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
            <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
              Versículo do Dia
            </p>
            {theme && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-divine-100 text-gold-dark text-xs font-bold uppercase tracking-widest">
                {theme}
              </span>
            )}
          </div>
          {/* Favoritar */}
          <div className="ml-auto flex items-center gap-1.5">
            {getFavs().length > 0 && (
              <button
                onClick={() => setShowFavs(true)}
                className="text-xs text-slate-400 hover:text-gold-dark transition-colors"
                aria-label="Ver favoritos"
              >
                Meus favoritos
              </button>
            )}
            <button
              onClick={toggleFav}
              aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
              className="p-1 transition-all hover:scale-110"
            >
              <Star className={`w-4 h-4 transition-all ${favorited ? "fill-gold text-gold" : "text-slate-300 hover:text-gold"}`} />
            </button>
          </div>
        </div>

        {/* Versículo */}
        <motion.blockquote
          className="verse-highlight text-2xl leading-loose text-slate-700 font-serif mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {'\u201C'}{verse}{'\u201D'}
        </motion.blockquote>

        {/* Referência e ação */}
        <div className="flex items-center justify-between">
          <motion.span
            className="text-lg font-semibold text-gold-dark"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            — {reference}
          </motion.span>
          <button
            className="btn-ghost-divine py-1.5 px-3 text-xs gap-1"
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
