"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, Share2, Star } from "lucide-react";
import { FavoritesModal } from "./FavoritesModal";

function CrownOfThorns({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 220" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      {/* ── Galho inferior do anel ── */}
      <path d="M30 118 Q75 148 150 150 Q225 148 270 118"
        stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none"/>
      {/* ── Galho superior do anel ── */}
      <path d="M30 102 Q75 72 150 70 Q225 72 270 102"
        stroke="currentColor" strokeWidth="9" strokeLinecap="round" fill="none"/>
      {/* ── Galho médio entrelaçado (textura) ── */}
      <path d="M38 110 Q90 92 150 90 Q210 92 262 110 Q210 128 150 130 Q90 128 38 110Z"
        stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" fill="none" strokeOpacity="0.45"/>
      {/* ── Fibras de cipó cruzando ── */}
      <path d="M55 88 Q80 105 105 95 Q130 85 155 100 Q180 115 210 98 Q235 86 255 100"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.3"/>
      <path d="M50 122 Q80 108 115 118 Q145 128 175 115 Q205 102 250 118"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" strokeOpacity="0.3"/>
      {/* ── Nós dos galhos ── */}
      <ellipse cx="80" cy="78" rx="5" ry="3.5" fill="currentColor" fillOpacity="0.35"/>
      <ellipse cx="150" cy="70" rx="6" ry="4" fill="currentColor" fillOpacity="0.35"/>
      <ellipse cx="220" cy="78" rx="5" ry="3.5" fill="currentColor" fillOpacity="0.35"/>
      <ellipse cx="260" cy="100" rx="4" ry="5" fill="currentColor" fillOpacity="0.35"/>
      <ellipse cx="40" cy="100" rx="4" ry="5" fill="currentColor" fillOpacity="0.35"/>
      <ellipse cx="80" cy="142" rx="5" ry="3.5" fill="currentColor" fillOpacity="0.35"/>
      <ellipse cx="150" cy="150" rx="6" ry="4" fill="currentColor" fillOpacity="0.35"/>
      <ellipse cx="220" cy="142" rx="5" ry="3.5" fill="currentColor" fillOpacity="0.35"/>

      {/* ══ ESPINHOS — topo (apontando para cima/fora) ══ */}
      {/* Centro topo */}
      <path d="M147 70 L144 38 L150 68 L156 38 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Topo direita 1 */}
      <path d="M174 74 L174 42 L179 72 L184 43 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Topo direita 2 */}
      <path d="M200 82 L204 51 L207 80 L213 52 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Topo direita 3 */}
      <path d="M224 95 L232 65 L233 93 L240 66 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Topo esquerda 1 */}
      <path d="M126 74 L116 42 L121 72 L126 43 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Topo esquerda 2 */}
      <path d="M100 82 L87 51 L93 80 L96 52 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Topo esquerda 3 */}
      <path d="M76 95 L60 65 L67 93 L68 66 Z" fill="currentColor" fillOpacity="0.85"/>

      {/* ══ ESPINHOS — lateral direita ══ */}
      <path d="M263 96 L292 86 L266 100 L294 108 Z" fill="currentColor" fillOpacity="0.85"/>
      <path d="M265 114 L296 110 L268 116 L297 124 Z" fill="currentColor" fillOpacity="0.85"/>

      {/* ══ ESPINHOS — lateral esquerda ══ */}
      <path d="M37 96 L8 86 L34 100 L6 108 Z" fill="currentColor" fillOpacity="0.85"/>
      <path d="M35 114 L4 110 L32 116 L3 124 Z" fill="currentColor" fillOpacity="0.85"/>

      {/* ══ ESPINHOS — base (apontando para baixo) ══ */}
      {/* Centro base */}
      <path d="M147 150 L144 182 L150 152 L156 182 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Base direita 1 */}
      <path d="M174 146 L174 178 L179 148 L184 177 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Base direita 2 */}
      <path d="M200 138 L204 169 L207 140 L213 168 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Base direita 3 */}
      <path d="M224 125 L232 155 L233 127 L240 154 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Base esquerda 1 */}
      <path d="M126 146 L116 178 L121 148 L126 177 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Base esquerda 2 */}
      <path d="M100 138 L87 169 L93 140 L96 168 Z" fill="currentColor" fillOpacity="0.85"/>
      {/* Base esquerda 3 */}
      <path d="M76 125 L60 155 L67 127 L68 154 Z" fill="currentColor" fillOpacity="0.85"/>

      {/* ── Espinhos menores intercalados (topo) ── */}
      <path d="M162 71 L161 50 L165 70 L168 50 Z" fill="currentColor" fillOpacity="0.65"/>
      <path d="M138 71 L134 50 L138 70 L141 51 Z" fill="currentColor" fillOpacity="0.65"/>
      <path d="M188 78 L190 57 L193 77 L197 58 Z" fill="currentColor" fillOpacity="0.65"/>
      <path d="M112 78 L103 58 L107 77 L110 58 Z" fill="currentColor" fillOpacity="0.65"/>
      {/* ── Espinhos menores intercalados (base) ── */}
      <path d="M162 149 L161 170 L165 150 L168 170 Z" fill="currentColor" fillOpacity="0.65"/>
      <path d="M138 149 L134 170 L138 150 L141 171 Z" fill="currentColor" fillOpacity="0.65"/>
      <path d="M188 142 L190 163 L193 143 L197 162 Z" fill="currentColor" fillOpacity="0.65"/>
      <path d="M112 142 L103 162 L107 143 L110 162 Z" fill="currentColor" fillOpacity="0.65"/>
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
