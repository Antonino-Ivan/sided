"use client";

import { ArrowLeft, Search } from "lucide-react";
import { Segmented } from "@/components/ui/Controls";
import type { Route } from "@/lib/router";
import type { FeedMode } from "@/lib/types";

const feedOptions: Array<{ value: FeedMode; label: string }> = [
  { value: "perte", label: "Per te" },
  { value: "trend", label: "Trend" },
  { value: "seguiti", label: "Seguiti" },
];

const titles: Record<Route["name"], string> = {
  home: "Home",
  choice: "Discussione",
  explore: "Esplora",
  friends: "Amici",
  create: "Crea",
  activity: "Attività",
  chat: "Chat",
  profile: "Profilo",
  person: "Profilo",
};

/** Le schermate raggiunte da un'altra schermata mostrano "indietro". */
const deepRoutes = new Set<Route["name"]>(["choice", "chat", "person", "explore"]);

export function TopBar({
  route,
  title,
  feed,
  onFeedChange,
  onNavigate,
  onBack,
  compact,
  showFeedSwitcher,
}: {
  route: Route;
  title?: string;
  feed: FeedMode;
  onFeedChange: (mode: FeedMode) => void;
  onNavigate: (route: Route) => void;
  onBack: () => void;
  compact: boolean;
  showFeedSwitcher: boolean;
}) {
  const isHome = route.name === "home";
  const isDeep = deepRoutes.has(route.name);

  return (
    <header className={`topbar ${compact ? "is-compact" : ""} ${isHome ? "topbar--home" : ""}`}>
      {isDeep ? (
        <button type="button" className="icon-button" onClick={onBack} aria-label="Indietro">
          <ArrowLeft aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          className="wordmark"
          onClick={() => onNavigate({ name: "home" })}
          aria-label="Vai alla home"
        >
          <img src="/sided-icon.png" alt="" width={28} height={28} />
          <span>SIDED</span>
        </button>
      )}

      {isHome && showFeedSwitcher ? (
        <Segmented
          options={feedOptions}
          value={feed}
          onChange={onFeedChange}
          label="Modalità del feed"
          size="sm"
        />
      ) : (
        <span className="topbar__title">{title ?? titles[route.name]}</span>
      )}

      {route.name === "explore" ? (
        // Su Esplora il bottone sarebbe un no-op: teniamo solo l'equilibrio del layout.
        <span className="topbar__spacer" aria-hidden="true" />
      ) : (
        <button
          type="button"
          className="topbar__search"
          onClick={() => onNavigate({ name: "explore" })}
          aria-label="Apri Esplora"
        >
          <Search aria-hidden="true" />
          <span>Esplora</span>
        </button>
      )}
    </header>
  );
}
