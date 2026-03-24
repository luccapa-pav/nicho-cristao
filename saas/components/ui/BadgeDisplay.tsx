"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BADGE_DEFS } from "@/lib/badges";

interface BadgeState {
  badgeId: string;
  earned: boolean;
  progress?: number;
}

export function BadgeDisplay() {
  const [badges, setBadges] = useState<BadgeState[]>([]);
  const [plan, setPlan] = useState<string>("FREE");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/badges")
      .then((r) => r.json())
      .then((d) => {
        setBadges(d.badges ?? []);
        setPlan(d.plan ?? "FREE");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getState = (badgeId: string) =>
    badges.find((b) => b.badgeId === badgeId) ?? { badgeId, earned: false };

  if (loading) {
    return (
      <div className="divine-card p-6 animate-pulse">
        <div className="h-4 bg-divine-100 rounded w-32 mb-4" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-divine-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="divine-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          <span className="font-bold text-gold-dark text-sm">{earnedCount}</span> de {BADGE_DEFS.length} conquistadas
        </p>
        {earnedCount > 0 && (
          <span className="text-xs font-semibold text-gold-dark bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
            ✦ {Math.round((earnedCount / BADGE_DEFS.length) * 100)}% completo
          </span>
        )}
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {BADGE_DEFS.map((def, i) => {
          const state = getState(def.id);
          return (
            <motion.div
              key={def.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              title={`${def.label}: ${def.description}`}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
                state.earned
                  ? "border-gold/50 bg-amber-50/60 shadow-sm"
                  : "border-divine-100 bg-white opacity-30 grayscale"
              }`}
            >
              <span className="text-2xl">{def.icon}</span>
              <p className={`text-xs font-semibold leading-tight ${state.earned ? "text-gold-dark" : "text-slate-400"}`}>
                {def.label}
              </p>
              {state.progress !== undefined && !state.earned && (
                <div className="w-full h-0.5 rounded-full bg-divine-100 overflow-hidden">
                  <div className="h-full bg-gold/50 rounded-full" style={{ width: `${state.progress}%` }} />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
