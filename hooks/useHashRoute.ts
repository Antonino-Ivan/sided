"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { HOME, parseHash, routeToHash, sameRoute } from "@/lib/router";
import type { Route } from "@/lib/router";

/**
 * Sorgente di verità della navigazione: l'URL.
 *
 * Il vecchio prototipo teneva la schermata attiva in `useState`, quindi
 * niente era condivisibile e il tasto "indietro" usciva dall'app. Qui ogni
 * schermata ha un suo hash, avanti/indietro funzionano e un link a una
 * singola scelta si può incollare in chat.
 */

const listeners = new Set<() => void>();

function currentHash(): string {
  if (typeof window === "undefined") return "#/";
  return window.location.hash || "#/";
}

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1 && typeof window !== "undefined") {
    window.addEventListener("hashchange", notify);
    window.addEventListener("popstate", notify);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size && typeof window !== "undefined") {
      window.removeEventListener("hashchange", notify);
      window.removeEventListener("popstate", notify);
    }
  };
}

export type Navigate = (route: Route, options?: { replace?: boolean }) => void;

export function useHashRoute(): { route: Route; navigate: Navigate; back: () => void } {
  const hash = useSyncExternalStore(subscribe, currentHash, () => "#/");
  const route = useMemo(() => parseHash(hash), [hash]);

  const navigate = useCallback<Navigate>((next, options) => {
    if (typeof window === "undefined") return;
    const target = routeToHash(next);
    if (target === (window.location.hash || "#/")) return;
    if (options?.replace) {
      window.history.replaceState(null, "", target);
      notify();
    } else {
      // Assegnare l'hash spinge una voce nella history e fa scattare l'evento.
      window.location.hash = target.slice(1);
    }
  }, []);

  const back = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) window.history.back();
    else navigate(HOME, { replace: true });
  }, [navigate]);

  return { route, navigate, back };
}

export { HOME, sameRoute };
export type { Route };
