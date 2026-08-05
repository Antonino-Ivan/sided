"use client";

import { useMemo, useRef } from "react";
import { Check, MessageCircle, UserPlus, UserX } from "lucide-react";
import { formatCount, sideLabel } from "@/lib/format";
import type { Route } from "@/lib/router";
import { useSided } from "@/state/context";
import { affinityWith, simulatedPick } from "@/state/selectors";
import { useReveal } from "@/hooks/ui";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, SectionHeading, revealDelay } from "@/components/ui/Controls";
import { ChoiceRow } from "@/components/choice/ChoiceRow";

/** Profilo di un'altra persona: chi è, quanto siete d'accordo, cosa ha lanciato. */
export function PersonScreen({
  handle,
  onNavigate,
}: {
  handle: string;
  onNavigate: (route: Route) => void;
}) {
  const { people, choices, conversations, state, actions, now } = useSided();
  const viewRef = useRef<HTMLElement>(null);

  const person = people.find((item) => item.handle === handle);

  const authored = useMemo(
    () => (person ? choices.filter((choice) => choice.authorId === person.id) : []),
    [choices, person],
  );

  const affinity = useMemo(
    () => (person ? affinityWith(person.id, choices, state.votes) : 0),
    [person, choices, state.votes],
  );

  /** Scelte su cui avete votato diverso: sono le più interessanti da mostrare. */
  const disagreements = useMemo(() => {
    if (!person) return [];
    return choices
      .filter((choice) => {
        const mine = state.votes[choice.id]?.optionId;
        return mine && simulatedPick(person.id, choice) !== mine;
      })
      .slice(0, 4);
  }, [person, choices, state.votes]);

  useReveal(viewRef, [handle, authored.length, disagreements.length]);

  if (!person) {
    return (
      <section className="screen screen--center">
        <EmptyState
          title="Profilo non trovato"
          detail={`Nessuno con il nome ${handle} su Sided.`}
          action={
            <button
              type="button"
              className="button button--primary"
              onClick={() => onNavigate({ name: "friends" })}
            >
              Torna ad Amici
            </button>
          }
        />
      </section>
    );
  }

  const isFollowing = state.following.includes(person.id);
  const conversation = conversations.find((item) => item.personId === person.id);
  const votedCount = Object.keys(state.votes).length;

  return (
    <section className="screen screen--page person" ref={viewRef}>
      <header className="profile-head" data-reveal>
        <Avatar person={person} size="xl" />
        <div>
          <h2>{person.name}</h2>
          <p className="profile-head__handle">{person.handle}</p>
          <p>{person.bio}</p>
        </div>
      </header>

      <div className="stats-row" data-reveal style={revealDelay(1)}>
        <div>
          <strong>{formatCount(person.followers)}</strong>
          <span>Follower</span>
        </div>
        <div>
          <strong>{authored.length}</strong>
          <span>Scelte</span>
        </div>
        <div>
          <strong>{votedCount ? `${affinity}%` : "—"}</strong>
          <span>Affinità</span>
        </div>
      </div>

      <div className="profile-actions" data-reveal style={revealDelay(2)}>
        <button
          type="button"
          className={`button ${isFollowing ? "button--ghost" : "button--primary"}`}
          onClick={() => {
            const next = actions.toggleFollow(person.id);
            actions.toast(
              next ? `Ora segui ${person.name.split(" ")[0]}` : `Non segui più ${person.name.split(" ")[0]}`,
              next ? "success" : "default",
            );
          }}
        >
          {isFollowing ? <UserX aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
          {isFollowing ? "Smetti di seguire" : "Segui"}
        </button>
        {conversation && (
          <button
            type="button"
            className="button button--ghost"
            onClick={() => onNavigate({ name: "chat", conversationId: conversation.id })}
          >
            <MessageCircle aria-hidden="true" />
            Messaggio
          </button>
        )}
      </div>

      {votedCount > 0 && (
        <div className="affinity-card" data-reveal style={revealDelay(3)}>
          <div className="affinity-card__bar" aria-hidden="true">
            <span style={{ width: `${affinity}%` }} />
          </div>
          <p>
            <strong>{affinity}% di affinità</strong> su {votedCount}{" "}
            {votedCount === 1 ? "scelta votata" : "scelte votate"}
          </p>
        </div>
      )}

      {authored.length > 0 && (
        <section className="explore-block" data-reveal>
          <SectionHeading eyebrow="HA LANCIATO" title="Le sue scelte" />
          <div className="stack">
            {authored.map((choice) => (
              <ChoiceRow
                key={choice.id}
                choice={choice}
                myOptionId={state.votes[choice.id]?.optionId}
                now={now}
                onOpen={() => onNavigate({ name: "choice", choiceId: choice.id })}
              />
            ))}
          </div>
        </section>
      )}

      {disagreements.length > 0 && (
        <section className="explore-block" data-reveal>
          <SectionHeading eyebrow="NON SIETE D'ACCORDO" title="Dove vi dividete" />
          <div className="stack">
            {disagreements.map((choice) => {
              const theirs = simulatedPick(person.id, choice);
              const mine = state.votes[choice.id]?.optionId;
              const theirIndex = choice.options.findIndex((option) => option.id === theirs);
              const myIndex = choice.options.findIndex((option) => option.id === mine);
              return (
                <button
                  key={choice.id}
                  type="button"
                  className="disagreement-row"
                  onClick={() => onNavigate({ name: "choice", choiceId: choice.id })}
                >
                  <span className="disagreement-row__title">
                    {choice.options[myIndex]?.label} <i>vs</i> {choice.options[theirIndex]?.label}
                  </span>
                  <span className="disagreement-row__sides">
                    <b>
                      <Check aria-hidden="true" /> tu: {sideLabel(myIndex)}
                    </b>
                    <b>
                      {person.name.split(" ")[0]}: {sideLabel(theirIndex)}
                    </b>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
