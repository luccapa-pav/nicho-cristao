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
  maxMembers?: number;
  onInvite: () => void;
  onPray: (memberId: string) => void;
}

/* Padrão SVG de nós interligados — quase transparente */
const PATTERN_SVG = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><g fill='none' stroke='%23D4AF37' stroke-width='0.6' opacity='0.35'><circle cx='10' cy='10' r='3'/><circle cx='50' cy='10' r='3'/><circle cx='30' cy='30' r='3'/><circle cx='10' cy='50' r='3'/><circle cx='50' cy='50' r='3'/><line x1='10' y1='10' x2='30' y2='30'/><line x1='50' y1='10' x2='30' y2='30'/><line x1='10' y1='50' x2='30' y2='30'/><line x1='50' y1='50' x2='30' y2='30'/></g></svg>`)}`;

function Medallion({ member, prayedFor, onPray, lightBurst }: {
  member: Member;
  prayedFor: Set<string>;
  onPray: (id: string) => void;
  lightBurst: string | null;
}) {
  const initials = member.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const hasPrayed = prayedFor.has(member.id);

  return (
    <div className="relative group">
      {/* Medallion */}
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden ring-2 ring-gold/50 shadow-[0_2px_10px_rgba(212,175,55,0.22)] member-medallion-bg">
        {member.avatarUrl ? (
          <Image src={member.avatarUrl} alt={member.name} width={44} height={44} className="w-full h-full object-cover rounded-full" />
        ) : (
          <span className="font-serif text-[13px] tracking-wide text-[#8B6914] dark:text-amber-300">{initials}</span>
        )}
      </div>

      {/* Online dot */}
      {member.isOnline && (
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
      )}

      {/* Ruby prayer button */}
      <motion.button
        onClick={() => onPray(member.id)}
        disabled={hasPrayed}
        aria-label={`Orar por ${member.name}`}
        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all before:absolute before:-inset-2 before:content-[''] ${
          hasPrayed
            ? "shadow-[0_0_6px_rgba(220,38,38,0.45)]"
            : "bg-white border border-gold/30 hover:border-gold"
        }`}
        style={hasPrayed ? { background: "linear-gradient(135deg, #ef4444 0%, #991b1b 100%)" } : {}}
        whileTap={{ scale: 0.8 }}
      >
        <Heart className={`w-2.5 h-2.5 transition-all ${hasPrayed ? "fill-white text-white" : "text-slate-300"}`} />
      </motion.button>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
        <div className="bg-slate-800 text-white text-[10px] px-2 py-1 rounded-lg whitespace-nowrap shadow-lg">
          {member.name}
          {member.streakDays > 0 && <span className="ml-1 text-amber-400">🔥{member.streakDays}</span>}
        </div>
        <div className="w-2 h-2 bg-slate-800 rotate-45 -mt-1" />
      </div>

      {/* Light burst on pray */}
      <AnimatePresence>
        {lightBurst === member.id && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(255,215,0,0.85) 0%, transparent 70%)" }}
            initial={{ scale: 0.5, opacity: 1 }}
            animate={{ scale: 2.8, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.65 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function CellGroup({ name, progress, members, maxMembers = 12, onInvite, onPray }: CellGroupProps) {
  const [prayedFor, setPrayedFor] = useState<Set<string>>(new Set());
  const [lightBurst, setLightBurst] = useState<string | null>(null);
  const slots = Array.from({ length: maxMembers });

  const handlePray = useCallback((memberId: string) => {
    if (prayedFor.has(memberId)) return;
    setLightBurst(memberId);
    setPrayedFor((prev) => new Set(prev).add(memberId));
    onPray(memberId);
    setTimeout(() => setLightBurst(null), 700);
  }, [prayedFor, onPray]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-gold/25 flex flex-col gap-5 p-6 h-full"
      style={{
        background: "linear-gradient(145deg, #FFFEF5 0%, #FFF9E6 35%, #FFFEF0 65%, #FFF5D6 100%)",
        boxShadow: "0 4px 32px rgba(212,175,55,0.13), 0 1px 6px rgba(212,175,55,0.07)",
      }}
    >
      {/* Padrão de conexão — textura de fundo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: `url("${PATTERN_SVG}")`, backgroundSize: "60px 60px", opacity: 0.55 }}
      />

      {/* Glow de canto */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)" }} />
      <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)" }} />

      {/* Partículas de atmosfera */}
      {[
        { top: "12%", right: "14%", size: 5 },
        { top: "38%", left: "5%",   size: 3 },
        { bottom: "18%", right: "8%", size: 4 },
      ].map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{ ...s, width: s.size, height: s.size, background: "rgba(212,175,55,0.35)" }}
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.3, 1] }}
          transition={{ duration: 2.5 + i * 0.7, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* ── Header ── */}
      <div className="relative flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          {/* Medalhão dourado */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-[0_2px_14px_rgba(212,175,55,0.4)] flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #D4AF37 0%, #F0D060 50%, #B8962E 100%)" }}
          >
            <Users className="w-5 h-5 text-white drop-shadow" />
          </div>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-gold-dark/70">Fraternidade</p>
            <p className="font-serif text-sm font-bold text-slate-800 leading-tight">{name}</p>
          </div>
        </div>

        {/* Badge de membros */}
        <div
          className="px-2.5 py-1 rounded-full border border-gold/35 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(212,175,55,0.05) 100%)" }}
        >
          <span className="text-xs font-bold text-gold-dark">{members.length}/{maxMembers}</span>
        </div>
      </div>

      {/* ── Grid de medalhões ── */}
      <div className="flex flex-wrap gap-2.5 relative">
        {slots.map((_, i) => {
          const member = members[i];
          if (!member) {
            return (
              <div
                key={i}
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{
                  border: "1.5px dashed rgba(212,175,55,0.4)",
                  background: "rgba(255,255,255,0.5)",
                }}
              >
                <span className="font-light text-base" style={{ color: "rgba(212,175,55,0.5)" }}>+</span>
              </div>
            );
          }
          return (
            <Medallion
              key={member.id}
              member={member}
              prayedFor={prayedFor}
              onPray={handlePray}
              lightBurst={lightBurst}
            />
          );
        })}
      </div>

      {/* ── Barra de progresso orgânica ── */}
      <div className="space-y-1.5 relative w-full">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">Progresso coletivo</span>
          {/* Badge cintilante */}
          <motion.div
            className="px-2 py-0.5 rounded-full border border-gold/35 text-xs font-bold text-gold-dark"
            style={{ background: "linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(240,208,96,0.1) 100%)" }}
            animate={{ boxShadow: ["0 0 0px rgba(212,175,55,0)", "0 0 8px rgba(212,175,55,0.35)", "0 0 0px rgba(212,175,55,0)"] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            {Math.round(progress)}%
          </motion.div>
        </div>

        {/* Trilha orgânica */}
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(212,175,55,0.12)" }}>
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{ background: "linear-gradient(90deg, #B8962E, #D4AF37, #F0D060, #D4AF37, #B8962E)", backgroundSize: "300% 100%" }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.4 }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)" }}
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>

        <p className="text-[10px] text-slate-400">
          {Math.round((progress / 100) * members.length)}/{maxMembers} membros completaram hoje
        </p>
      </div>

      {/* ── Botão sólido dourado ── */}
      <motion.button
        onClick={onInvite}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: "linear-gradient(135deg, #D4AF37 0%, #C9A227 50%, #B8962E 100%)",
          color: "#FFFEF5",
          boxShadow: "0 2px 12px rgba(212,175,55,0.35)",
        }}
        whileHover={{ scale: 1.01, boxShadow: "0 4px 20px rgba(212,175,55,0.5)" }}
        whileTap={{ scale: 0.98 }}
      >
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="8" cy="8" r="2.5"/>
          <circle cx="2.5" cy="4" r="1.5"/>
          <circle cx="13.5" cy="4" r="1.5"/>
          <circle cx="2.5" cy="12" r="1.5"/>
          <circle cx="13.5" cy="12" r="1.5"/>
          <line x1="5.3" y1="6.8" x2="4" y2="5.3"/>
          <line x1="10.7" y1="6.8" x2="12" y2="5.3"/>
          <line x1="5.3" y1="9.2" x2="4" y2="10.7"/>
          <line x1="10.7" y1="9.2" x2="12" y2="10.7"/>
        </svg>
        Convidar para a fraternidade
      </motion.button>

      {/* Legenda após orar */}
      {prayedFor.size > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[10px] text-center text-slate-400 -mt-2"
        >
          Você orou por {prayedFor.size} {prayedFor.size === 1 ? "pessoa" : "pessoas"} hoje 🙏
        </motion.p>
      )}
    </div>
  );
}
