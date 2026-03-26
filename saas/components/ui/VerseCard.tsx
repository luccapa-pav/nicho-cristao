"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Share2, Star, Brain } from "lucide-react";
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

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
}

export function VerseCard({ verse, reference, theme }: VerseCardProps) {
  const [favorited, setFavorited] = useState(() =>
    getFavs().some((f) => f.reference === reference && f.verse === verse)
  );
  const [showFavs, setShowFavs] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  const generateImage = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const SIZE = 1080;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    bg.addColorStop(0, "#FFF9EE");
    bg.addColorStop(1, "#FEF3C7");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Gold border
    ctx.strokeStyle = "#D4AF37";
    ctx.lineWidth = 12;
    ctx.strokeRect(36, 36, SIZE - 72, SIZE - 72);

    // Inner border
    ctx.strokeStyle = "rgba(212,175,55,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(56, 56, SIZE - 112, SIZE - 112);

    // App name
    ctx.fillStyle = "#B8860B";
    ctx.font = "bold 36px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("Vida com Jesus", SIZE / 2, 120);

    // Decorative line
    ctx.strokeStyle = "rgba(212,175,55,0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(SIZE / 2 - 120, 140);
    ctx.lineTo(SIZE / 2 + 120, 140);
    ctx.stroke();

    // Quote mark
    ctx.fillStyle = "rgba(212,175,55,0.25)";
    ctx.font = "bold 200px Georgia, serif";
    ctx.textAlign = "left";
    ctx.fillText("\u201C", 80, 360);

    // Verse text
    ctx.fillStyle = "#1E293B";
    ctx.font = "italic 52px Georgia, serif";
    ctx.textAlign = "center";
    const finalY = wrapText(ctx, verse, SIZE / 2, 380, SIZE - 200, 76);

    // Reference
    ctx.fillStyle = "#B8860B";
    ctx.font = "bold 44px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(`\u2014 ${reference}`, SIZE / 2, Math.max(finalY + 40, 800));

    // Footer
    ctx.fillStyle = "rgba(184,134,11,0.5)";
    ctx.font = "28px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("\u2720 Compartilhado com amor pelo Vida com Jesus", SIZE / 2, SIZE - 80);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "versiculo.png", { type: "image/png" });
      try {
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: reference });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "versiculo-viver-com-jesus.png";
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch { /* cancelled */ }
    }, "image/png");
  }, [verse, reference]);

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} aria-hidden="true" />
      <motion.div
        className="divine-card p-4 relative overflow-hidden h-full flex flex-col"
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
        <div className="flex items-center justify-between mb-3 relative z-10">
          {/* espaçador espelha os botões à direita */}
          <div className="flex items-center gap-1 opacity-0 pointer-events-none" aria-hidden="true">
            <div className="min-h-[32px] min-w-[32px]" />
            <div className="min-h-[32px] min-w-[32px]" />
          </div>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-gold-dark" />
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold-dark leading-none">
                Versículo do Dia
              </p>
            </div>
            {theme && (
              <span className="text-[0.7rem] font-semibold text-slate-500 leading-none mt-0.5">
                {theme}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {getFavs().length > 0 && (
              <button
                onClick={() => setShowFavs(true)}
                className="text-[0.65rem] font-medium text-slate-400 hover:text-gold-dark transition-colors px-2 py-1.5 rounded-lg hover:bg-divine-50 min-h-[32px] flex items-center"
                aria-label="Ver favoritos"
              >
                ★
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

        <div className="divine-divider mb-3" />

        {/* ── CORPO — Zona de Leitura ── */}
        <div className="relative flex flex-col z-10">
          <span className="block font-serif text-4xl leading-none text-gold/20 select-none mb-1 -ml-1" aria-hidden="true">
            &ldquo;
          </span>
          <motion.blockquote
            className="verse-highlight text-lg leading-relaxed text-slate-700 font-serif px-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            {verse}
          </motion.blockquote>
          <span className="block font-serif text-4xl leading-none text-gold/20 select-none self-end mt-1 -mr-1" aria-hidden="true">
            &rdquo;
          </span>
        </div>

        <div className="flex items-center justify-center flex-1 max-h-16 pointer-events-none select-none mt-1">
          <Image src="/cross-crown.svg" alt="" width={80} height={80} className="opacity-15" aria-hidden="true" />
        </div>

        <div className="divine-divider mt-2 mb-2" />

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-between relative z-10">
          <motion.span
            className="text-sm font-semibold text-gold-dark tracking-wide whitespace-nowrap"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            — {reference}
          </motion.span>
          <div className="flex flex-col items-end gap-0.5">
            <button
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-gold-dark transition-colors py-1 px-2 rounded-lg hover:bg-divine-50 active:scale-95"
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

            <Link href={`/versiculo?verse=${encodeURIComponent(verse)}&ref=${encodeURIComponent(reference)}`}>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-gold-dark transition-colors py-1 px-2 rounded-lg hover:bg-divine-50 cursor-pointer">
                <Brain className="w-3 h-3" />
                Memorizar
              </span>
            </Link>
          </div>
        </div>
      </motion.div>

      {showFavs && <FavoritesModal onClose={() => setShowFavs(false)} />}
    </>
  );
}
