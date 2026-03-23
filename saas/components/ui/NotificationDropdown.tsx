"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Heart, Users, BookOpen, Flame, X } from "lucide-react";
import Link from "next/link";

interface NotifItem {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

function notifIcon(type: string) {
  switch (type) {
    case "REACTION":   return <Heart className="w-4 h-4 text-rose-500" />;
    case "PRAYED":     return <span className="text-base">🙏</span>;
    case "GROUP_JOIN": return <Users className="w-4 h-4 text-divine-500" />;
    case "DEVOTIONAL": return <BookOpen className="w-4 h-4 text-gold-dark" />;
    case "STREAK_RISK": return <Flame className="w-4 h-4 text-orange-500" />;
    default:           return <Bell className="w-4 h-4 text-slate-400" />;
  }
}

export function NotificationDropdown({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = items.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col max-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-divine-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-gold-dark" />
          <p className="text-sm font-bold text-slate-700">Notificações</p>
          {unreadCount > 0 && (
            <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] text-gold-dark font-semibold hover:underline"
            >
              Marcar todas como lidas
            </button>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10 px-4">
            <p className="text-2xl mb-2">🌟</p>
            <p className="text-sm font-semibold text-slate-600">Nenhuma notificação ainda</p>
            <p className="text-xs text-slate-400 mt-1">Quando alguém interagir com você, aparecerá aqui</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map((notif) => {
              const inner = (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-divine-50 transition-colors hover:bg-divine-50/60 ${
                    !notif.read ? "bg-amber-50/60" : "bg-white"
                  }`}
                  onClick={onClose}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    !notif.read ? "bg-gold/10 border border-gold/20" : "bg-divine-50"
                  }`}>
                    {notifIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 leading-tight">{notif.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.body}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(notif.createdAt)}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-gold shrink-0 mt-2" />
                  )}
                </motion.div>
              );

              return notif.link ? (
                <Link key={notif.id} href={notif.link}>{inner}</Link>
              ) : (
                <div key={notif.id}>{inner}</div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
