"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Link2, Heart } from "lucide-react";

interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  streakDays: number;
  isOnline: boolean;
}

interface CellGroupProps {
  name: string;
  progress: number;  // 0-100
  members: Member[];
  onInvite: () => void;
  onPray: (memberId: string) => void;
}

function Avatar({ member }: { member: Member }) {
  const initials = member.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <div className="relative group">
      <div
        className="w-10 h-10 rounded-full bg-divine-100 flex items-center justify-center text-gold-dark text-xs font-bold shadow-sm ring-2 ring-white"
      >
        {member.avatarUrl ? (
          <Image src={member.avatarUrl} alt={member.name} width={40} height={40} className="w-full h-full rounded-full object-cover" />
        ) : (
          initials
        )}
      </div>
      {/* Indicador online */}
      {member.isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 status-dot-active" />
      )}
      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
        <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
          {member.name}
          {member.streakDays > 0 && (
            <span className="ml-1 text-amber-400">🔥{member.streakDays}</span>
          )}
        </div>
        <div className="w-2 h-2 bg-slate-800 rotate-45 -mt-1" />
      </div>
    </div>
  );
}

export function CellGroup({ name, progress, members, onInvite, onPray }: CellGroupProps) {
  const [prayedFor, setPrayedFor] = useState<Set<string>>(new Set());
  const [lightBurst, setLightBurst] = useState<string | null>(null);
  const slots = Array.from({ length: 12 });

  const handlePray = useCallback((memberId: string) => {
    if (prayedFor.has(memberId)) return;
    setLightBurst(memberId);
    setPrayedFor((prev) => new Set(prev).add(memberId));
    onPray(memberId);
    setTimeout(() => setLightBurst(null), 700);
  }, [prayedFor, onPray]);

  const nextMilestone = [25, 50, 75, 100].find((m) => m > progress) ?? 100;

  return (
    <div className="divine-card p-8 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-divine-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-gold-dark" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">Célula</p>
            <p className="font-serif text-sm font-medium text-slate-700">{name}</p>
          </div>
        </div>
        <span className="text-xs text-slate-400">{members.length}/12</span>
      </div>

      {/* Grid de avatares — 4×3 */}
      <div className="flex flex-wrap gap-2">
        {slots.map((_, i) => {
          const member = members[i];
          if (!member) {
            return (
              <div
                key={i}
                className="w-10 h-10 rounded-full border-2 border-dashed border-divine-200 flex items-center justify-center"
              >
                <span className="text-divine-300 text-lg">+</span>
              </div>
            );
          }
          return (
            <div key={member.id} className="relative">
              <Avatar member={member} />
              {/* Botão "Orei por isso" */}
              <motion.button
                onClick={() => handlePray(member.id)}
                disabled={prayedFor.has(member.id)}
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm transition-all relative before:absolute before:inset-[-8px] before:content-[''] ${
                  prayedFor.has(member.id)
                    ? "bg-gold scale-90"
                    : "bg-white border border-divine-200 hover:border-gold"
                }`}
                whileTap={{ scale: 0.8 }}
              >
                <Heart
                  className={`w-2.5 h-2.5 transition-all ${
                    prayedFor.has(member.id) ? "fill-white text-white" : "text-slate-300"
                  }`}
                />
              </motion.button>

              {/* Burst de luz ao orar */}
              <AnimatePresence>
                {lightBurst === member.id && (
                  <motion.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: "radial-gradient(circle, rgba(255,215,0,0.8) 0%, transparent 70%)" }}
                    initial={{ scale: 0.5, opacity: 1 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  />
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Progresso coletivo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Progresso coletivo</span>
          <span className="text-gold-dark font-bold">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-divine-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{
              background: "linear-gradient(90deg, #D4AF37, #F0D060, #D4AF37)",
              backgroundSize: "200% 100%",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.4 }}
          >
            {/* Shimmer */}
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)" }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
        <p className="text-[10px] text-slate-400 text-right">
          {Math.round((progress / 100) * members.length)}/{members.length} membros completaram hoje
        </p>
      </div>

      {/* Botão convidar */}
      <button onClick={onInvite} className="btn-ghost-divine w-full text-sm">
        <Link2 className="w-3.5 h-3.5" />
        Convidar para a célula
      </button>

      {/* Legenda */}
      {prayedFor.size > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-center text-slate-400"
        >
          Você orou por {prayedFor.size}{" "}
          {prayedFor.size === 1 ? "pessoa" : "pessoas"} hoje 🙏
        </motion.p>
      )}
    </div>
  );
}
