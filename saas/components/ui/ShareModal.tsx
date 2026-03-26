"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Copy, Check, Share2 } from "lucide-react";
import { useState } from "react";

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  text: string;
  url?: string;
  title?: string;
}

const platforms = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    bg: "#E8FFF0",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    getUrl: (text: string, url: string) =>
      `https://wa.me/?text=${encodeURIComponent(url ? `${text}\n${url}` : text)}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    color: "#0088CC",
    bg: "#E3F4FF",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
    getUrl: (text: string, url: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url || window.location.origin)}&text=${encodeURIComponent(text)}`,
  },
  {
    key: "twitter",
    label: "X (Twitter)",
    color: "#000000",
    bg: "#F0F0F0",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    getUrl: (text: string, url: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(url ? `${text} ${url}` : text)}`,
  },
  {
    key: "facebook",
    label: "Facebook",
    color: "#1877F2",
    bg: "#E7F0FF",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    getUrl: (text: string, url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url || window.location.origin)}&quote=${encodeURIComponent(text)}`,
  },
  {
    key: "instagram",
    label: "Instagram",
    color: "#E1306C",
    bg: "#FFF0F5",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    copyOnly: true,
    getUrl: () => "",
  },
  {
    key: "tiktok",
    label: "TikTok",
    color: "#010101",
    bg: "#F5F5F5",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.19 8.19 0 0 0 4.79 1.52V6.75a4.85 4.85 0 0 1-1.02-.06z" />
      </svg>
    ),
    copyOnly: true,
    getUrl: () => "",
  },
];

export function ShareModal({ open, onClose, text, url = "", title = "Compartilhar" }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const content = url ? `${text}\n${url}` : text;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title, text, url: url || window.location.href });
    } catch {
      // user cancelled or not supported
    }
  }

  function handlePlatform(p: typeof platforms[0]) {
    if (p.copyOnly) {
      handleCopy();
      return;
    }
    const shareUrl = p.getUrl(text, url || window.location.origin);
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl pb-safe"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-zinc-700" />
            </div>

            <div className="px-5 pb-8 pt-3">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg font-semibold text-slate-800">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview text */}
              <div className="bg-divine-50 border border-divine-100 rounded-xl p-3 mb-5">
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{text}</p>
              </div>

              {/* Platform grid */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {platforms.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => handlePlatform(p)}
                    aria-label={`Compartilhar via ${p.label}`}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-active:scale-90 shadow-sm"
                      style={{ backgroundColor: p.bg, color: p.color }}
                    >
                      {p.icon}
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">{p.label}</span>
                  </button>
                ))}

                {/* Copy button */}
                <button
                  onClick={handleCopy}
                  aria-label="Copiar texto"
                  className="flex flex-col items-center gap-1.5 group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-active:scale-90 shadow-sm ${copied ? "bg-green-50" : "bg-slate-100"}`}>
                    {copied
                      ? <Check className="w-6 h-6 text-green-500" />
                      : <Copy className="w-6 h-6 text-slate-500" />
                    }
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">{copied ? "Copiado!" : "Copiar"}</span>
                </button>

                {/* Native share (mobile) */}
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    onClick={handleNativeShare}
                    aria-label="Mais opções de compartilhamento"
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center transition-transform group-active:scale-90 shadow-sm">
                      <Share2 className="w-6 h-6 text-amber-500" />
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Mais</span>
                  </button>
                )}
              </div>

              {/* Cancel button */}
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
