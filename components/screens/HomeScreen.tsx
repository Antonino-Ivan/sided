"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronsUpDown, Sparkles } from "lucide-react";
import { formatVotes, timeAgo, totalVotes } from "@/lib/format";
import type { FeedMode, ID } from "@/lib/types";
import type { Route } from "@/lib/router";
import { useSided } from "@/state/context";
import { commentsFor, feedChoices, simulatedPick } from "@/state/selectors";
import { useSwipeDeck } from "@/hooks/useSwipeDeck";
import { haptic, copyToClipboard } from "@/hooks/ui";
import { EmptyState } from "@/components/ui/Controls";
import { MediaBackdrop } from "@/components/ui/MediaView";
import { ChoiceCard } from "@/components/choice/ChoiceCard";
import { ChoiceResult } from "@/components/choice/ChoiceResult";

/**
 * Il feed verticale: una scelta alla volta, si vota e si passa oltre.
 * Sostituisce il ciclo su un array fisso con una lista ordinata dal feed
 * selezionato, così "Per te", "Trend" e "Seguiti" mostrano davvero cose diverse.
 */
export function HomeScreen({
  feed,
  onNavigate,
}: {
  feed: FeedMode;
  onNavigate: (route: Route) => void;
}) {
  const { choices, comments, state, actions, peopleById, now } = useSided();

  const list = useMemo(
    () => feedChoices(choices, feed, { following: state.following, now }),
    [choices, feed, state.following, now],
  );

  const [index, setIndex] = useState(0);

  const safeIndex = list.length ? ((index % list.length) + list.length) % list.length : 0;
  const choice = list[safeIndex];

  const advance = useCallback(
    (direction: "next" | "previous") => {
      setIndex((current) => current + (direction === "next" ? 1 : -1));
    },
    [],
  );

  const { cardRef, motion, isDragging, go, consumeDrag, handlers, onWheel } = useSwipeDeck({
    onChange: advance,
    enabled: list.length > 1,
  });

  useEffect(() => {
    if (list.length < 2) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        go("next");
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        go("previous");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [go, list.length]);

  const myVote = choice ? state.votes[choice.id]?.optionId : undefined;

  const friendVotes = useMemo(() => {
    if (!choice) return [];
    return state.following
      .map((personId) => peopleById.get(personId))
      .filter((person): person is NonNullable<typeof person> => Boolean(person))
      .slice(0, 4)
      .map((person) => ({ person, optionId: simulatedPick(person.id, choice) }));
  }, [choice, state.following, peopleById]);

  const commentCount = useMemo(
    () => (choice ? commentsFor(comments, choice.id).length : 0),
    [comments, choice],
  );

  const handleVote = useCallback(
    (optionId: ID) => {
      // Un tap che chiude un trascinamento non deve valere come voto.
      if (consumeDrag() || !choice) return;
      actions.vote(choice.id, optionId);
      haptic(18);
    },
    [actions, choice, consumeDrag],
  );

  const share = useCallback(async () => {
    if (!choice) return;
    const url = `${window.location.origin}${window.location.pathname}#/scelta/${choice.id}`;
    const ok = await copyToClipboard(url);
    actions.toast(ok ? "Link copiato negli appunti" : "Copia non riuscita", ok ? "success" : "default");
  }, [actions, choice]);

  if (!choice) {
    return (
      <section className="screen screen--center">
        <EmptyState
          icon={<Sparkles aria-hidden="true" />}
          title="Nessuna scelta qui"
          detail={
            feed === "seguiti"
              ? "Segui qualcuno dalla sezione Amici e le sue scelte compariranno qui."
              : "Crea la prima scelta e falla girare."
          }
          action={
            <button
              type="button"
              className="button button--primary"
              onClick={() => onNavigate({ name: feed === "seguiti" ? "friends" : "create" })}
            >
              {feed === "seguiti" ? "Trova persone" : "Crea una scelta"}
            </button>
          }
        />
      </section>
    );
  }

  const author = peopleById.get(choice.authorId);

  return (
    <section className="screen screen--deck" onWheel={onWheel}>
      <div
        ref={cardRef}
        className={[
          "choice-card",
          choice.background ? "has-backdrop" : "",
          isDragging ? "is-dragging" : "",
          motion !== "idle" ? `is-${motion}` : "",
        ]
          .filter(Boolean)
          .join(" ")}
        {...handlers}
      >
        {choice.background && <MediaBackdrop media={choice.background} className="choice-card__backdrop" />}
        {myVote ? (
          <ChoiceResult
            choice={choice}
            myOptionId={myVote}
            friends={friendVotes}
            commentCount={commentCount}
            onChangeVote={() => actions.clearVote(choice.id)}
            onOpenDiscussion={() => onNavigate({ name: "choice", choiceId: choice.id })}
            onShare={share}
          />
        ) : (
          <ChoiceCard key={choice.id} choice={choice} onVote={handleVote} />
        )}
      </div>

      {choice.audio && (
        <audio
          className="choice-audio"
          src={choice.audio.url}
          controls
          preload="metadata"
          aria-label={`Audio allegato: ${choice.audio.name}`}
        />
      )}

      <div className="choice-meta">
        <button
          type="button"
          className="choice-meta__author"
          onClick={() =>
            author && author.id !== "me"
              ? onNavigate({ name: "person", handle: author.handle })
              : onNavigate({ name: "profile" })
          }
        >
          {author?.handle ?? "@sided"}
        </button>
        <span className="choice-meta__dot">·</span>
        <button
          type="button"
          onClick={() => onNavigate({ name: "explore", category: choice.category })}
        >
          {choice.category}
        </button>
        <span className="choice-meta__spacer" />
        <span>{formatVotes(totalVotes(choice, myVote))}</span>
        <span className="choice-meta__dot">·</span>
        <span>{timeAgo(choice.createdAt, now)}</span>
      </div>

      <p className="deck-hint">
        <ChevronsUpDown aria-hidden="true" />
        <span>
          {myVote ? "Scorri per la prossima scelta" : "Scorri su o giù per cambiare scelta"}
          <b>
            {safeIndex + 1}/{list.length}
          </b>
        </span>
      </p>
    </section>
  );
}
