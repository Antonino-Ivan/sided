"use client";

import { useState } from "react";
import { sideLabel } from "@/lib/format";
import type { Choice, ID } from "@/lib/types";
import { MediaBackdrop } from "@/components/ui/MediaView";

/**
 * La scheda di voto, in tutti e quattro i formati.
 *
 * L'avanzamento di "chained" e "contest" vive qui come stato locale: è
 * effimero per definizione e il componente viene rimontato (via `key`) a ogni
 * cambio di scelta, quindi non serve portarlo nello store.
 */

type Props = {
  choice: Choice;
  onVote: (optionId: ID) => void;
};

type Bracket = {
  round: number;
  match: number;
  contenders: ID[];
  nextRound: ID[];
};

export function ChoiceCard({ choice, onVote }: Props) {
  const [chainStep, setChainStep] = useState(0);
  const [bracket, setBracket] = useState<Bracket>(() => ({
    round: 1,
    match: 0,
    contenders: choice.options.map((option) => option.id),
    nextRound: [],
  }));

  const optionById = (id: ID) => choice.options.find((option) => option.id === id);

  function handleContest(optionId: ID) {
    const winners = [...bracket.nextRound, optionId];
    const matchesInRound = Math.floor(bracket.contenders.length / 2);
    const nextMatch = bracket.match + 1;

    if (nextMatch < matchesInRound) {
      setBracket({ ...bracket, match: nextMatch, nextRound: winners });
      return;
    }
    // Numero dispari di partecipanti: l'ultimo passa il turno d'ufficio.
    if (bracket.contenders.length % 2 === 1) {
      winners.push(bracket.contenders[bracket.contenders.length - 1]);
    }
    if (winners.length === 1) {
      onVote(winners[0]);
      return;
    }
    setBracket({ round: bracket.round + 1, match: 0, contenders: winners, nextRound: [] });
  }

  function handleChain(optionId: ID) {
    const totalSteps = Math.floor(choice.options.length / 2);
    if (chainStep + 1 < totalSteps) {
      setChainStep(chainStep + 1);
      return;
    }
    onVote(optionId);
  }

  function pick(optionId: ID) {
    if (choice.format === "contest") return handleContest(optionId);
    if (choice.format === "chain") return handleChain(optionId);
    onVote(optionId);
  }

  if (choice.format === "classic") {
    return (
      <div className="choice-versus">
        {choice.options.slice(0, 2).map((option, index) => (
          <button
            key={option.id}
            type="button"
            className={`choice-half choice-half--${index === 0 ? "a" : "b"} ${
              option.media || choice.background ? "has-media" : ""
            }`}
            onClick={() => pick(option.id)}
          >
            {option.media && <MediaBackdrop media={option.media} />}
            <span className="choice-half__kicker">LATO {sideLabel(index)}</span>
            <strong>{option.label}</strong>
            <span className="choice-half__hint">tocca per scegliere</span>
          </button>
        ))}
        <span className="choice-versus__badge" aria-hidden="true">
          VS
        </span>
      </div>
    );
  }

  const visible =
    choice.format === "contest"
      ? [bracket.contenders[bracket.match * 2], bracket.contenders[bracket.match * 2 + 1]]
          .filter((id): id is ID => Boolean(id))
          .map((id) => optionById(id))
          .filter((option): option is NonNullable<typeof option> => Boolean(option))
      : choice.format === "chain"
        ? choice.options.slice(chainStep * 2, chainStep * 2 + 2)
        : choice.options;

  const matchesInRound = Math.max(1, Math.floor(bracket.contenders.length / 2));
  const chainSteps = Math.max(1, Math.floor(choice.options.length / 2));

  const heading =
    choice.format === "contest"
      ? bracket.contenders.length === 2
        ? "Finale"
        : `Round ${bracket.round} · sfida ${bracket.match + 1} di ${matchesInRound}`
      : choice.format === "chain"
        ? `Scelta ${chainStep + 1} di ${chainSteps}`
        : "Scegli un lato";

  const kicker =
    choice.format === "contest" ? "CONTEST" : choice.format === "chain" ? "CHAINED" : "MULTI";

  return (
    <div className={`choice-multi choice-multi--${choice.format}`}>
      <header className="choice-multi__header">
        <span>{kicker}</span>
        <strong>{heading}</strong>
        {(choice.format === "contest" || choice.format === "chain") && (
          <span
            className="choice-multi__progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={choice.format === "chain" ? chainSteps : matchesInRound}
            aria-valuenow={choice.format === "chain" ? chainStep + 1 : bracket.match + 1}
            aria-label="Avanzamento"
          >
            <i
              style={{
                width: `${
                  choice.format === "chain"
                    ? ((chainStep + 1) / chainSteps) * 100
                    : ((bracket.match + 1) / matchesInRound) * 100
                }%`,
              }}
            />
          </span>
        )}
      </header>

      <div className="choice-multi__grid" data-count={visible.length}>
        {visible.map((option) => {
          const index = choice.options.findIndex((item) => item.id === option.id);
          return (
            <button
              key={option.id}
              type="button"
              className={option.media ? "has-media" : ""}
              onClick={() => pick(option.id)}
            >
              {option.media && <MediaBackdrop media={option.media} />}
              <small>{choice.format === "contest" ? "IN GARA" : `LATO ${sideLabel(index)}`}</small>
              <strong>{option.label}</strong>
              <span>scegli</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
