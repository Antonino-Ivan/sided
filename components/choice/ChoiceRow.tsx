"use client";

import { ChevronRight } from "lucide-react";
import { choicePercentages, formatVotes, timeAgo, totalVotes } from "@/lib/format";
import type { Choice, ID } from "@/lib/types";

/**
 * Riga compatta di una scelta, riusata in Esplora, Amici, chat e profilo.
 * Se hai già votato mostra la barra dei risultati invece del generico "vs".
 */
export function ChoiceRow({
  choice,
  myOptionId,
  rank,
  now,
  onOpen,
}: {
  choice: Choice;
  myOptionId?: ID | null;
  rank?: number;
  now: number;
  onOpen: () => void;
}) {
  const percentages = choicePercentages(choice, myOptionId ?? null);
  const [first, second] = choice.options;
  const extra = choice.options.length - 2;

  return (
    <button type="button" className="choice-row" onClick={onOpen}>
      {rank !== undefined && <span className="choice-row__rank">{String(rank).padStart(2, "0")}</span>}
      <span className="choice-row__copy">
        <strong>
          {first?.label}
          <i>vs</i>
          {second?.label}
          {extra > 0 && <em>+{extra}</em>}
        </strong>
        <small>
          {choice.category} · {formatVotes(totalVotes(choice, myOptionId ?? null))} ·{" "}
          {timeAgo(choice.createdAt, now)}
        </small>
        {myOptionId && (
          <span className="choice-row__bar" aria-hidden="true">
            {choice.options.map((option, index) => (
              <i
                key={option.id}
                className={option.id === myOptionId ? "is-mine" : ""}
                style={{ flexGrow: Math.max(percentages[index], 3) }}
              />
            ))}
          </span>
        )}
      </span>
      <ChevronRight aria-hidden="true" />
    </button>
  );
}
