"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Users, BookOpen, Heart, Bell, Menu, X, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard",    icon: Home,     label: "Início" },
  { href: "/celula",       icon: Users,    label: "Célula" },
  { href: "/oracao",       icon: Heart,    label: "Oração" },
  { href: "/devocional",   icon: BookOpen, label: "Devocional" },
];

function NavIcon({ symbol }: { symbol: string }) {
  return (
    <span className="text-xl font-serif select-none leading-none">{symbol}</span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Desktop sidebar (md+) ───────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-amber-100/60 p-6 gap-6" style={{ backgroundColor: "#FFFEF9" }}>
        {/* Logo */}
        <div className="flex items-center gap-3 pb-4 border-b border-divine-100">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine">
            <span className="text-white text-xl">✝</span>
          </div>
          <div>
            <p className="font-serif text-lg font-bold text-slate-800">Luz Divina</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Sua jornada de fé</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 ${
                    active
                      ? "bg-amber-50/80 text-gold-dark font-semibold border-l-2 border-l-gold pl-4 ml-[-2px]"
                      : "text-slate-500 hover:bg-divine-50 hover:text-slate-700"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-gold" : ""}`} />
                  <span className="text-sm">{label}</span>
                  {active && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-gold"
                    />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Perfil do usuário no rodapé */}
        <div className="flex items-center gap-3 pt-4 border-t border-divine-100">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">Maria Silva</p>
            <p className="text-[9px] text-gold-dark uppercase tracking-[0.15em]">Premium</p>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-300 hover:text-gold-dark transition-colors cursor-pointer flex-shrink-0" />
        </div>
      </aside>

      {/* ── Mobile top bar ──────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 backdrop-blur-md border-b border-amber-100/60 px-4 h-14 flex items-center justify-between" style={{ backgroundColor: "#FFFEF9F0", paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-sm">
            <span className="text-white text-sm">✝</span>
          </div>
          <p className="font-serif text-sm font-bold text-slate-800">Luz Divina</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-divine-50 flex items-center justify-center text-slate-500">
            <Bell className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="w-8 h-8 rounded-full bg-divine-50 flex items-center justify-center text-slate-500"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, x: "100%" }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: "100%" }}
          className="md:hidden fixed top-14 right-0 bottom-0 w-64 border-l border-amber-100/60 z-20 p-5 flex flex-col gap-2"
          style={{ backgroundColor: "#FFFEF9" }}
        >
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                  active ? "bg-divine-100 text-gold-dark font-semibold" : "text-slate-500 hover:bg-divine-50"
                }`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{label}</span>
                </div>
              </Link>
            );
          })}
        </motion.div>
      )}

      {/* ── Mobile bottom nav ───────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 backdrop-blur-md border-t border-amber-100/60 flex" style={{ backgroundColor: "#FFFEF9F0", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="flex-1">
              <div className={`relative flex flex-col items-center gap-0.5 py-2 transition-all ${
                active ? "text-gold" : "text-slate-400"
              }`}>
                {active && (
                  <motion.div
                    layoutId="bottom-indicator"
                    className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-gold"
                  />
                )}
                <Icon className={`w-5 h-5 ${active ? "text-gold" : ""}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
