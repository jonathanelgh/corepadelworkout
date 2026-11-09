"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode, type RefObject } from "react";

export type CoachFormChromeState = {
  mode: "steps" | "overview";
  progress: number;
  label: string;
  title: string;
  canGoBack: boolean;
};

type CoachFormChromeContextValue = {
  chrome: CoachFormChromeState | null;
  setChrome: (next: CoachFormChromeState | null) => void;
  backRef: RefObject<(() => void) | null>;
};

const CoachFormChromeContext = createContext<CoachFormChromeContextValue | null>(null);

export function CoachFormChromeProvider({ children }: { children: ReactNode }) {
  const [chrome, setChromeState] = useState<CoachFormChromeState | null>(null);
  const backRef = useRef<(() => void) | null>(null);

  const setChrome = useCallback((next: CoachFormChromeState | null) => {
    setChromeState((prev) => {
      if (prev === next) return prev;
      if (!prev || !next) return next;
      if (
        prev.mode === next.mode &&
        prev.progress === next.progress &&
        prev.label === next.label &&
        prev.title === next.title &&
        prev.canGoBack === next.canGoBack
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  return (
    <CoachFormChromeContext.Provider value={{ chrome, setChrome, backRef }}>
      {children}
    </CoachFormChromeContext.Provider>
  );
}

export function useCoachFormChrome() {
  return useContext(CoachFormChromeContext);
}
