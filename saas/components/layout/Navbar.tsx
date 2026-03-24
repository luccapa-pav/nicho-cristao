"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Users, BookOpen, Heart, Bell, Menu, X, LogOut, UserCircle, Moon, Sun, BookMarked } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useFontSize } from "@/components/providers/FontSizeProvider";
import { NotificationPrompt } from "@/components/ui/NotificationPrompt";
import { NotificationDropdown } from "@/components/ui/NotificationDropdown";
import { OnboardingModal } from "@/components/ui/OnboardingModal";

const NAV_ITEMS = [
  { href: "/dashboard",      icon: Home,        label: "Início" },
  { href: "/fraternidade",   icon: Users,       label: "Fraternidade" },
  { href: "/oracao",         icon: Heart,       label: "Oração" },
  { href: "/diario",         icon: BookMarked,  label: "Diário" },
  { href: "/plano-leitura",  icon: BookOpen,    label: "Plano de Leitura" },
  { href: "/perfil",         icon: UserCircle,  label: "Perfil" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "Usuário";
  const userInitial = userName[0].toUpperCase();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setNotifEnabled(localStorage.getItem("notif") === "on");
  }, []);

  useEffect(() => {
    const fetchCount = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount ?? 0);
        }
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    const onVisibility = () => { if (!document.hidden) fetchCount(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  const handleBellClick = () => setNotifOpen((v) => !v);

  const handleNotifDismiss = () => {
    setNotifOpen(false);
    setNotifEnabled(localStorage.getItem("notif") === "on");
  };

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => { if (d.avatarUrl) setAvatarUrl(d.avatarUrl); })
      .catch(() => {});
  }, []);

  return (
    <>
      <OnboardingModal />

      {/* ── Desktop sidebar (md+) ───────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 h-screen sticky top-0 border-r border-amber-100/60 p-6 gap-6" style={{ backgroundColor: "#FFFEF9" }}>
        {/* Logo */}
        <div className="flex items-center gap-3.5 pb-5 border-b border-divine-100">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-divine flex-shrink-0">
            <span className="text-white text-2xl">✝</span>
          </div>
          <div className="flex flex-col justify-center">
            <p className="font-serif text-[17px] font-bold text-slate-900 tracking-tight leading-none">Luz Divina</p>
            <p className="mt-1.5 text-[9.5px] font-semibold tracking-[0.22em] text-gold-dark/70 leading-none uppercase">Sua jornada de fé</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 ${
                  active
                    ? "bg-amber-50/80 text-gold-dark font-semibold border-l-2 border-l-gold pl-4 ml-[-2px]"
                    : "text-slate-600 hover:bg-divine-50 hover:text-slate-800"
                }`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-gold" : ""}`} />
                  <span className="text-base">{label}</span>
                  {active && (
                    <motion.div layoutId="nav-indicator" className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Controles de acessibilidade */}
        <div className="flex items-center gap-1.5 pt-3 border-t border-divine-100">
          <button
            onClick={() => setFontSize("large")}
            aria-label="Aumentar fonte"
            title="Aumentar fonte"
            className={`px-2 py-1 rounded-lg text-xs border transition-all ${fontSize === "large" ? "border-gold text-gold-dark bg-amber-50" : "border-divine-200 text-slate-500 hover:border-gold hover:text-gold-dark"}`}
          >
            A+
          </button>
          <button
            onClick={() => setFontSize("normal")}
            aria-label="Fonte normal"
            title="Fonte normal"
            className={`px-2 py-1 rounded-lg text-xs border transition-all ${fontSize === "normal" ? "border-gold text-gold-dark bg-amber-50" : "border-divine-200 text-slate-500 hover:border-gold hover:text-gold-dark"}`}
          >
            A-
          </button>
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
            title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            className="ml-auto p-1.5 rounded-lg border border-divine-200 text-slate-500 hover:border-gold hover:text-gold-dark transition-all"
          >
            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Perfil no rodapé */}
        <Link href="/perfil">
          <div className="flex items-center gap-3 pt-4 border-t border-divine-100 group cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 overflow-hidden">
              {avatarUrl
                ? <Image src={avatarUrl} alt={userName} width={32} height={32} className="w-full h-full object-cover" />
                : userInitial
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-gold-dark transition-colors">{userName}</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-[0.15em]">Ver perfil</p>
            </div>
            <button
              onClick={(e) => { e.preventDefault(); signOut({ callbackUrl: "/sign-in" }); }}
              aria-label="Sair"
              className="flex-shrink-0 p-1 rounded-md text-slate-300 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </Link>
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
          <div className="relative">
            <button
              onClick={handleBellClick}
              aria-label="Notificações"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                notifEnabled
                  ? "bg-amber-50 text-gold-dark"
                  : "bg-divine-50 text-slate-500"
              }`}
            >
              <Bell className={`w-4 h-4 ${notifEnabled ? "fill-gold/30" : ""}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 w-[min(18rem,calc(100vw-1rem))] z-50"
                >
                  {notifEnabled ? (
                    <div className="divine-card overflow-hidden shadow-divine">
                      <NotificationDropdown onClose={() => setNotifOpen(false)} />
                    </div>
                  ) : (
                    <NotificationPrompt onDismiss={handleNotifDismiss} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileOpen}
            className="w-8 h-8 rounded-full bg-divine-50 flex items-center justify-center text-slate-500"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            className="md:hidden fixed top-14 right-0 bottom-0 w-3/4 max-w-xs border-l border-amber-100/60 z-20 p-5 flex flex-col gap-2"
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
            <div className="mt-auto pt-4 border-t border-divine-100 flex flex-col gap-2">
              {/* Acessibilidade mobile */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => setFontSize("large")} className={`px-2 py-1 rounded-lg text-xs border transition-all ${fontSize === "large" ? "border-gold text-gold-dark bg-amber-50" : "border-divine-200 text-slate-500"}`}>A+</button>
                <button onClick={() => setFontSize("normal")} className={`px-2 py-1 rounded-lg text-xs border transition-all ${fontSize === "normal" ? "border-gold text-gold-dark bg-amber-50" : "border-divine-200 text-slate-500"}`}>A-</button>
                <button onClick={toggleTheme} className="ml-auto p-1.5 rounded-lg border border-divine-200 text-slate-500 transition-all">
                  {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/sign-in" })}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-50 w-full transition-all"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile bottom nav (sem Perfil — fica no drawer) ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 backdrop-blur-md border-t border-amber-100/60 flex" style={{ backgroundColor: "#FFFEF9F0", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {NAV_ITEMS.slice(0, 4).map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="flex-1" aria-label={label}>
              <div className={`relative flex flex-col items-center gap-1 py-2.5 transition-all ${active ? "text-gold" : "text-slate-500"}`}>
                {active && (
                  <motion.div layoutId="bottom-indicator" className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-gold" />
                )}
                <Icon className={`w-6 h-6 ${active ? "text-gold" : ""}`} />
                <span className="text-xs font-medium">{label}</span>
              </div>
            </Link>
          );
        })}
        {/* Avatar no lugar do 5º item no mobile */}
        <Link href="/perfil" className="flex-1" aria-label="Perfil">
          <div className={`relative flex flex-col items-center gap-0.5 py-2 transition-all ${pathname.startsWith("/perfil") ? "text-gold" : "text-slate-400"}`}>
            {pathname.startsWith("/perfil") && (
              <motion.div layoutId="bottom-indicator" className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-gold" />
            )}
            <div className="w-5 h-5 rounded-full overflow-hidden bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center">
              {avatarUrl
                ? <Image src={avatarUrl} alt="Perfil" width={20} height={20} className="w-full h-full object-cover" />
                : <span className="text-white text-[8px] font-bold">{userInitial}</span>
              }
            </div>
            <span className="text-[10px] font-medium">Perfil</span>
          </div>
        </Link>
      </nav>
    </>
  );
}
