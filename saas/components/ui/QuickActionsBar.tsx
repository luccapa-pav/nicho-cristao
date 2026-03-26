"use client";

import { Heart, Smile, Timer, Share2, UserPlus, CheckCircle2 } from "lucide-react";

interface QuickActionsBarProps {
  onNovaOracao: () => void;
  onGratidao: () => void;
  onCronometro: () => void;
  onCompartilharVersiculo: () => void;
  onConvidar: () => void;
  onJaOrei: () => void;
  completedToday: boolean;
}

export function QuickActionsBar({
  onNovaOracao,
  onGratidao,
  onCronometro,
  onCompartilharVersiculo,
  onConvidar,
  onJaOrei,
  completedToday,
}: QuickActionsBarProps) {
  const staticActions = [
    { icon: Heart,    label: "Nova Oração",  key: "oracao",     handler: onNovaOracao },
    { icon: Smile,    label: "Gratidão",     key: "gratidao",   handler: onGratidao },
    { icon: Timer,    label: "Cronômetro",   key: "cronometro", handler: onCronometro },
    { icon: Share2,   label: "Compartilhar", key: "versiculo",  handler: onCompartilharVersiculo },
    { icon: UserPlus, label: "Convidar",     key: "convidar",   handler: onConvidar },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2.5 px-1">
      {/* Já orei hoje */}
      <button
        onClick={onJaOrei}
        className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-full border font-semibold text-sm active:scale-95 transition-all ${
          completedToday
            ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-[0_0_12px_rgba(52,211,153,0.25)]"
            : "border-gold/40 bg-white text-gold-dark hover:bg-divine-50 hover:border-gold/70 hover:shadow-[0_0_14px_rgba(212,175,55,0.25)] shadow-sm"
        }`}
      >
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        {completedToday ? "Orei hoje ✓" : "Já orei hoje"}
      </button>

      {staticActions.map(({ icon: Icon, label, key, handler }) => (
        <button
          key={key}
          onClick={handler}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-full border border-gold/30 bg-white text-gold-dark text-sm font-semibold hover:bg-divine-50 hover:border-gold/60 hover:shadow-[0_0_14px_rgba(212,175,55,0.20)] active:scale-95 transition-all shadow-sm"
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
        </button>
      ))}
    </div>
  );
}
