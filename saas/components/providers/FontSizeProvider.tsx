"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

type FontSize = "normal" | "large";

interface FontSizeContextValue {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextValue>({
  fontSize: "normal",
  setFontSize: () => {},
});

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("normal");

  useEffect(() => {
    const stored = (localStorage.getItem("luz-font-size") as FontSize) ?? "normal";
    setFontSizeState(stored);
    document.documentElement.classList.toggle("font-large", stored === "large");
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    document.documentElement.classList.toggle("font-large", size === "large");
    localStorage.setItem("luz-font-size", size);
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export const useFontSize = () => useContext(FontSizeContext);
