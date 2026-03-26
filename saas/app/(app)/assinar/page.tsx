"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Users, Star, Zap, X, Loader2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePlan } from "@/hooks/usePlan";

const FREE_FEATURES = [
  "Diário espiritual sem limites",
  "Versículo diário com reflexão",
  "Registrar e acompanhar orações respondidas",
  "Participar de fraternidade pública",
  "Conquistas e medalhas espirituais",
  "Timer de oração — até 5 min",
  "Lembretes de oração personalizados",
];

const PREMIUM_EXTRAS = [
  "Versículos narrados em voz alta",
  "Planos de leitura bíblica completos",
  "Orar pelos membros da fraternidade",
  "Música ambiente de oração",
  "Timer de oração ilimitado — até 60 min",
  "Modos guiados: Adoração, Intercessão e Lectio Divina",
  "Histórico completo de orações (365 dias)",
  "Relatório de fé mensal",
  "Tema dourado exclusivo",
];

const FAMILY_EXTRAS = [
  "5 perfis Premium independentes",
  "Lista de oração familiar compartilhada",
  "Desafio de fé em família",
  "Painel do líder familiar",
];

type Plan = {
  id: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  name: string;
  price: string;
  priceDetail: string;
  verse: string;
  reference: string;
  description: string;
  features: string[];
  extraFeatures?: string[];
  extraColor?: string;
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
    iconColor: "text-slate-500",
    name: "Gratuito",
    price: "R$ 0",
    priceDetail: "para sempre",
    verse: "",
    reference: "",
    description: "Dê os primeiros passos na sua jornada de fé.",
    features: FREE_FEATURES,
    ctaText: "Começar gratuitamente",
    ctaStyle: "w-full h-12 rounded-xl border-2 border-divine-200 text-slate-600 font-semibold text-sm hover:bg-divine-50 transition-colors",
    cardStyle: "divine-card p-6 flex flex-col h-full",
  },
  {
    id: "premium",
    icon: Sparkles,
    iconBg: "bg-gradient-to-br from-gold/20 to-amber-100",
    iconColor: "text-gold-dark",
    name: "Premium",
    price: "R$ 25,00",
    priceDetail: "por mês",
    verse: "\"Crescei na graça e no conhecimento\"",
    reference: "2 Pe 3:18",
    description: "Aprofunde sua vida de oração e comunhão com Deus.",
    features: ["Todas as vantagens do plano Gratuito +"],
    extraFeatures: PREMIUM_EXTRAS,
    ctaText: "✦ Quero crescer na fé",
    ctaStyle: "btn-divine w-full h-12 text-sm rounded-xl",
    cardStyle: "relative overflow-hidden p-6 flex flex-col h-full rounded-2xl bg-gradient-to-b from-amber-50 via-white to-gold/5 border-2 border-gold/50 shadow-[0_0_60px_rgba(212,175,55,0.18),0_8px_24px_rgba(212,175,55,0.12)]",
    highlight: true,
  },
  {
    id: "anual",
    badge: "✦ Mais popular · 40% off",
    badgeColor: "bg-gold/15 text-gold-dark border border-gold/40",
    icon: Zap,
    iconBg: "bg-gradient-to-br from-gold/20 to-amber-100",
    iconColor: "text-gold-dark",
    name: "Premium Anual",
    price: "R$ 14,99",
    priceDetail: "por mês · cobrado R$ 179,88/ano",
    verse: "\"Firmai-vos, inabaláveis\"",
    reference: "1 Co 15:58",
    description: "Um ano inteiro de compromisso com sua fé. Economize R$ 120,12.",
    features: ["Todas as vantagens do plano Premium +"],
    extraFeatures: [...PREMIUM_EXTRAS, "Acesso prioritário a novos recursos", "Compromisso espiritual anual"],
    ctaText: "✦ Comprometer-me por 1 ano",
    ctaStyle: "btn-divine w-full h-12 text-sm rounded-xl",
    cardStyle: "relative overflow-hidden p-6 flex flex-col h-full rounded-2xl bg-gradient-to-b from-amber-50 via-white to-gold/5 border-2 border-gold/60 shadow-[0_8px_32px_rgba(101,67,0,0.14),0_2px_8px_rgba(0,0,0,0.06)]",
    highlight: true,
  },
  {
    id: "family",
    badge: "❤️ Família de Fé",
    badgeColor: "bg-purple-50 text-purple-700 border border-purple-300",
    icon: Users,
    iconBg: "bg-gradient-to-br from-purple-200 to-purple-100",
    iconColor: "text-purple-600",
    name: "Família",
    price: "R$ 17,90",
    priceDetail: "por mês · até 5 membros",
    verse: "\"Como eu e minha casa, serviremos ao Senhor\"",
    reference: "Js 24:15",
    description: "Cada membro com perfil completo Premium. R$ 3,58 por pessoa por mês.",
    features: ["Todas as vantagens do plano Gratuito +", "Todos os recursos do plano Premium +"],
    extraFeatures: FAMILY_EXTRAS,
    extraColor: "text-purple-500",
    ctaText: "❤️ Orar em família",
    ctaStyle: "w-full h-12 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm transition-colors",
    cardStyle: "relative overflow-hidden p-6 flex flex-col h-full rounded-2xl bg-gradient-to-b from-purple-50 via-white to-purple-50/30 border-2 border-purple-300/60 shadow-[0_8px_24px_rgba(147,51,234,0.12),0_2px_8px_rgba(0,0,0,0.05)]",
  },
];

