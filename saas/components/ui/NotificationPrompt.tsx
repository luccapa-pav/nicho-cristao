"use client";

import { useState } from "react";
import { X, Bell } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";

interface NotificationPromptProps {
  onDismiss: () => void;
}

export function NotificationPrompt({ onDismiss }: NotificationPromptProps) {
  const [granted, setGranted] = useState(false);
  const { isPremium } = usePlan();

  const handleActivate = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      localStorage.setItem("notif", "on");
      setGranted(true);
      if (isPremium) {
        try {
          const { requestFcmToken } = await import("@/lib/firebase-client");
          const token = await requestFcmToken();
          if (token) {
            await fetch("/api/fcm/token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });
          }
        } catch {
          // FCM optional — proceed silently
        }
      }
      setTimeout(onDismiss, 1800);
    } else {
      localStorage.setItem("notif", "dismissed");
      onDismiss();
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("notif", "dismissed");
    onDismiss();
  };

  return (
    <div className="divine-card p-4 flex items-center gap-3 border-l-2 border-l-gold/60">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold/20 to-amber-100 flex items-center justify-center flex-shrink-0">
        <Bell className="w-4 h-4 text-gold-dark" />
      </div>
      <div className="flex-1 min-w-0">
        {granted ? (
          <p className="text-sm font-semibold text-emerald-700">✓ Lembretes ativados!</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-slate-700 leading-tight">Ative lembretes para não perder sua ofensiva 🔥</p>
            <button
              onClick={handleActivate}
              className="mt-1.5 text-xs font-semibold text-gold-dark hover:underline"
            >
              Ativar notificações
            </button>
          </>
        )}
      </div>
      {!granted && (
        <button
          onClick={handleDismiss}
          aria-label="Dispensar"
          className="flex-shrink-0 p-1 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
