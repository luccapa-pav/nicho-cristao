"use client";

import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface ShareStreakModalProps {
  open: boolean;
  onClose: () => void;
  days: number;
  verse?: string;
  verseRef?: string;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function ShareStreakModal({ open, onClose, days, verse, verseRef }: ShareStreakModalProps) {
  const { data: session } = useSession();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const v = verse || "Corramos com perseverança a corrida que nos é proposta.";
  const vRef = verseRef || "Hebreus 12:1";
  const userName = session?.user?.name?.split(" ")[0] || "";

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setImageUrl(null);

    const W = 1080;
    const H = 1080;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#120d02");
    bg.addColorStop(0.5, "#1e1504");
    bg.addColorStop(1, "#120d02");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Radial gold glow
    const glow = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, W * 0.55);
    glow.addColorStop(0, "rgba(212,175,55,0.22)");
    glow.addColorStop(1, "rgba(212,175,55,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Top border lines
    ctx.strokeStyle = "rgba(212,175,55,0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(60, 56); ctx.lineTo(W - 60, 56); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60, 64); ctx.lineTo(W - 60, 64); ctx.stroke();

    // App name
    ctx.textAlign = "center";
    ctx.font = "bold 46px Georgia, serif";
    ctx.fillStyle = "rgba(212,175,55,0.85)";
    ctx.fillText("LUZ DIVINA", W / 2, 130);

    // Tagline
    ctx.font = "italic 26px Georgia, serif";
    ctx.fillStyle = "rgba(255,245,200,0.4)";
    ctx.fillText("Caminhe com Deus todos os dias", W / 2, 168);

    // Flame emoji
    ctx.font = "130px serif";
    ctx.fillText("🔥", W / 2, 330);

    // Days number
    ctx.save();
    const numGrad = ctx.createLinearGradient(W / 2 - 220, 0, W / 2 + 220, 0);
    numGrad.addColorStop(0, "#907010");
    numGrad.addColorStop(0.5, "#F0D060");
    numGrad.addColorStop(1, "#907010");
    ctx.fillStyle = numGrad;
    ctx.font = `bold ${days >= 100 ? 195 : 240}px Georgia, serif`;
    ctx.shadowColor = "rgba(212,175,55,0.45)";
    ctx.shadowBlur = 50;
    ctx.fillText(String(days), W / 2, 580);
    ctx.restore();

    // "DIAS DE OFENSIVA"
    ctx.font = "bold 50px Georgia, serif";
    ctx.fillStyle = "#e8c969";
    ctx.fillText("DIAS DE OFENSIVA", W / 2, 650);

    // User name
    if (userName) {
      ctx.font = "32px Georgia, serif";
      ctx.fillStyle = "rgba(255,245,200,0.5)";
      ctx.fillText(userName, W / 2, 698);
    }

    // Verse card
    const vx = 70, vy = 726, vw = W - 140, vh = 218;
    roundRectPath(ctx, vx, vy, vw, vh, 24);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    ctx.strokeStyle = "rgba(212,175,55,0.28)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Verse text
    ctx.font = "italic 30px Georgia, serif";
    ctx.fillStyle = "rgba(255,245,200,0.88)";
    const lines = wrapText(ctx, `"${v}"`, vw - 80);
    const lineH = 44;
    const totalTextH = lines.length * lineH;
    let ty = vy + (vh - totalTextH - 38) / 2 + lineH;
    for (const line of lines) {
      ctx.fillText(line, W / 2, ty);
      ty += lineH;
    }

    ctx.font = "bold 26px Georgia, serif";
    ctx.fillStyle = "#D4AF37";
    ctx.fillText(`— ${vRef}`, W / 2, vy + vh - 26);

    // Bottom border lines
    ctx.strokeStyle = "rgba(212,175,55,0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(60, H - 66); ctx.lineTo(W - 60, H - 66); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(60, H - 58); ctx.lineTo(W - 60, H - 58); ctx.stroke();

    // URL
    ctx.font = "24px Georgia, serif";
    ctx.fillStyle = "rgba(212,175,55,0.35)";
    ctx.fillText("luz-divina.vercel.app", W / 2, H - 28);

    setImageUrl(canvas.toDataURL("image/jpeg", 0.92));
  }, [open, days, v, vRef, userName]);

  async function handleShare() {
    if (!imageUrl) return;
    setSharing(true);
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], `ofensiva-${days}-dias.jpg`, { type: "image/jpeg" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: `🔥 ${days} dias de ofensiva espiritual! "${v}" — ${vRef}`,
        });
      } else {
        handleDownload();
      }
    } catch {
      // cancelado pelo usuário
    } finally {
      setSharing(false);
    }
  }

  function handleDownload() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `ofensiva-${days}-dias.jpg`;
    a.click();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative max-w-xs w-full overflow-hidden rounded-3xl shadow-2xl"
            style={{ background: "#1a1203" }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <canvas ref={canvasRef} className="hidden" />

            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Card da sua ofensiva"
                className="w-full aspect-square object-cover block"
              />
            ) : (
              <div className="w-full aspect-square bg-gradient-to-br from-amber-950 to-amber-900 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div className="p-4 flex flex-col gap-3">
              <p className="text-sm text-center text-amber-200/60 font-medium">
                Salve e inspire outros na fé ✨
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleShare}
                  disabled={!imageUrl || sharing}
                  className="flex-1 btn-divine py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  {sharing ? "Compartilhando..." : "Compartilhar"}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!imageUrl}
                  className="w-12 py-3 rounded-xl border-2 border-gold/40 text-gold-dark font-semibold hover:bg-divine-50 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
