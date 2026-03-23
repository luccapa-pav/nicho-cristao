export type BadgeId =
  | "streak_7" | "streak_30" | "streak_90" | "streak_180" | "streak_365"
  | "first_prayer" | "first_answered" | "cell_member"
  | "discipulo_fiel" | "orador" | "evangelista" | "familia";

export interface BadgeDef {
  id: BadgeId;
  label: string;
  description: string;
  icon: string;
  isPremium: boolean;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: "streak_7",       label: "7 dias",          description: "7 dias seguidos de devocional",       icon: "🔥", isPremium: false },
  { id: "streak_30",      label: "Mês de Fé",        description: "30 dias seguidos de devocional",      icon: "🏅", isPremium: false },
  { id: "streak_90",      label: "3 Meses de Glória",description: "90 dias seguidos de devocional",      icon: "⭐", isPremium: false },
  { id: "streak_180",     label: "Meio Ano",         description: "180 dias seguidos de devocional",     icon: "🌟", isPremium: false },
  { id: "streak_365",     label: "Um Ano de Glória", description: "365 dias seguidos de devocional",     icon: "👑", isPremium: false },
  { id: "first_prayer",   label: "Primeiro Pedido",  description: "Registrou sua primeira oração",       icon: "🙏", isPremium: false },
  { id: "first_answered", label: "Primeira Vitória", description: "Primeira oração respondida por Deus", icon: "✅", isPremium: false },
  { id: "cell_member",    label: "Membro de Célula", description: "Faz parte de uma célula",             icon: "👥", isPremium: false },
  { id: "discipulo_fiel", label: "Discípulo Fiel",   description: "100 dias completados no total",       icon: "📖", isPremium: true },
  { id: "orador",         label: "Orador",           description: "50 orações registradas",              icon: "📿", isPremium: true },
  { id: "evangelista",    label: "Evangelista",      description: "10 posts com reações no feed",        icon: "📣", isPremium: true },
  { id: "familia",        label: "Família",          description: "Plano Família ativo",                 icon: "❤️", isPremium: true },
];
