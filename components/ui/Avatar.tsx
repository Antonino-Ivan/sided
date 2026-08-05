"use client";

import { initialOf } from "@/lib/format";
import type { Accent, Person } from "@/lib/types";

type Props = {
  person?: Pick<Person, "name" | "handle" | "accent">;
  name?: string;
  accent?: Accent;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
};

export function Avatar({ person, name, accent, size = "md", online, className }: Props) {
  const label = person?.name ?? name ?? "?";
  const tone = accent ?? person?.accent ?? "cyan";

  return (
    <span
      className={`avatar avatar--${size} avatar--${tone} ${className ?? ""}`}
      aria-hidden="true"
    >
      {initialOf(label)}
      {online && <i className="avatar__dot" />}
    </span>
  );
}

/** Pila di avatar sovrapposti, usata per "chi ha risposto". */
export function AvatarStack({
  people,
  label,
  max = 4,
}: {
  people: Array<Pick<Person, "name" | "handle" | "accent">>;
  label: string;
  max?: number;
}) {
  const shown = people.slice(0, max);
  return (
    <span className="avatar-stack" aria-label={label}>
      {shown.map((person) => (
        <Avatar key={person.handle} person={person} size="sm" />
      ))}
      {people.length > max && <span className="avatar avatar--sm avatar--more">+{people.length - max}</span>}
    </span>
  );
}
