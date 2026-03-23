"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BADGE_DEFS } from "@/lib/badges";
import { PremiumGate } from "@/components/ui/PremiumGate";

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

  const isPremiumUser = plan === "PREMIUM" || plan === "FAMILY";

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

  const freeBadges = BADGE_DEFS.filter((b) => !b.isPremium);
  const premiumBadges = BADGE_DEFS.filter((b) => b.isPremium);

  return (
    <div className="divine-card p-6 flex flex-col gap-5">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-gold-dark">Conquistas</p>
        <p className="text-sm text-slate-600 mt-0.5">
          {badges.filter((b) => b.earned).length} de {BADGE_DEFS.length} conquistadas
        </p>
      </div>

      {/* FREE badges */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
        {freeBadges.map((def, i) => {
          const state = getState(def.id);
          return (
            <motion.div
              key={def.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              title={`${def.label}: ${def.description}`}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
                state.earned
                  ? "border-gold/50 bg-amber-50/60 shadow-sm"
                  : "border-divine-100 bg-white opacity-30"
              }`}
            >
              <span className="text-2xl">{def.icon}</span>
              <p className={`text-[10px] font-semibold leading-tight ${state.earned ? "text-gold-dark" : "text-slate-400"}`}>
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

      {/* PREMIUM badges */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark/60 mb-3">
          ✦ Exclusivas Premium
        </p>
        <PremiumGate feature="Conquistas Premium" blur>
          <div className="grid grid-cols-4 gap-3">
            {premiumBadges.map((def, i) => {
              const state = getState(def.id);
              return (
                <motion.div
                  key={def.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  title={`${def.label}: ${def.description}`}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
                    state.earned && isPremiumUser
                      ? "border-gold/50 bg-amber-50/60 shadow-sm"
                      : "border-divine-100 bg-white opacity-50"
                  }`}
                >
                  <span className="text-2xl">{def.icon}</span>
                  <p className={`text-[10px] font-semibold leading-tight ${state.earned && isPremiumUser ? "text-gold-dark" : "text-slate-400"}`}>
                    {def.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </PremiumGate>
      </div>
    </div>
  );
}
