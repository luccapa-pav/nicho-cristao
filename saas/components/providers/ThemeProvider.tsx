"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  premiumTheme: boolean;
  togglePremiumTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
  premiumTheme: false,
  togglePremiumTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [premiumTheme, setPremiumTheme] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("luz-theme") as Theme | null;
    const preferred = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = stored ?? preferred;
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("luz-theme-premium") === "1";
    setPremiumTheme(stored);
    document.documentElement.classList.toggle("theme-premium", stored);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("luz-theme", next);
      return next;
    });
  };

  const togglePremiumTheme = () => {
    setPremiumTheme((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("theme-premium", next);
      localStorage.setItem("luz-theme-premium", next ? "1" : "0");
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, premiumTheme, togglePremiumTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
