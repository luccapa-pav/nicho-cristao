// Server Component — sem "use client", sem hooks
// Renderiza um símbolo cristão fixo no canto inferior esquerdo de cada página,
// espelhando o comportamento do body::before (cross-crown) no canto inferior direito.

export type PageSymbol =
  | "flame"
  | "dove"
  | "hands"
  | "quill"
  | "mary"
  | "scroll"
  | "crown-thorns"
  | "lamb"
  | "bread-fish";

const SVGS: Record<PageSymbol, React.ReactNode> = {

  /* ── CHAMA — Dashboard (Fogo do Espírito Santo) ── */
  flame: (
    <svg viewBox="0 0 56 80" fill="#D4AF37" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        d="M28 3C19 15 4 29 4 49c0 18 11 30 24 30s24-12 24-30C52 29 37 15 28 3zm0 26c-6 8-12 15-12 22 0 8 5 14 12 14s12-6 12-14c0-7-6-14-12-22z"
      />
    </svg>
  ),

  /* ── POMBA — Devocional (Espírito Santo) ── */
  dove: (
    <svg viewBox="0 0 100 80" fill="#D4AF37" xmlns="http://www.w3.org/2000/svg">
      {/* Cabeça */}
      <circle cx="72" cy="22" r="10" />
      {/* Bico */}
      <path d="M80 22 L94 19 L80 26Z" />
      {/* Corpo */}
      <ellipse cx="52" cy="42" rx="26" ry="16" transform="rotate(-10 52 42)" />
      {/* Asa esquerda — levantada */}
      <path d="M50 36 C40 16 18 10 6 20 C18 22 34 30 46 40Z" />
      {/* Asa direita — levantada */}
      <path d="M56 34 C64 14 86 8 98 18 C86 20 70 28 58 38Z" />
      {/* Cauda */}
      <path d="M30 48 C18 60 10 72 14 80 C22 72 30 62 36 54Z" />
      <path d="M34 52 C26 66 22 78 28 82 C34 74 38 62 42 56Z" />
    </svg>
  ),

  /* ── MÃOS EM ORAÇÃO — Oração ── */
  hands: (
    <svg viewBox="0 0 60 90" fill="#D4AF37" xmlns="http://www.w3.org/2000/svg">
      {/* Palma esquerda */}
      <path d="M30 6 C24 6 18 11 16 18 L6 48 C4 54 7 60 12 62 L16 64 L16 84 C16 87 18 89 21 89 L29 89 L29 62 L24 60 L32 24Z" />
      {/* Palma direita */}
      <path d="M30 6 C36 6 42 11 44 18 L54 48 C56 54 53 60 48 62 L44 64 L44 84 C44 87 42 89 39 89 L31 89 L31 62 L36 60 L28 24Z" />
    </svg>
  ),

  /* ── PENA / PLUMA — Diário ── */
  quill: (
    <svg viewBox="0 0 70 100" fill="#D4AF37" xmlns="http://www.w3.org/2000/svg">
      {/* Pena */}
      <path d="M64 4 C50 8 34 20 22 38 L8 74 L6 90 L22 78 L36 42 C48 26 58 14 66 6Z" />
      {/* Haste central */}
      <path
        d="M22 78 L36 42"
        fill="none"
        stroke="#FFFEF9"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Ponta da pena */}
      <path d="M8 90 L6 90 L14 72 L22 78Z" />
    </svg>
  ),

  /* ── NOSSA SENHORA — Fraternidade ── */
  mary: (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/nossa-senhora.svg" alt="" style={{ width: "100%", height: "auto" }} />
  ),

  /* ── PERGAMINHO — Versículo ── */
  scroll: (
    <svg viewBox="0 0 80 100" fill="#D4AF37" xmlns="http://www.w3.org/2000/svg">
      {/* Corpo do pergaminho */}
      <rect x="20" y="12" width="40" height="76" rx="3" />
      {/* Rolo superior */}
      <ellipse cx="20" cy="50" rx="11" ry="38" />
      <ellipse cx="60" cy="50" rx="11" ry="38" />
      {/* Linhas de texto */}
      <rect x="28" y="26" width="24" height="3" rx="1.5" fill="#FFFEF9" />
      <rect x="28" y="36" width="24" height="3" rx="1.5" fill="#FFFEF9" />
      <rect x="28" y="46" width="16" height="3" rx="1.5" fill="#FFFEF9" />
      <rect x="28" y="56" width="24" height="3" rx="1.5" fill="#FFFEF9" />
      <rect x="28" y="66" width="18" height="3" rx="1.5" fill="#FFFEF9" />
      <rect x="28" y="76" width="24" height="3" rx="1.5" fill="#FFFEF9" />
    </svg>
  ),

  /* ── COROA DE ESPINHOS — Plano de Leitura ── */
  "crown-thorns": (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="30" fill="none" stroke="#D4AF37" strokeWidth="5" />
      {/* Espinhos ao redor */}
      <polygon points="50,16 46,6 54,6"   fill="#D4AF37" />
      <polygon points="74,26 80,18 84,24" fill="#D4AF37" />
      <polygon points="84,50 94,46 94,54" fill="#D4AF37" />
      <polygon points="74,74 80,82 84,76" fill="#D4AF37" />
      <polygon points="50,84 46,94 54,94" fill="#D4AF37" />
      <polygon points="26,74 20,82 16,76" fill="#D4AF37" />
      <polygon points="16,50 6,46 6,54"   fill="#D4AF37" />
      <polygon points="26,26 20,18 16,24" fill="#D4AF37" />
      {/* Espinhos diagonais menores */}
      <polygon points="65,20 68,12 72,16" fill="#D4AF37" />
      <polygon points="80,35 88,32 88,38" fill="#D4AF37" />
      <polygon points="80,65 88,62 88,68" fill="#D4AF37" />
      <polygon points="65,80 68,88 72,84" fill="#D4AF37" />
      <polygon points="35,80 32,88 28,84" fill="#D4AF37" />
      <polygon points="20,65 12,62 12,68" fill="#D4AF37" />
      <polygon points="20,35 12,32 12,38" fill="#D4AF37" />
      <polygon points="35,20 32,12 28,16" fill="#D4AF37" />
    </svg>
  ),

  /* ── CORDEIRO — Perfil (Agnus Dei) ── */
  lamb: (
    <svg viewBox="0 0 110 85" fill="#D4AF37" xmlns="http://www.w3.org/2000/svg">
      {/* Lã — círculos sobrepostos */}
      <circle cx="28" cy="42" r="12" />
      <circle cx="40" cy="32" r="13" />
      <circle cx="54" cy="28" r="13" />
      <circle cx="68" cy="32" r="12" />
      <circle cx="76" cy="44" r="11" />
      <circle cx="60" cy="50" r="11" />
      <circle cx="44" cy="52" r="10" />
      {/* Cabeça */}
      <ellipse cx="92" cy="36" rx="14" ry="12" />
      {/* Orelha */}
      <ellipse cx="98" cy="25" rx="5" ry="9" transform="rotate(20 98 25)" />
      {/* Olho */}
      <circle cx="95" cy="34" r="3" fill="#FFFEF9" />
      {/* Patas */}
      <rect x="32" y="60" width="8" height="18" rx="4" />
      <rect x="46" y="60" width="8" height="18" rx="4" />
      <rect x="58" y="60" width="8" height="18" rx="4" />
      <rect x="70" y="60" width="8" height="18" rx="4" />
      {/* Rabo */}
      <circle cx="18" cy="48" r="6" />
    </svg>
  ),

  /* ── PÃES E PEIXES — Assinar ── */
  "bread-fish": (
    <svg viewBox="0 0 110 80" fill="#D4AF37" xmlns="http://www.w3.org/2000/svg">
      {/* Pão — forma arredondada */}
      <path d="M6 52 C6 34 16 24 30 24 C44 24 54 34 54 52 C54 64 44 70 30 70 C16 70 6 64 6 52Z" />
      {/* Corte do pão */}
      <path
        d="M14 40 C20 35 26 33 30 33 C34 33 40 35 46 40"
        fill="none"
        stroke="#FFFEF9"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Peixe — corpo */}
      <path d="M62 38 C70 28 86 26 96 34 C104 40 104 50 96 56 C86 64 70 62 62 52 L56 44Z" />
      {/* Cauda do peixe */}
      <path d="M62 38 L50 26 M62 52 L50 64" fill="none" stroke="#D4AF37" strokeWidth="5" strokeLinecap="round" />
      {/* Olho do peixe */}
      <circle cx="88" cy="40" r="4" fill="#FFFEF9" />
    </svg>
  ),
};