const FAQ_ITEMS = [
  {
    q: "Posso cancelar a assinatura a qualquer momento?",
    a: "Sim. Você pode cancelar a renovação automática quando quiser direto pelas configurações do seu perfil, sem taxas ocultas. Seu acesso aos recursos Premium continuará ativo até o último dia do período que já foi pago. Depois disso, sua conta volta ao plano Gratuito, e você não perde seu histórico de orações.",
  },
  {
    q: "E se eu me arrepender? Posso pedir reembolso?",
    a: "Nós oferecemos uma garantia incondicional de 7 dias. Se dentro dos primeiros 7 dias após a sua primeira assinatura você sentir que o app não é para você, devolvemos 100% do seu dinheiro, sem burocracia. Após esse prazo legal, não realizamos reembolsos parciais ou proporcionais pelos meses não utilizados, mas você continuará com o acesso até o fim do ciclo cobrado.",
  },
  {
    q: "O Plano Família exige vínculo biológico?",
    a: "De forma alguma. Cremos que a família da fé vai além dos laços de sangue. Você pode dividir seu plano com seu cônjuge, filhos, amigos da sua célula ou irmãos de ministério. Cada pessoa convidada terá seu próprio perfil privado, diário e histórico individual, sem que ninguém veja as informações do outro.",
  },
  {
    q: "Como funciona a cobrança do Plano Anual?",
    a: "Para garantir o desconto máximo (40% OFF em relação ao mensal), o valor de R$ 179,88 é cobrado de uma única vez no seu cartão de crédito. É como investir apenas R$ 14,99 por mês para ter um ano inteiro de ferramentas exclusivas dedicadas à sua jornada e crescimento espiritual.",
  },
];

