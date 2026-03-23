"use client";

import { useEffect, useState } from "react";
import { Users, Heart, BookOpen, TrendingUp, Flame } from "lucide-react";

interface Stats {
  totalUsers: number;
  byPlan: { FREE?: number; PREMIUM?: number; FAMILY?: number };
  prayersToday: number;
  avgStreak: number;
  longestStreak: number;
  devotionalCompletionsToday: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats).catch(() => {});
  }, []);

  if (!stats) {
    return <div className="animate-pulse flex flex-col gap-4">{Array.from({length:6}).map((_,i)=><div key={i} className="h-24 divine-card bg-divine-50"/>)}</div>;
  }

  const cards = [
    { label: "Usuários totais", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Plano Free", value: stats.byPlan.FREE ?? 0, icon: Users, color: "text-slate-400" },
    { label: "Plano Premium", value: stats.byPlan.PREMIUM ?? 0, icon: TrendingUp, color: "text-gold-dark" },
    { label: "Orações hoje", value: stats.prayersToday, icon: Heart, color: "text-red-400" },
    { label: "Devocionais hoje", value: stats.devotionalCompletionsToday, icon: BookOpen, color: "text-green-500" },
    { label: "Streak médio", value: `${stats.avgStreak} dias`, icon: Flame, color: "text-orange-400" },
    { label: "Maior streak", value: `${stats.longestStreak} dias`, icon: Flame, color: "text-orange-600" },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="divine-card p-5 flex flex-col gap-3">
            <Icon className={`w-5 h-5 ${color}`} />
            <div>
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
