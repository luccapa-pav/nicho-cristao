"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type FontSize = "normal" | "large" | "xlarge";

interface FontSizeContextValue {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  reduceMotion: boolean;
  setReduceMotion: (v: boolean) => void;
}

const FontSizeContext = createContext<FontSizeContextValue>({
  fontSize: "normal",
  setFontSize: () => {},
  reduceMotion: false,
  setReduceMotion: () => {},
});

function applyFontClass(size: FontSize) {
  document.documentElement.classList.remove("font-large", "font-xlarge");
  if (size === "large")  document.documentElement.classList.add("font-large");
  if (size === "xlarge") document.documentElement.classList.add("font-xlarge");
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("normal");
  const [reduceMotion, setReduceMotionState] = useState(false);

  useEffect(() => {
    const storedSize = (localStorage.getItem("luz-font-size") as FontSize) ?? "normal";
    const storedMotion = localStorage.getItem("luz-reduce-motion") === "true";

    setFontSizeState(storedSize);
    applyFontClass(storedSize);

    setReduceMotionState(storedMotion);
    document.documentElement.classList.toggle("reduce-motion", storedMotion);
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    applyFontClass(size);
    localStorage.setItem("luz-font-size", size);
  };

  const setReduceMotion = (v: boolean) => {
    setReduceMotionState(v);
    document.documentElement.classList.toggle("reduce-motion", v);
    localStorage.setItem("luz-reduce-motion", String(v));
  };

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, reduceMotion, setReduceMotion }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export const useFontSize = () => useContext(FontSizeContext);
