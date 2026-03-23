"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  plan: string;
  emailVerified: string | null;
  createdAt: string;
  streak?: { currentStreak: number };
}

export default function AdminUsuariosPage() {
  const [users, setUsers]     = useState<User[]>([]);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/users?page=${page}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d.users ?? []); setPages(d.pages ?? 1); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  const planBadge = (plan: string) => {
    if (plan === "PREMIUM") return <span className="px-2 py-0.5 rounded-full bg-amber-100 text-gold-dark text-xs font-semibold">Premium</span>;
    if (plan === "FAMILY") return <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">Family</span>;
    return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">Free</span>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-slate-800">Usuários</h1>
        <span className="text-sm text-slate-400">{total} no total</span>
      </div>

      {loading ? (
        <div className="animate-pulse divine-card h-64" />
      ) : (
        <div className="overflow-x-auto divine-card">
          <table className="w-full text-sm">
            <thead className="border-b border-divine-100">
              <tr className="text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Plano</th>
                <th className="px-4 py-3 text-left">Streak</th>
                <th className="px-4 py-3 text-left">Email verificado</th>
                <th className="px-4 py-3 text-left">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-divine-50 hover:bg-divine-50/50">
                  <td className="px-4 py-3 font-medium text-slate-700">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">{planBadge(u.plan)}</td>
                  <td className="px-4 py-3 text-slate-600">{u.streak?.currentStreak ?? 0} dias</td>
                  <td className="px-4 py-3">
                    {u.emailVerified
                      ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                      : <Clock className="w-4 h-4 text-amber-400" />
                    }
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page === 1} className="p-2 rounded-xl border border-divine-200 disabled:opacity-40 hover:border-gold transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-slate-500">{page} / {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p+1))} disabled={page === pages} className="p-2 rounded-xl border border-divine-200 disabled:opacity-40 hover:border-gold transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
