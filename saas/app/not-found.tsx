import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFEF9] px-4">
      <div className="text-center max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine">
            <span className="text-white text-3xl">✝</span>
          </div>
        </div>
        <h1 className="font-serif text-6xl font-bold text-gold mb-2">404</h1>
        <h2 className="font-serif text-xl font-semibold text-slate-800 mb-3">Página não encontrada</h2>
        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          &ldquo;Porque eu sei os planos que tenho para você&rdquo; — mas esta página não é um deles. 😊
        </p>
        <Link href="/dashboard" className="btn-divine py-3 px-8">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
