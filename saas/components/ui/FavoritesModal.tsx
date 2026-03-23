"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Trash2 } from "lucide-react";

interface FavVerse {
  verse: string;
  reference: string;
  date: string;
}

interface FavoritesModalProps {
  onClose: () => void;
}

export function FavoritesModal({ onClose }: FavoritesModalProps) {
  const [favs, setFavs] = useState<FavVerse[]>(() => {
    try { return JSON.parse(localStorage.getItem("fav-verses") ?? "[]"); } catch { return []; }
  });

  const remove = (idx: number) => {
    const next = favs.filter((_, i) => i !== idx);
    setFavs(next);
    localStorage.setItem("fav-verses", JSON.stringify(next));
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative divine-card w-full max-w-md mx-4 mb-4 md:mb-0 p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto custom-scroll"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gold fill-gold" />
              <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">
                Versículos Favoritos
              </p>
            </div>
            <button onClick={onClose} className="p-1 text-slate-300 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {favs.length === 0 ? (
            <div className="text-center py-8 text-slate-300">
              <p className="text-3xl mb-2">⭐</p>
              <p className="text-sm">Nenhum versículo favorito ainda.</p>
              <p className="text-xs mt-1">Toque a estrela em qualquer versículo para salvar.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {favs.map((fav, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-divine-100 bg-amber-50/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-serif leading-relaxed italic">"{fav.verse}"</p>
                    <p className="text-xs font-semibold text-gold-dark mt-1">— {fav.reference}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{fav.date}</p>
                  </div>
                  <button
                    onClick={() => remove(i)}
                    aria-label="Remover favorito"
                    className="flex-shrink-0 p-1 text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
