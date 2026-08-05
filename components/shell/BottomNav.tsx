"use client";

import { Bell, House, Plus, UserRound, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route, TabId } from "@/lib/router";

const items: Array<{ id: TabId; icon: LucideIcon; label: string; route: Route }> = [
  { id: "home", icon: House, label: "Home", route: { name: "home" } },
  { id: "friends", icon: Users, label: "Amici", route: { name: "friends" } },
  { id: "create", icon: Plus, label: "Crea", route: { name: "create" } },
  { id: "activity", icon: Bell, label: "Attività", route: { name: "activity" } },
  { id: "profile", icon: UserRound, label: "Profilo", route: { name: "profile" } },
];

export function BottomNav({
  active,
  unread,
  onNavigate,
}: {
  active: TabId;
  unread: number;
  onNavigate: (route: Route) => void;
}) {
  const activeIndex = Math.max(0, items.findIndex((item) => item.id === active));

  return (
    <nav className="bottom-nav" aria-label="Navigazione principale">
      <span
        className="bottom-nav__indicator"
        aria-hidden="true"
        style={{ transform: `translate3d(calc(${activeIndex * 100}% + ${activeIndex * 4}px), 0, 0)` }}
      />
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`${isActive ? "is-active" : ""} ${item.id === "create" ? "is-create" : ""}`}
            onClick={() => onNavigate(item.route)}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              <Icon strokeWidth={2.15} />
            </span>
            <small>{item.label}</small>
            {item.id === "activity" && unread > 0 && (
              <i aria-label={`${unread} notifiche non lette`}>{unread > 9 ? "9+" : unread}</i>
            )}
          </button>
        );
      })}
    </nav>
  );
}
