"use client";

import { useMemo, useRef } from "react";
import { UserPlus, UserRoundSearch } from "lucide-react";
import { formatCount, sideLabel, timeAgo } from "@/lib/format";
import type { Route } from "@/lib/router";
import { useSided } from "@/state/context";
import { simulatedPick } from "@/state/selectors";
import { useReveal } from "@/hooks/ui";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, SectionHeading, revealDelay } from "@/components/ui/Controls";

/**
 * Amici: cosa hanno scelto le persone che segui, e chi vale la pena seguire.
 * Il pulsante "Segui" cambia davvero il feed "Seguiti".
 */
export function FriendsScreen({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const { choices, people, state, actions, now } = useSided();
  const viewRef = useRef<HTMLElement>(null);

  const following = useMemo(
    () => people.filter((person) => state.following.includes(person.id)),
    [people, state.following],
  );

  const suggested = useMemo(
    () =>
      people
        .filter((person) => person.id !== "me" && !state.following.includes(person.id))
        .sort((a, b) => b.followers - a.followers),
    [people, state.following],
  );

  /** Un'attività per persona seguita: la sua scelta più recente e cosa ha votato. */
  const activity = useMemo(() => {
    return following
      .flatMap((person) => {
        const authored = choices.filter((choice) => choice.authorId === person.id);
        const target = authored[0] ?? choices[people.indexOf(person) % choices.length];
        if (!target) return [];
        return [
          {
            person,
            choice: target,
            authored: authored.length > 0,
            pick: simulatedPick(person.id, target),
          },
        ];
      })
      .sort((a, b) => b.choice.createdAt - a.choice.createdAt);
  }, [following, choices, people]);

  useReveal(viewRef, [activity.length, state.following.length]);

  return (
    <section className="screen screen--page friends" ref={viewRef}>
      <div className="page-title" data-reveal>
        <p className="eyebrow">DALLA TUA CERCHIA</p>
        <h2>
          Le scelte dei
          <br />
          tuoi amici.
        </h2>
        <p>Scopri da che parte stanno le persone che segui.</p>
      </div>

      {following.length > 0 && (
        <div className="friends-strip" aria-label="Persone che segui" data-reveal style={revealDelay(1)}>
          {following.map((person) => (
            <button
              key={person.id}
              type="button"
              onClick={() => onNavigate({ name: "person", handle: person.handle })}
            >
              <Avatar person={person} size="lg" />
              <small>{person.name.split(" ")[0]}</small>
            </button>
          ))}
        </div>
      )}

      {activity.length === 0 ? (
        <EmptyState
          icon={<UserRoundSearch aria-hidden="true" />}
          title="Non segui ancora nessuno"
          detail="Segui qualcuno qui sotto per vedere le sue scelte."
        />
      ) : (
        <div className="friend-feed">
          {activity.map((entry, index) => {
            const pickIndex = entry.choice.options.findIndex((option) => option.id === entry.pick);
            return (
              <article className="friend-post" key={entry.person.id} data-reveal style={revealDelay(index)}>
                <header>
                  <Avatar person={entry.person} />
                  <span>
                    <strong>{entry.person.name}</strong>
                    <small>
                      {entry.person.handle} · {timeAgo(entry.choice.createdAt, now)}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => onNavigate({ name: "person", handle: entry.person.handle })}
                  >
                    Profilo
                  </button>
                </header>

                <p className="friend-post__lead">
                  {entry.authored ? "Ha lanciato questa scelta e sta con " : "Ha scelto "}
                  <strong>{entry.choice.options[pickIndex]?.label}</strong>
                </p>

                <button
                  type="button"
                  className="friend-choice"
                  onClick={() => onNavigate({ name: "choice", choiceId: entry.choice.id })}
                >
                  {entry.choice.options.slice(0, 2).map((option, optionIndex) => (
                    <span
                      key={option.id}
                      className={`friend-choice__side friend-choice__side--${optionIndex} ${
                        option.id === entry.pick ? "is-pick" : ""
                      }`}
                    >
                      <small>LATO {sideLabel(optionIndex)}</small>
                      <strong>{option.label}</strong>
                    </span>
                  ))}
                  <i>VS</i>
                </button>

                <footer>
                  <span>{entry.choice.category}</span>
                  <button
                    type="button"
                    onClick={() => onNavigate({ name: "choice", choiceId: entry.choice.id })}
                  >
                    Partecipa
                  </button>
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {suggested.length > 0 && (
        <section className="explore-block" data-reveal>
          <SectionHeading eyebrow="SUGGERITI" title="Da seguire" />
          <div className="stack">
            {suggested.map((person) => (
              <div className="person-row" key={person.id}>
                <Avatar person={person} />
                <button
                  type="button"
                  className="person-row__main"
                  onClick={() => onNavigate({ name: "person", handle: person.handle })}
                >
                  <strong>{person.name}</strong>
                  <small>
                    {person.handle} · {formatCount(person.followers)} follower
                  </small>
                </button>
                <button
                  type="button"
                  className="button button--small"
                  onClick={() => {
                    const isFollowing = actions.toggleFollow(person.id);
                    actions.toast(
                      isFollowing
                        ? `Ora segui ${person.name.split(" ")[0]}`
                        : `Non segui più ${person.name.split(" ")[0]}`,
                      isFollowing ? "success" : "default",
                    );
                  }}
                >
                  <UserPlus aria-hidden="true" />
                  Segui
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
