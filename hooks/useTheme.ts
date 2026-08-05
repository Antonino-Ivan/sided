"use client";

import { useEffect } from "react";
import type { ThemeMode } from "@/lib/types";

/**
 * Applica il tema all'elemento `<html>`.
 *
 * Sta in un effect (e non nel render) perché tocca il DOM fuori da React;
 * `color-scheme` serve a far seguire il tema anche a scrollbar, campi form e
 * controlli nativi.
 */
export function useApplyTheme(mode: ThemeMode): void {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const resolved = mode === "system" ? (media.matches ? "dark" : "light") : mode;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    };

    apply();
    if (mode !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [mode]);
}
