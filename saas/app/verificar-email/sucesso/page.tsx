import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function VerificacaoSucessoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFEF9] px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine mb-3">
            <span className="text-white text-2xl">✝</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-slate-800">Vida com Jesus</h1>
        </div>
        <div className="divine-card p-8 flex flex-col items-center gap-4">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
          <h2 className="font-serif text-xl font-bold text-slate-800">Email confirmado!</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Sua conta foi verificada com sucesso. Que sua jornada de fé seja abençoada! 🙏
          </p>
          <Link href="/dashboard" className="btn-divine py-3 px-8 mt-2">
            Ir para o app
          </Link>
        </div>
      </div>
    </div>
  );
}
