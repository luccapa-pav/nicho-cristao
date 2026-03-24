"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Users, Star, Zap } from "lucide-react";
import Link from "next/link";
import { usePlan } from "@/hooks/usePlan";

const FREE_FEATURES = [
  "Versículo do dia",
  "Timer de oração (5 min)",
  "Diário espiritual ilimitado",
  "Lembretes personalizados",
  "Marcar orações respondidas",
  "Fraternidade pública",
  "Conquistas espirituais",
];

const PREMIUM_EXTRAS = [
  "Modos guiados de oração",
  "Adoração · Intercessão · Lectio Divina",
  "Timer ilimitado (até 60 min)",
  "Música ambiente de oração",
  "Versículos em voz alta",
  "Planos de leitura completos",
  "Busca no diário espiritual",
  "Exportar diário em PDF",
  "Histórico completo (365 dias)",
  "Orações da fraternidade",
  "Relatório de fé mensal",
  "Tema dourado exclusivo",
];

const FAMILY_EXTRAS = [
  "Tudo do Premium para 5 membros",
  "Lista de oração familiar",
  "Ofensiva em família",
  "Painel do líder familiar",
];

type Plan = {
  id: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  iconBg: string;
  name: string;
  price: string;
  priceDetail: string;
  verse: string;
  reference: string;
  description: string;
  features: string[];
  extraFeatures?: string[];
  ctaText: string;
  ctaStyle: string;
  cardStyle: string;
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: "free",
    icon: Star,
    iconBg: "bg-slate-100",
    name: "Gratuito",
    price: "R$ 0",
    priceDetail: "para sempre",
    verse: "\"A graça de Deus é suficiente\"",
    reference: "2 Co 12:9",
    description: "Dê os primeiros passos na sua jornada de fé.",
    features: FREE_FEATURES,
    ctaText: "Começar gratuitamente",
    ctaStyle: "w-full py-3 rounded-xl border-2 border-divine-200 text-slate-600 font-semibold text-sm hover:bg-divine-50 transition-colors",
    cardStyle: "divine-card p-6 flex flex-col",
  },
  {
    id: "premium",
    badge: "Mais popular",
    badgeColor: "bg-gold/15 text-gold-dark border border-gold/30",
    icon: Sparkles,
    iconBg: "bg-gold/10",
    name: "Premium",
    price: "R$ 9,90",
    priceDetail: "por mês",
    verse: "\"Crescei na graça e no conhecimento\"",
    reference: "2 Pe 3:18",
    description: "Aprofunde sua vida de oração e comunhão com Deus.",
    features: FREE_FEATURES,
    extraFeatures: PREMIUM_EXTRAS,
    ctaText: "✦ Quero crescer na fé",
    ctaStyle: "btn-divine w-full py-3 text-sm",
    cardStyle: "divine-card p-6 flex flex-col border-2 border-gold/40",
    highlight: true,
  },
  {
    id: "anual",
    badge: "✦ Melhor valor · 25% off",
    badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: Zap,
    iconBg: "bg-emerald-50",
    name: "Premium Anual",
    price: "R$ 7,49",
    priceDetail: "por mês · cobrado R$ 89,90/ano",
    verse: "\"Firmai-vos, inabaláveis\"",
    reference: "1 Co 15:58",
    description: "Um ano inteiro de compromisso com sua fé. Economize R$ 29,00.",
    features: FREE_FEATURES,
    extraFeatures: [...PREMIUM_EXTRAS, "Acesso prioritário a novos recursos", "Compromisso espiritual anual"],
    ctaText: "✦ Comprometer-me por 1 ano",
    ctaStyle: "btn-divine w-full py-3 text-sm bg-emerald-600 hover:bg-emerald-700",
    cardStyle: "divine-card p-6 flex flex-col border-2 border-emerald-300/60",
  },
  {
    id: "family",
    badge: "Para famílias",
    badgeColor: "bg-violet-50 text-violet-700 border border-violet-200",
    icon: Users,
    iconBg: "bg-violet-50",
    name: "Família",
    price: "R$ 17,90",
    priceDetail: "por mês · até 5 membros",
    verse: "\"Orai juntos com um acordo\"",
    reference: "Mt 18:19",
    description: "Ora em família. Cada membro com seu perfil completo Premium.",
    features: FREE_FEATURES,
    extraFeatures: [...PREMIUM_EXTRAS, ...FAMILY_EXTRAS],
    ctaText: "✦ Orar em família",
    ctaStyle: "w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors",
    cardStyle: "divine-card p-6 flex flex-col border-2 border-violet-200/60",
  },
];