export default function AssinarPage() {
  const { isPremium, plan, isOnTrial, trialDaysLeft, hasUsedTrial } = usePlan();
  const [trialLoading, setTrialLoading] = useState(false);
  const [payModalPlan, setPayModalPlan] = useState<string | null>(null);
  const [payLoading, setPayLoading] = useState<"stripe" | "pix" | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [pixCpf, setPixCpf] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleStartTrial = async () => {
    setTrialLoading(true);
    try {
      const res = await fetch("/api/trial/start", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setTrialLoading(false);
    }
  };

  const handlePay = async (method: "stripe" | "pix") => {
    if (!payModalPlan) return;
    if (method === "pix") {
      const cpfClean = pixCpf.replace(/\D/g, "");
      if (cpfClean.length !== 11) {
        setPayError("CPF inválido. Digite os 11 dígitos para pagar com PIX.");
        return;
      }
    }
    setPayLoading(method);
    setPayError(null);
    try {
      const endpoint = method === "stripe" ? "/api/checkout/stripe" : "/api/checkout/pix";
      const body: Record<string, string> = { planId: payModalPlan };
      if (method === "pix") body.cpf = pixCpf.replace(/\D/g, "");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPayError(data.error ?? "Não foi possível iniciar o pagamento. Tente novamente.");
      }
    } catch {
      setPayError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setPayLoading(null);
    }
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10 flex flex-col items-center"
      >
        {/* Label */}
        <div className="inline-flex items-center gap-2 border border-gold/50 bg-gold/8 rounded-full px-5 py-2 mb-5">
          <Sparkles className="w-3.5 h-3.5 text-gold-dark" />
          <span className="text-sm font-bold uppercase tracking-[0.25em] text-gold-dark">Planos</span>
          <Sparkles className="w-3.5 h-3.5 text-gold-dark" />
        </div>

        {/* Título — maior */}
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight max-w-sm">
          Escolha seu caminho de fé
        </h1>

        {/* Subtítulo — médio */}
        <p className="text-slate-500 mt-3 text-sm max-w-xs mx-auto leading-relaxed">
          Cada plano foi criado para levar sua fé a um nível mais profundo.
        </p>


        {/* Status badges */}
        {isPremium && !isOnTrial && (
          <div className="mt-5 inline-flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold-dark text-xs font-semibold px-4 py-2 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Você já tem o plano {plan === "FAMILY" ? "Família" : "Premium"} ativo ✦
          </div>
        )}
        {isOnTrial && (
          <div className="mt-5 inline-flex items-center gap-2 bg-amber-50 border border-gold/40 text-gold-dark text-xs font-semibold px-4 py-2 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            Trial ativo — {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
          </div>
        )}
        {hasUsedTrial && !isPremium && !isOnTrial && (
          <div className="mt-5 inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-2 rounded-full">
            Seu trial expirou — assine para continuar com Premium
          </div>
        )}
        {!isPremium && !hasUsedTrial && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <button
              onClick={handleStartTrial}
              disabled={trialLoading}
              className="btn-divine px-6 py-2.5 text-sm"
            >
              {trialLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "✦ Testar Premium 7 dias grátis"}
            </button>
            <p className="text-[11px] text-slate-400">Cartão necessário · Avisamos 3 dias antes por email</p>
          </div>
        )}
      </motion.div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
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
              className={`${p.cardStyle} gap-0 relative h-full`}
            >
              {/* Divine glow overlay */}
              {p.highlight && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-gold/20 via-gold/5 to-transparent rounded-t-2xl" />
              )}

              {/* Bloco 0 — Badge (altura fixa) */}
              <div className="flex justify-center mb-3 min-h-[26px]">
                {p.badge && (
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                )}
              </div>

              {/* Bloco 1 — Icon + Name (altura fixa) */}
              <div className="relative flex flex-col items-center text-center gap-1.5 mb-4 min-h-[80px] justify-center">
                <div className={`w-11 h-11 rounded-2xl ${p.iconBg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${p.iconColor}`} />
                </div>
                <p className="font-serif text-lg font-bold text-slate-800 leading-tight">{p.name}</p>
                {isCurrent && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Plano atual
                  </span>
                )}
              </div>

              {/* Bloco 2 — Preço (altura fixa) */}
              <div className="flex flex-col items-center text-center mb-4 min-h-[76px] justify-center">
                <div className="flex items-baseline gap-1 leading-none">
                  <span className="text-xs font-semibold text-slate-400 mb-1 self-start mt-2">R$</span>
                  <span className="font-serif text-4xl font-bold text-slate-900 tracking-tight">
                    {p.price.replace("R$ ", "")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 tracking-wide">{p.priceDetail}</p>
                {p.id === "family" && (
                  <p className="text-[10px] text-purple-600 font-semibold mt-1">≈ R$ 3,58 por membro/mês</p>
                )}
              </div>

              {/* Bloco 3 — Versículo (altura fixa) */}
              <div className="text-center mb-4 px-1 min-h-[48px] flex flex-col justify-center">
                {p.verse && (
                  <>
                    <p className="text-[11px] italic text-slate-500 leading-relaxed">{p.verse}</p>
                    <p className={`text-[10px] font-bold mt-1 tracking-wide ${p.id === "family" ? "text-purple-500" : "text-gold-dark"}`}>{p.reference}</p>
                  </>
                )}
              </div>

              <div className="divine-divider mb-4" />

              {/* Bloco 4 — Avatares família (altura fixa para todos) */}
              <div className="min-h-[56px] flex items-center justify-center gap-2 mb-4">
                {p.id === "family" && ["Pai", "Mãe", "Filho", "Filha", "Avó"].map((n) => (
                  <div key={n} className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-purple-100 border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-purple-700">
                      {n[0]}
                    </div>
                    <p className="text-[8px] text-slate-400">{n}</p>
                  </div>
                ))}
              </div>

              {/* Bloco 5 — Descrição (altura fixa) */}
              <p className="text-xs text-slate-500 mb-4 leading-relaxed text-center min-h-[48px]">{p.description}</p>

              {/* Features */}
              <ul className="flex flex-col gap-1.5 flex-1">
                {p.features.map((f) =>
                  f.endsWith("+") ? (
                    <li key={f} className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-divine-50 rounded-lg px-2 py-1.5 mb-0.5">
                      <span className="w-3.5 flex justify-center shrink-0"><Check className="w-3 h-3 text-divine-400" /></span>
                      {f}
                    </li>
                  ) : (
                    <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="w-3.5 flex justify-center shrink-0 mt-0.5"><Check className="w-3 h-3 text-slate-400" /></span>
                      {f}
                    </li>
                  )
                )}
                {p.extraFeatures && p.extraFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className={`w-3.5 flex justify-center shrink-0 mt-0.5 leading-none ${p.extraColor ?? "text-gold-dark"}`}>✦</span>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA — fixo no rodapé */}
              <div className="mt-auto pt-4">
                {p.id === "free" ? (
                  <Link href="/inicio">
                    <button className={p.ctaStyle}>{p.ctaText}</button>
                  </Link>
                ) : (
                  <button
                    className={p.ctaStyle}
                    disabled={isCurrent}
                    onClick={() => !isCurrent && setPayModalPlan(p.id)}
                  >
                    {isCurrent ? "✓ Plano ativo" : p.ctaText}
                  </button>
                )}
              </div>
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
          <p className="text-sm font-semibold text-slate-700">Controle total da sua assinatura</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cancele a renovação automática a qualquer momento, direto pelo aplicativo. Sem taxas de cancelamento, sem burocracia para sair. Sua jornada deve ser um ato de vontade.
          </p>
          <p className="text-[11px] italic text-slate-400 mt-1">
            &ldquo;Cada um dê conforme determinou em seu coração, não com tristeza nem por obrigação.&rdquo; — 2 Co 9:7
          </p>
        </div>
      </motion.div>

      {/* ── FAQ Accordion ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-8 max-w-2xl mx-auto"
      >
        <h2 className="font-serif text-xl font-semibold text-slate-800 dark:text-white text-center mb-5">Perguntas frequentes</h2>
        <div className="flex flex-col gap-3">
          {FAQ_ITEMS.map(({ q, a }, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={q}
                className="rounded-xl border border-divine-100 dark:border-gray-800 bg-white/60 dark:bg-gray-900/50 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm font-semibold text-slate-800 dark:text-zinc-100 leading-snug">{q}</span>
                  <ChevronDown
                    className={`w-4 h-4 flex-shrink-0 text-gold-dark transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <p className="px-5 pb-5 text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <div className="h-8" />
    </div>

    {/* ── Modal de pagamento ── */}
    <AnimatePresence>
      {payModalPlan && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPayModalPlan(null)} />
          <motion.div
            className="relative divine-card w-full max-w-sm mb-4 md:mb-0 overflow-hidden"
            initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 32, opacity: 0 }}
            transition={{ duration: 0.22 }}
          >
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-gold/10 to-transparent pointer-events-none" />
            <div className="relative px-6 pt-6 pb-2 flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold-dark/60">Forma de pagamento</p>
                <h2 className="font-serif text-xl font-bold text-slate-800 mt-0.5">
                  {PLANS.find(p => p.id === payModalPlan)?.name}
                </h2>
              </div>
              <button onClick={() => setPayModalPlan(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-divine-50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-4 flex flex-col gap-3">
              {/* CPF — required for PIX */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">CPF (para PIX)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={pixCpf}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                    setPixCpf(v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
                      .replace(/(\d{3})(\d{3})(\d{3})/, "$1.$2.$3")
                      .replace(/(\d{3})(\d{3})/, "$1.$2"));
                  }}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-divine-200 bg-white focus:outline-none focus:ring-2 focus:ring-divine-300 text-slate-800 placeholder:text-slate-300"
                />
                <p className="text-[10px] text-slate-400">Necessário apenas para pagamento via PIX</p>
              </div>

              {/* PIX */}
              <button
                onClick={() => handlePay("pix")}
                disabled={!!payLoading}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  {payLoading === "pix" ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <span className="text-white text-lg font-bold">✦</span>}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-emerald-800">Pagar com PIX</p>
                  <p className="text-xs text-emerald-600">
                    {payModalPlan === "family" ? "R$ 214,80/ano · aprovação imediata" : "R$ 179,88/ano · aprovação imediata"}
                  </p>
                </div>
              </button>

              {/* Cartão */}
              <button
                onClick={() => handlePay("stripe")}
                disabled={!!payLoading}
                className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-divine-200 bg-white hover:bg-divine-50 transition-colors disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-xl bg-divine-400 flex items-center justify-center flex-shrink-0">
                  {payLoading === "stripe" ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <span className="text-white text-lg">💳</span>}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">Pagar com cartão</p>
                  <p className="text-xs text-slate-500">Mensal ou anual · recorrente · cancele quando quiser</p>
                </div>
              </button>

              {payError && (
                <p className="text-xs text-center text-red-500 font-medium mt-1 px-1">{payError}</p>
              )}
              <p className="text-[10px] text-center text-slate-400 mt-1">
                Pagamento seguro · Cancele a qualquer momento
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
