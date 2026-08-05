"use client";

import { useMemo, useRef } from "react";
import { Search, SearchX, X } from "lucide-react";
import { formatCount } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import type { CategoryName } from "@/lib/types";
import type { Route } from "@/lib/router";
import { useSided } from "@/state/context";
import { categoryStats, feedChoices, search } from "@/state/selectors";
import { useReveal } from "@/hooks/ui";
import { Avatar } from "@/components/ui/Avatar";
import { Chip, EmptyState, SectionHeading, revealDelay } from "@/components/ui/Controls";
import { ChoiceRow } from "@/components/choice/ChoiceRow";

const categoryIcons: Record<CategoryName, string> = {
  Lifestyle: "✦",
  Sport: "⚡",
  Tech: "⌘",
  Food: "◐",
  Cultura: "◎",
  Relazioni: "♡",
  Travel: "✈",
  Musica: "♪",
};

/**
 * Esplora: ricerca reale su scelte, persone e categorie.
 * Query e filtro finiscono nell'URL, quindi una ricerca è condivisibile.
 */
export function ExploreScreen({
  query,
  category,
  onNavigate,
}: {
  query: string;
  category: string | null;
  onNavigate: (route: Route, options?: { replace?: boolean }) => void;
}) {
  const { choices, people, state, now } = useSided();
  const viewRef = useRef<HTMLElement>(null);

  // Nessuno stato locale per la ricerca: il testo vive nell'URL, così un link
  // condiviso riapre esattamente la stessa ricerca e "indietro" funziona.
  const term = query;

  const results = useMemo(
    () => search(term, { choices, people: people.filter((p) => p.id !== "me"), categories: CATEGORIES }),
    [term, choices, people],
  );

  const stats = useMemo(() => categoryStats(choices, CATEGORIES), [choices]);

  const inCategory = useMemo(
    () => (category ? choices.filter((choice) => choice.category === category) : []),
    [choices, category],
  );

  const trending = useMemo(
    () => feedChoices(choices, "trend", { following: state.following, now }).slice(0, 5),
    [choices, state.following, now],
  );

  useReveal(viewRef, [term, category, results.choices.length]);

  function updateTerm(value: string) {
    onNavigate(
      { name: "explore", query: value || undefined, category: category ?? undefined },
      { replace: true },
    );
  }

  function toggleCategory(name: CategoryName) {
    onNavigate(
      {
        name: "explore",
        query: term || undefined,
        category: category === name ? undefined : name,
      },
      { replace: true },
    );
  }

  const searching = term.trim().length > 0;
  const hasResults =
    results.choices.length > 0 || results.people.length > 0 || results.categories.length > 0;

  return (
    <section className="screen screen--page explore" ref={viewRef}>
      <div className="search-box" data-reveal>
        <Search aria-hidden="true" />
        <input
          value={term}
          onChange={(event) => updateTerm(event.target.value)}
          placeholder="Cerca scelte, persone, temi"
          aria-label="Cerca su Sided"
          type="search"
          autoComplete="off"
        />
        {term && (
          <button type="button" onClick={() => updateTerm("")} aria-label="Cancella la ricerca">
            <X aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="category-chips" data-reveal style={revealDelay(1)}>
        {stats.map((item) => (
          <Chip
            key={item.name}
            active={category === item.name}
            onClick={() => toggleCategory(item.name)}
          >
            <span aria-hidden="true">{categoryIcons[item.name]}</span>
            {item.name}
          </Chip>
        ))}
      </div>

      {searching ? (
        hasResults ? (
          <>
            {results.choices.length > 0 && (
              <section className="explore-block" data-reveal>
                <SectionHeading eyebrow="SCELTE" title={`${results.choices.length} risultati`} />
                <div className="stack">
                  {results.choices.map((choice) => (
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

            {results.people.length > 0 && (
              <section className="explore-block" data-reveal>
                <SectionHeading eyebrow="PERSONE" title="Profili" />
                <div className="stack">
                  {results.people.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      className="person-row"
                      onClick={() => onNavigate({ name: "person", handle: person.handle })}
                    >
                      <Avatar person={person} />
                      <span>
                        <strong>{person.name}</strong>
                        <small>
                          {person.handle} · {formatCount(person.followers)} follower
                        </small>
                      </span>
                      {state.following.includes(person.id) && <b className="pill">Segui</b>}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {results.categories.length > 0 && (
              <section className="explore-block" data-reveal>
                <SectionHeading eyebrow="TEMI" title="Categorie" />
                <div className="category-chips">
                  {results.categories.map((name) => (
                    <Chip key={name} active={category === name} onClick={() => toggleCategory(name)}>
                      <span aria-hidden="true">{categoryIcons[name]}</span>
                      {name}
                    </Chip>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <EmptyState
            icon={<SearchX aria-hidden="true" />}
            title={`Nessun risultato per «${term}»`}
            detail="Prova con una parola più corta, o cerca una categoria."
          />
        )
      ) : category ? (
        <section className="explore-block" data-reveal>
          <SectionHeading
            eyebrow={category.toUpperCase()}
            title={`${inCategory.length} ${inCategory.length === 1 ? "scelta" : "scelte"}`}
            aside={
              <button type="button" className="link-button" onClick={() => toggleCategory(category as CategoryName)}>
                Togli filtro
              </button>
            }
          />
          <div className="stack">
            {inCategory.map((choice) => (
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
      ) : (
        <>
          <section className="explore-block" data-reveal style={revealDelay(2)}>
            <SectionHeading eyebrow="ADESSO" title="Le più votate" />
            <div className="stack">
              {trending.map((choice, index) => (
                <ChoiceRow
                  key={choice.id}
                  choice={choice}
                  rank={index + 1}
                  myOptionId={state.votes[choice.id]?.optionId}
                  now={now}
                  onOpen={() => onNavigate({ name: "choice", choiceId: choice.id })}
                />
              ))}
            </div>
          </section>

          <section className="explore-block" data-reveal style={revealDelay(3)}>
            <SectionHeading eyebrow="ESPLORA" title="Categorie" />
            <div className="category-grid">
              {stats.map((item) => (
                <button key={item.name} type="button" onClick={() => toggleCategory(item.name)}>
                  <span aria-hidden="true">{categoryIcons[item.name]}</span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.count} {item.count === 1 ? "scelta" : "scelte"} · {formatCount(item.votes)} voti
                  </small>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}
