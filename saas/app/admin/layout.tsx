import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FFFEF9]">
      <header className="border-b border-amber-100 px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-sm">
            <span className="text-white text-sm">✝</span>
          </div>
          <span className="font-serif font-bold text-slate-800">Admin</span>
        </div>
        <nav className="flex items-center gap-4 ml-6 text-sm">
          <Link href="/admin" className="text-slate-500 hover:text-gold-dark transition-colors">Dashboard</Link>
          <Link href="/admin/devocionais" className="text-slate-500 hover:text-gold-dark transition-colors">Devocionais</Link>
          <Link href="/admin/usuarios" className="text-slate-500 hover:text-gold-dark transition-colors">Usuários</Link>
        </nav>
        <div className="ml-auto">
          <Link href="/dashboard" className="text-xs text-slate-400 hover:text-gold-dark transition-colors">← App</Link>
        </div>
      </header>
      <main className="p-6 max-w-5xl mx-auto">{children}</main>
    </div>
  );
}
