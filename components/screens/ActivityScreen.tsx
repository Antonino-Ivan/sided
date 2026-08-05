"use client";

import { useMemo, useRef, useState } from "react";
import { AtSign, Bell, BellOff, ChevronDown, Flame, Heart, MessageCircle, Search, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { timeAgo, normalize } from "@/lib/format";
import type { NotificationKind } from "@/lib/types";
import { parseHash } from "@/lib/router";
import type { Route } from "@/lib/router";
import { useSided } from "@/state/context";
import { unreadNotifications } from "@/state/selectors";
import { useReveal } from "@/hooks/ui";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, SectionHeading, revealDelay } from "@/components/ui/Controls";

const notificationIcons: Record<NotificationKind, LucideIcon> = {
  reply: AtSign,
  follow: UserPlus,
  trending: Flame,
  like: Heart,
  choice: MessageCircle,
};

/** Notifiche e conversazioni: entrambe con conteggi reali di "non letto". */
export function ActivityScreen({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const { notifications, conversations, messages, state, actions, peopleById, now } = useSided();
  const viewRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState(true);
  const [query, setQuery] = useState("");

  const unread = useMemo(
    () => unreadNotifications(notifications, state.readNotifications),
    [notifications, state.readNotifications],
  );

  const chats = useMemo(() => {
    return conversations
      .map((conversation) => {
        const person = peopleById.get(conversation.personId);
        const thread = messages.filter((message) => message.conversationId === conversation.id);
        const last = thread[thread.length - 1];
        const seenAt = state.chatSeen[conversation.id] ?? 0;
        const unreadCount = thread.filter(
          (message) => message.from === "them" && message.createdAt > seenAt,
        ).length;
        return { conversation, person, last, unreadCount };
      })
      .filter((entry) => Boolean(entry.person))
      .filter((entry) => {
        if (!query.trim()) return true;
        const haystack = normalize(
          `${entry.person?.name ?? ""} ${entry.person?.handle ?? ""} ${entry.last?.body ?? ""}`,
        );
        return haystack.includes(normalize(query));
      })
      .sort((a, b) => (b.last?.createdAt ?? 0) - (a.last?.createdAt ?? 0));
  }, [conversations, messages, peopleById, state.chatSeen, query]);

  const onlineCount = conversations.filter((conversation) => conversation.online).length;

  useReveal(viewRef, [expanded, chats.length, unread.length]);

  return (
    <section className="screen screen--page activity" ref={viewRef}>
      <div className="page-title" data-reveal>
        <p className="eyebrow">ATTIVITÀ</p>
        <h2>
          Notifiche e
          <br />
          conversazioni.
        </h2>
      </div>

      <section className={`notification-group ${expanded ? "is-open" : ""}`} data-reveal style={revealDelay(1)}>
        <button
          type="button"
          className="notification-group__summary"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          <span className="notification-group__icon">
            {state.preferences.notifications ? <Bell aria-hidden="true" /> : <BellOff aria-hidden="true" />}
            {unread.length > 0 && <i>{unread.length}</i>}
          </span>
          <span>
            <strong>Notifiche</strong>
            <small>
              {unread.length > 0
                ? `${unread.length} ${unread.length === 1 ? "nuova" : "nuove"} · risposte, follower e risultati`
                : "Nessuna novità da leggere"}
            </small>
          </span>
          <ChevronDown aria-hidden="true" />
        </button>

        {expanded && (
          <div className="notification-list">
            {notifications.map((notification, index) => {
              const Icon = notificationIcons[notification.kind];
              const isUnread = !state.readNotifications.includes(notification.id);
              return (
                <button
                  key={notification.id}
                  type="button"
                  className={`notification ${isUnread ? "is-unread" : ""}`}
                  data-reveal
                  style={revealDelay(index, 26)}
                  onClick={() => {
                    actions.markNotificationsRead([notification.id]);
                    if (notification.href) onNavigate(parseHash(notification.href));
                  }}
                >
                  <span className={`notification__icon notification__icon--${notification.kind}`}>
                    <Icon aria-hidden="true" />
                  </span>
                  <span className="notification__copy">
                    <strong>{notification.title}</strong>
                    <small>{notification.detail}</small>
                  </span>
                  <time dateTime={new Date(notification.createdAt).toISOString()}>
                    {timeAgo(notification.createdAt, now)}
                  </time>
                </button>
              );
            })}

            {unread.length > 0 && (
              <button
                type="button"
                className="link-button notification-list__read-all"
                onClick={() => {
                  actions.markNotificationsRead(notifications.map((item) => item.id));
                  actions.toast("Notifiche segnate come lette", "success");
                }}
              >
                Segna tutte come lette
              </button>
            )}
          </div>
        )}
      </section>

      <section className="chats-section" data-reveal style={revealDelay(2)}>
        <SectionHeading
          eyebrow="MESSAGGI"
          title="Chat"
          aside={<span className="pill">{onlineCount} online</span>}
        />

        <label className="search-box search-box--compact">
          <Search aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cerca una conversazione"
            aria-label="Cerca una conversazione"
            type="search"
          />
        </label>

        {chats.length === 0 ? (
          <EmptyState title="Nessuna conversazione" detail="Prova con un altro nome." />
        ) : (
          <div className="chat-list">
            {chats.map((entry, index) => (
              <button
                key={entry.conversation.id}
                type="button"
                className="chat-row"
                data-reveal
                style={revealDelay(index, 28)}
                onClick={() => onNavigate({ name: "chat", conversationId: entry.conversation.id })}
              >
                <Avatar person={entry.person} online={entry.conversation.online} />
                <span className="chat-row__copy">
                  <strong>{entry.person?.name}</strong>
                  <small>
                    {entry.last?.from === "me" && "Tu: "}
                    {entry.last?.body ?? "Nessun messaggio"}
                  </small>
                </span>
                <span className="chat-row__meta">
                  {entry.last && <time>{timeAgo(entry.last.createdAt, now)}</time>}
                  {entry.unreadCount > 0 && <b>{entry.unreadCount}</b>}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
