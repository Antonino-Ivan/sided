"use client";

import { useMemo, useRef } from "react";
import { Compass, Pencil, Settings, Trash2 } from "lucide-react";
import { formatCount, sideLabel, timeAgo } from "@/lib/format";
import type { Route } from "@/lib/router";
import { useSided } from "@/state/context";
import { leanings, profileStats, recentVotes } from "@/state/selectors";
import { useReveal } from "@/hooks/ui";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState, SectionHeading, revealDelay } from "@/components/ui/Controls";
import { ChoiceRow } from "@/components/choice/ChoiceRow";

/**
 * Profilo dell'utente.
 *
 * Nessun numero è inventato: scelte, commenti, allineamento e "choice map"
 * derivano dai voti che hai davvero espresso. Se non hai ancora votato, le
 * sezioni lo dicono invece di mostrare barre finte.
 */
export function ProfileScreen({
  onNavigate,
  onEditProfile,
  onOpenSettings,
}: {
  onNavigate: (route: Route) => void;
  onEditProfile: () => void;
  onOpenSettings: () => void;
}) {
  const { choices, state, actions, me, now } = useSided();
  const viewRef = useRef<HTMLElement>(null);

  const stats = useMemo(
    () =>
      profileStats({
        choices,
        votes: state.votes,
        myComments: state.myComments,
        myChoices: state.myChoices,
        following: state.following,
      }),
    [choices, state.votes, state.myComments, state.myChoices, state.following],
  );

  const map = useMemo(() => leanings(choices, state.votes), [choices, state.votes]);
  const recent = useMemo(() => recentVotes(choices, state.votes), [choices, state.votes]);
  const mine = useMemo(() => choices.filter((choice) => choice.authorId === "me"), [choices]);

  useReveal(viewRef, [map.length, recent.length, mine.length]);

  return (
    <section className="screen screen--page profile" ref={viewRef}>
      <header className="profile-head" data-reveal>
        <Avatar person={me} size="xl" />
        <div>
          <h2>{me.name}</h2>
          <p className="profile-head__handle">{me.handle}</p>
          <p>{me.bio}</p>
        </div>
      </header>

      <div className="profile-actions" data-reveal style={revealDelay(1)}>
        <button type="button" className="button button--ghost" onClick={onEditProfile}>
          <Pencil aria-hidden="true" />
          Modifica profilo
        </button>
        <button type="button" className="button button--ghost" onClick={onOpenSettings}>
          <Settings aria-hidden="true" />
          Impostazioni
        </button>
      </div>

      <div className="stats-row" data-reveal style={revealDelay(2)}>
        <div>
          <strong>{formatCount(stats.votes)}</strong>
          <span>Voti</span>
        </div>
        <div>
          <strong>{formatCount(stats.comments)}</strong>
          <span>Commenti</span>
        </div>
        <div>
          <strong>{formatCount(stats.published)}</strong>
          <span>Pubblicate</span>
        </div>
        <div>
          <strong>{formatCount(stats.following)}</strong>
          <span>Seguiti</span>
        </div>
      </div>

      {stats.majorityRate !== null && (
        <p className="profile-insight" data-reveal style={revealDelay(3)}>
          Stai con la maggioranza nel <strong>{stats.majorityRate}%</strong> delle scelte che hai
          votato.
          {stats.majorityRate < 45 && " Ti piace la parte difficile."}
        </p>
      )}

      <section className="explore-block" data-reveal>
        <SectionHeading eyebrow="CHOICE MAP" title="Come la pensi" />
        {map.length === 0 ? (
          <EmptyState
            icon={<Compass aria-hidden="true" />}
            title="La tua mappa è ancora vuota"
            detail="Vota qualche scelta e qui comparirà il tuo profilo di opinioni."
            action={
              <button
                type="button"
                className="button button--primary"
                onClick={() => onNavigate({ name: "home" })}
              >
                Inizia a votare
              </button>
            }
          />
        ) : (
          <div className="leaning-list">
            {map.map((row, index) => (
              <div className="leaning-row" key={row.category} data-reveal style={revealDelay(index, 40)}>
                <div>
                  <strong>{row.category}</strong>
                  <span>{row.label}</span>
                </div>
                <div className="leaning-row__bar">
                  <span style={{ width: `${row.alignment}%` }} />
                </div>
                <b>{row.alignment}%</b>
              </div>
            ))}
          </div>
        )}
      </section>

      {recent.length > 0 && (
        <section className="explore-block" data-reveal>
          <SectionHeading eyebrow="IDENTITÀ IN CORSO" title="Scelte recenti" />
          <div className="stack">
            {recent.map((entry) => {
              const index = entry.choice.options.findIndex((option) => option.id === entry.optionId);
              return (
                <button
                  key={entry.choice.id}
                  type="button"
                  className="recent-row"
                  onClick={() => onNavigate({ name: "choice", choiceId: entry.choice.id })}
                >
                  <span className={`recent-row__side recent-row__side--${index % 6}`}>
                    {sideLabel(index)}
                  </span>
                  <span>
                    <strong>
                      {entry.choice.options[0]?.label} <i>vs</i> {entry.choice.options[1]?.label}
                    </strong>
                    <small>
                      {entry.choice.category} · hai scelto {entry.choice.options[index]?.label} ·{" "}
                      {timeAgo(entry.at, now)}
                    </small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {mine.length > 0 && (
        <section className="explore-block" data-reveal>
          <SectionHeading eyebrow="HAI LANCIATO" title="Le tue scelte" />
          <div className="stack">
            {mine.map((choice) => (
              <div className="owned-row" key={choice.id}>
                <ChoiceRow
                  choice={choice}
                  myOptionId={state.votes[choice.id]?.optionId}
                  now={now}
                  onOpen={() => onNavigate({ name: "choice", choiceId: choice.id })}
                />
                <button
                  type="button"
                  className="icon-button icon-button--danger"
                  onClick={() => {
                    actions.deleteChoice(choice.id);
                    actions.toast("Scelta eliminata");
                  }}
                  aria-label={`Elimina la scelta ${choice.options[0]?.label}`}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
