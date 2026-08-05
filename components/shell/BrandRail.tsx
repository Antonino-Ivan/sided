"use client";

import { useMemo } from "react";
import { formatCount, totalVotes } from "@/lib/format";
import { categoryStats } from "@/state/selectors";
import { CATEGORIES } from "@/lib/types";
import { useSided } from "@/state/context";

/**
 * Colonna di presentazione visibile solo su schermi larghi.
 * I numeri non sono più decorativi: escono dagli stessi dati del feed.
 */
export function BrandRail() {
  const { choices, people, now } = useSided();

  const stats = useMemo(() => {
    const votes = choices.reduce((sum, choice) => sum + totalVotes(choice), 0);
    const lastDay = choices.filter((choice) => now - choice.createdAt < 86_400_000);
    const hottest = categoryStats(choices, CATEGORIES).slice(0, 3);
    return {
      votes,
      freshChoices: lastDay.length,
      people: people.length,
      hottest,
    };
  }, [choices, people, now]);

  return (
    <aside className="brand-rail" aria-label="Presentazione di Sided">
      <div className="brand-rail__top">
        <img src="/sided-icon.png" alt="" className="brand-rail__icon" width={46} height={46} />
        <span>SIDED</span>
      </div>

      <div className="brand-rail__copy">
        <p className="eyebrow">SOCIAL OPINION PLATFORM</p>
        <h1>
          Scegli da che
          <br />
          parte stai.
        </h1>
        <p className="brand-rail__lede">
          Meno pose, più opinioni. Ogni scelta racconta chi sei e ti avvicina a chi vede il mondo
          come te.
        </p>

        <div className="brand-trends" aria-label="Temi più caldi adesso">
          <span className="brand-trends__live">
            <i />
            Hot adesso
          </span>
          {stats.hottest.map((category) => (
            <span key={category.name}>#{category.name}</span>
          ))}
        </div>

        <div className="brand-proof" aria-label="Attività della community">
          <span>
            <strong>{formatCount(stats.votes)}</strong>
            <small>opinioni raccolte</small>
          </span>
          <span>
            <strong>{stats.freshChoices}</strong>
            <small>scelte nelle ultime 24 h</small>
          </span>
          <span>
            <strong>{stats.people}</strong>
            <small>persone nella tua rete</small>
          </span>
        </div>
      </div>

      <p className="brand-rail__footer">
        <span className="live-dot" aria-hidden="true" />
        La community sta votando in questo momento
      </p>
    </aside>
  );
}
