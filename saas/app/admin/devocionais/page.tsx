"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, CheckCircle2 } from "lucide-react";

interface Devotional {
  id: string;
  date: string;
  title: string;
  verseRef: string;
  audioUrl?: string;
}

const EMPTY = { date: "", title: "", verse: "", verseRef: "", audioUrl: "", audioDuration: "", theme: "" };

export default function AdminDevocionaisPage() {
  const [list, setList]       = useState<Devotional[]>([]);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    fetch("/api/admin/devotionals").then((r) => r.json()).then((d) => setList(d.devotionals ?? [])).catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/devotionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, audioDuration: form.audioDuration ? parseInt(form.audioDuration) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao criar"); return; }
      setList((l) => [data.devotional, ...l]);
      setForm(EMPTY);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "px-4 py-2.5 rounded-2xl border border-amber-100 bg-white text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold w-full";

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-serif text-2xl font-bold text-slate-800">Devocionais</h1>

      {/* Form */}
      <div className="divine-card p-6">
        <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-gold" /> Novo devocional
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Data *</label>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} required className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Referência * (ex: João 3:16)</label>
            <input type="text" value={form.verseRef} onChange={(e) => setForm((f) => ({ ...f, verseRef: e.target.value }))} required placeholder="João 3:16" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Título *</label>
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required placeholder="Título do devocional" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Versículo completo *</label>
            <textarea value={form.verse} onChange={(e) => setForm((f) => ({ ...f, verse: e.target.value }))} required rows={3} placeholder="Texto do versículo..." className={inputClass + " resize-none"} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">URL do áudio</label>
            <input type="url" value={form.audioUrl} onChange={(e) => setForm((f) => ({ ...f, audioUrl: e.target.value }))} placeholder="https://..." className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Duração (segundos)</label>
            <input type="number" value={form.audioDuration} onChange={(e) => setForm((f) => ({ ...f, audioDuration: e.target.value }))} placeholder="180" className={inputClass} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tema</label>
            <input type="text" value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))} placeholder="Fé, Gratidão..." className={inputClass} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={saving} className="btn-divine py-2.5 px-6 disabled:opacity-60 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Criar devocional
            </button>
            {success && <span className="flex items-center gap-1 text-sm text-green-600"><CheckCircle2 className="w-4 h-4" /> Criado!</span>}
            {error && <span className="text-sm text-red-500">{error}</span>}
          </div>
        </form>
      </div>

      {/* List */}
      <div>
        <h2 className="font-semibold text-slate-700 mb-3">Últimos 30 devocionais</h2>
        <div className="overflow-x-auto divine-card">
          <table className="w-full text-sm">
            <thead className="border-b border-divine-100">
              <tr className="text-xs text-slate-400 uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Referência</th>
                <th className="px-4 py-3 text-left">Áudio</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-b border-divine-50 hover:bg-divine-50/50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(d.date).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-slate-700 font-medium">{d.title}</td>
                  <td className="px-4 py-3 text-slate-500">{d.verseRef}</td>
                  <td className="px-4 py-3">{d.audioUrl ? <span className="text-green-500 text-xs">✓</span> : <span className="text-slate-300 text-xs">—</span>}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">Nenhum devocional cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