export default function AssinarPage() {
  const { isPremium, plan } = usePlan();

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold-dark/60 mb-2">Planos</p>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
          Escolha seu caminho de fé
        </h1>
        <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
          Cada plano foi pensado para acompanhar você na caminhada com Deus — do primeiro passo ao crescimento pleno.
        </p>
        <div className="verse-highlight text-sm italic text-slate-600 mt-4 max-w-xs mx-auto">
          &ldquo;Buscai primeiro o Reino de Deus e a sua justiça.&rdquo;
        </div>
        <p className="text-xs font-semibold text-gold-dark mt-1">— Mateus 6:33</p>

        {isPremium && (
          <div className="mt-4 inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold-dark text-xs font-semibold px-4 py-2 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Você já tem o plano {plan === "FAMILY" ? "Família" : "Premium"} ativo ✦
          </div>
        )}
      </motion.div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {PLANS.map((p, i) => {
          const Icon = p.icon;
          const isCurrent =
            (p.id === "free" && plan === "FREE") ||
            (p.id === "premium" && plan === "PREMIUM") ||
            (p.id === "anual" && plan === "PREMIUM") ||
            (p.id === "family" && plan === "FAMILY");

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`${p.cardStyle} gap-0 relative`}
            >
              {/* Badge */}
              {p.badge && (
                <span className={`self-start text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 ${p.badgeColor}`}>
                  {p.badge}
                </span>
              )}
              {!p.badge && <div className="mb-6" />}

              {/* Icon + Name */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${p.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-gold-dark" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-base leading-tight">{p.name}</p>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                      Plano atual
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-3xl font-bold text-slate-900">{p.price}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{p.priceDetail}</p>
              </div>

              {/* Verse */}
              <p className="text-[11px] italic text-slate-500 mb-0.5">{p.verse}</p>
              <p className="text-[10px] font-semibold text-gold-dark mb-3">{p.reference}</p>

              <div className="divine-divider mb-4" />

              {/* Description */}
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">{p.description}</p>

              {/* Features */}
              <ul className="flex flex-col gap-1.5 mb-5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                    <Check className="w-3 h-3 text-slate-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
                {p.extraFeatures && (
                  <>
                    <li className="pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gold-dark/70 mb-1">
                        {p.id === "family" ? "✦ + Família" : "✦ Exclusivo"}
                      </p>
                    </li>
                    {p.extraFeatures.map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-slate-600">
                        <span className="text-gold-dark mt-0.5 shrink-0 leading-none">✦</span>
                        {f}
                      </li>
                    ))}
                  </>
                )}
              </ul>

              {/* CTA */}
              {p.id === "free" ? (
                <Link href="/dashboard">
                  <button className={p.ctaStyle}>{p.ctaText}</button>
                </Link>
              ) : (
                <button className={p.ctaStyle} disabled={isCurrent}>
                  {isCurrent ? "✓ Plano ativo" : p.ctaText}
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Garantia ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-10 text-center"
      >
        <div className="inline-flex flex-col items-center gap-2 divine-card px-8 py-5 max-w-md mx-auto">
          <span className="text-2xl">🙏</span>
          <p className="text-sm font-semibold text-slate-700">Cancele quando quiser</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sem contratos. Sem pegadinhas. Sua fé deve ser um ato de vontade — não de obrigação.
          </p>
          <p className="text-[11px] italic text-slate-400 mt-1">
            &ldquo;Cada um dê conforme determinou em seu coração, não com tristeza nem por obrigação.&rdquo; — 2 Co 9:7
          </p>
        </div>
      </motion.div>

      {/* ── FAQ rápido ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 max-w-2xl mx-auto"
      >
        <h2 className="font-serif text-xl font-semibold text-slate-800 text-center mb-5">Perguntas frequentes</h2>
        <div className="divide-y divide-divine-100">
          {[
            {
              q: "Posso mudar de plano a qualquer momento?",
              a: "Sim. Você pode fazer upgrade ou downgrade quando quiser, sem taxas.",
            },
            {
              q: "O Plano Família é para uma família biológica?",
              a: "Não necessariamente. Pode ser uma família de fé — um casal, uma célula pequena, amigos próximos em Cristo.",
            },
            {
              q: "O que acontece se eu cancelar?",
              a: "Você mantém acesso até o fim do período pago e depois volta automaticamente para o plano Gratuito. Nada é deletado.",
            },
            {
              q: "O Plano Anual é cobrado de uma vez?",
              a: "Sim — R$ 89,90 cobrado uma única vez por ano. O equivalente a R$ 7,49/mês.",
            },
          ].map(({ q, a }) => (
            <div key={q} className="py-4">
              <p className="text-sm font-semibold text-slate-700 mb-1">{q}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="h-8" />
    </div>
  );
}
