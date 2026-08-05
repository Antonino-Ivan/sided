"use client";

import { Check, ChevronRight, RotateCcw, Share2 } from "lucide-react";
import { choicePercentages, formatVotes, optionIndex, sideLabel, totalVotes } from "@/lib/format";
import type { Choice, ID, Person } from "@/lib/types";
import { Avatar, AvatarStack } from "@/components/ui/Avatar";
import { MediaBackdrop } from "@/components/ui/MediaView";

/**
 * Esito del voto.
 *
 * Le percentuali arrivano dai conteggi reali (community + il tuo voto), quindi
 * l'altezza di ogni fascia cambia davvero quando voti — è la differenza fra
 * una demo e un grafico finto.
 */
export function ChoiceResult({
  choice,
  myOptionId,
  friends,
  commentCount,
  onChangeVote,
  onOpenDiscussion,
  onShare,
}: {
  choice: Choice;
  myOptionId: ID;
  friends: Array<{ person: Person; optionId: ID }>;
  commentCount: number;
  onChangeVote: () => void;
  onOpenDiscussion: () => void;
  onShare: () => void;
}) {
  const percentages = choicePercentages(choice, myOptionId);
  const myIndex = optionIndex(choice, myOptionId);
  const myPercent = myIndex >= 0 ? percentages[myIndex] : 0;
  const myOption = choice.options[myIndex];
  const isMajority = myPercent === Math.max(...percentages);
  const agreeing = friends.filter((friend) => friend.optionId === myOptionId);

  return (
    <div className="choice-result">
      <div className="choice-result__stack" data-count={choice.options.length}>
        {choice.options.map((option, index) => {
          const isMine = option.id === myOptionId;
          return (
            <article
              key={option.id}
              className={`result-slice ${isMine ? "is-mine" : ""}`}
              style={{ flexGrow: Math.max(percentages[index], 6) }}
            >
              {option.media && <MediaBackdrop media={option.media} />}
              <div className="result-slice__copy">
                <small>
                  {isMine ? (
                    <>
                      <Check aria-hidden="true" /> LA TUA SCELTA
                    </>
                  ) : (
                    `LATO ${sideLabel(index)}`
                  )}
                </small>
                <strong>{option.label}</strong>
              </div>
              <b className="result-slice__percent">{percentages[index]}%</b>
            </article>
          );
        })}
      </div>

      <aside className="result-headline">
        <p className="result-headline__live">
          <i aria-hidden="true" />
          RISULTATI LIVE
          <small>{formatVotes(totalVotes(choice, myOptionId))}</small>
        </p>
        <h2>
          {isMajority
            ? `Sei con il ${myPercent}%`
            : `Solo il ${myPercent}% la pensa come te`}
        </h2>
        <p className="result-headline__pick">
          Hai scelto <strong>{myOption?.label}</strong>
        </p>
      </aside>

      <aside className="result-dock">
        <div className="result-dock__friends">
          {friends.length > 0 ? (
            <>
              <AvatarStack
                people={friends.map((friend) => friend.person)}
                label="Amici che hanno risposto"
              />
              <span>
                <strong>
                  {agreeing.length} {agreeing.length === 1 ? "amico la pensa" : "amici la pensano"} come te
                </strong>
                <small>su {friends.length} che hanno risposto</small>
              </span>
            </>
          ) : (
            <span>
              <strong>Nessuno dei tuoi ancora</strong>
              <small>Sei il primo della tua cerchia</small>
            </span>
          )}
        </div>

        <div className="result-dock__actions">
          <button type="button" onClick={onChangeVote} aria-label="Cambia il tuo voto">
            <RotateCcw aria-hidden="true" />
            <span>Cambia</span>
          </button>
          <button type="button" onClick={onShare} aria-label="Copia il link della scelta">
            <Share2 aria-hidden="true" />
            <span>Condividi</span>
          </button>
          <button type="button" className="is-primary" onClick={onOpenDiscussion}>
            <span>
              <strong>Apri discussione</strong>
              <small>{commentCount === 1 ? "1 commento" : `${commentCount} commenti`}</small>
            </span>
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </aside>

      {friends.length > 0 && (
        <ul className="result-friend-votes" aria-label="Come hanno votato i tuoi amici">
          {friends.map((friend) => {
            const index = optionIndex(choice, friend.optionId);
            return (
              <li key={friend.person.id}>
                <Avatar person={friend.person} size="xs" />
                <strong>{friend.person.name.split(" ")[0]}</strong>
                <b>{sideLabel(index)}</b>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
