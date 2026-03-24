"use client";

import { Heart, Smile, Timer, Share2, UserPlus } from "lucide-react";

interface QuickActionsBarProps {
  onNovaMracao: () => void;
  onGratidao: () => void;
  onCronometro: () => void;
  onCompartilharVersiculo: () => void;
  onConvidar: () => void;
}

const actions = [
  { icon: Heart,    label: "Nova Oração",           key: "oracao" as const },
  { icon: Smile,    label: "Gratidão",               key: "gratidao" as const },
  { icon: Timer,    label: "Cronômetro",             key: "cronometro" as const },
  { icon: Share2,   label: "Compartilhar Versículo", key: "versiculo" as const },
  { icon: UserPlus, label: "Convidar Amigos",        key: "convidar" as const },
];

export function QuickActionsBar({ onNovaMracao, onGratidao, onCronometro, onCompartilharVersiculo, onConvidar }: QuickActionsBarProps) {
  const handlers = { oracao: onNovaMracao, gratidao: onGratidao, cronometro: onCronometro, versiculo: onCompartilharVersiculo, convidar: onConvidar };

  return (
    <div className="flex justify-center gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {actions.map(({ icon: Icon, label, key }) => (
        <button
          key={key}
          onClick={handlers[key]}
          className="flex-shrink-0 flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-full border border-gold/30 bg-white text-gold-dark text-base font-semibold hover:bg-divine-50 hover:border-gold/60 active:scale-95 transition-all shadow-sm"
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
