"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ToastProps {
  message: string;
  duration?: number;
  onDone?: () => void;
  type?: "success" | "info" | "error";
}

export function Toast({ message, duration = 3000, onDone, type = "success" }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  const bg =
    type === "error"
      ? "bg-red-700"
      : type === "info"
      ? "bg-zinc-700"
      : "bg-slate-800";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-[200] ${bg} text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg pointer-events-none whitespace-nowrap max-w-[90vw] text-center`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Hook-like helper for managing toast state ──────────────────────────────
import { useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type?: "success" | "info" | "error"; key: number } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "info" | "error" = "success") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const ToastElement = toast ? (
    <Toast key={toast.key} message={toast.message} type={toast.type} onDone={() => setToast(null)} />
  ) : null;

  return { showToast, ToastElement };
}