const CARD_DATA: Record<PageSymbol, { label: string; emoji: string; verse: string; reference: string }> = {
  flame:          { label: "Dashboard",    emoji: "🔥", verse: "Derramarei do meu Espírito sobre toda a carne",                              reference: "Joel 2:28" },
  dove:           { label: "Devocional",   emoji: "🕊️", verse: "O Espírito de Deus desceu sobre ele como uma pomba",                         reference: "Mateus 3:16" },
  hands:          { label: "Oração",       emoji: "📿", verse: "Orai sem cessar",                                                             reference: "1 Ts 5:17" },
  quill:          { label: "Diário",       emoji: "🪶", verse: "Escreve a visão e grava-a em tábuas",                                        reference: "Habacuque 2:2" },
  mary:           { label: "Fraternidade", emoji: "✝️", verse: "Onde dois ou três estiverem reunidos em meu nome, ali estou no meio deles",   reference: "Mateus 18:20" },
  scroll:         { label: "Palavra",      emoji: "📜", verse: "Tua palavra é lâmpada para os meus pés e luz para o meu caminho",            reference: "Salmos 119:105" },
  "crown-thorns": { label: "Leitura",      emoji: "✝️", verse: "Pela sua ferida fomos sarados",                                               reference: "Isaías 53:5" },
  lamb:           { label: "Perfil",       emoji: "🐑", verse: "O Senhor é meu pastor, nada me faltará",                                     reference: "Salmos 23:1" },
  "bread-fish":   { label: "Planos",       emoji: "🍞", verse: "Eu sou o pão da vida; quem vem a mim não terá fome",                        reference: "João 6:35" },
};

