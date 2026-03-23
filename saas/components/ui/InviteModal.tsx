"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Users } from "lucide-react";

interface InviteModalProps {
  open: boolean;
  onClose: () => void;
  groupName: string;
  inviteToken: string;
}

export function InviteModal({ open, onClose, groupName, inviteToken }: InviteModalProps) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : "https://app.luzdivina.com"}/entrar/${inviteToken}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = inviteUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 bottom-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[380px] z-50"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          >
            <div
              className="divine-card p-6 flex flex-col gap-5 relative overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="invite-modal-title"
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.12) 0%, transparent 60%)" }}
              />
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold" />
                  <h2 id="invite-modal-title" className="font-serif text-base font-bold text-slate-800">Convidar para a Célula</h2>
                </div>
                <button onClick={onClose} aria-label="Fechar" className="w-7 h-7 rounded-full bg-divine-50 flex items-center justify-center text-slate-400 hover:bg-divine-100">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-sm text-slate-500 -mt-2">
                Compartilhe o link abaixo para convidar alguém para a <strong className="text-slate-700">{groupName}</strong>.
              </p>

              {/* Link */}
              <div className="flex items-center gap-2 bg-divine-50 border border-divine-200 rounded-2xl px-3 py-2.5">
                <p className="flex-1 text-xs text-slate-500 truncate font-mono">{inviteUrl}</p>
                <motion.button
                  onClick={copyLink}
                  className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                    copied ? "bg-emerald-100 text-emerald-600" : "bg-white border border-divine-200 text-slate-400 hover:border-gold"
                  }`}
                  whileTap={{ scale: 0.85 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={copied ? "check" : "copy"}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </motion.div>
                  </AnimatePresence>
                </motion.button>
              </div>

              {copied && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-center text-emerald-600 font-medium -mt-2"
                >
                  ✓ Link copiado!
                </motion.p>
              )}

              <button onClick={copyLink} className="btn-divine py-3 text-sm">
                <Copy className="w-4 h-4" />
                Copiar link de convite
              </button>

              <p className="text-[10px] text-center text-slate-300">
                O link expira em 7 dias. Grupo aceita até 12 membros.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
