import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="min-h-screen flex flex-col bg-[#FFFEF9]">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center shadow-sm">
            <span className="text-white text-base">✝</span>
          </div>
          <span className="font-serif text-lg font-bold text-slate-800">Vida com Jesus</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className="text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors">
            Entrar
          </Link>
          <Link href="/sign-up" className="text-sm font-bold text-white bg-gradient-to-r from-[#D4A017] to-[#B8860B] px-4 py-2 rounded-xl shadow-sm hover:opacity-90 transition-opacity">
            Criar conta grátis
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#D4A017] to-[#B8860B] flex items-center justify-center shadow-lg mb-6">
          <span className="text-white text-4xl">✝</span>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
          Aprofunde sua fé.<br />Todo dia.
        </h1>

        <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-md">
          Devocionais diários, diário de oração, comunidade cristã e planos de leitura bíblica — tudo em um só lugar para crescer na fé.
        </p>

        <Link href="/sign-up" className="text-base font-bold text-white bg-gradient-to-r from-[#D4A017] to-[#B8860B] px-8 py-4 rounded-2xl shadow-md hover:opacity-90 transition-opacity mb-3">
          Começar gratuitamente ✦
        </Link>
        <p className="text-xs text-slate-400">Sem cartão · Gratuito para sempre no plano básico</p>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 w-full max-w-xl">
          {[
            { icon: "📖", label: "Devocional diário" },
            { icon: "🙏", label: "Diário de oração" },
            { icon: "🔥", label: "Sequência de fé" },
            { icon: "👥", label: "Fraternidade" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 bg-white border border-amber-100 rounded-2xl p-4 shadow-sm">
              <span className="text-2xl">{icon}</span>
              <p className="text-xs font-semibold text-slate-600 text-center leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-6 text-center border-t border-amber-100/60">
        <p className="text-xs text-slate-400 mb-2">
          © {new Date().getFullYear()} Vida com Jesus · Todos os direitos reservados
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/privacidade" className="text-xs text-slate-400 hover:text-slate-600 hover:underline">
            Política de Privacidade
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/termos" className="text-xs text-slate-400 hover:text-slate-600 hover:underline">
            Termos de Uso
          </Link>
        </div>
      </footer>
    </div>
  );
}