export function PageSymbolCard({ symbol }: { symbol: PageSymbol }) {
  const { label, emoji, verse, reference } = CARD_DATA[symbol];
  return (
    <div className="divine-card overflow-hidden flex items-center gap-0 mb-8">
      <div className="w-24 sm:w-28 shrink-0 self-stretch bg-gradient-to-b from-divine-100 to-divine-50 dark:from-[#1a1208] dark:to-[#111108] flex items-center justify-center">
        <span className="text-5xl sm:text-6xl select-none page-card-emoji">{emoji}</span>
      </div>
      <div className="flex-1 px-6 py-5 flex flex-col gap-2 justify-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-dark/60">{label}</p>
        <p className="font-serif text-base sm:text-lg text-slate-700 italic leading-relaxed">
          &ldquo;{verse}&rdquo;
        </p>
        <p className="text-sm font-semibold text-gold-dark">— {reference}</p>
      </div>
    </div>
  );
}

export function PageBackground({ symbol }: { symbol: PageSymbol }) {
  return (
    <div
      aria-hidden="true"
      className={[
        "fixed bottom-[4%] left-[2%]",
        "w-[50vw] sm:w-[35vw] lg:w-[22vw] xl:w-[18vw]",
        "lg:max-w-[300px] xl:max-w-[320px]",
        "opacity-[0.07] sm:opacity-[0.06] xl:opacity-[0.04]",
        "pointer-events-none z-0",
        "lg:[mix-blend-mode:multiply]",
      ].join(" ")}
    >
      {SVGS[symbol]}
    </div>
  );
}
