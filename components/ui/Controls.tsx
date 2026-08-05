"use client";

import type { CSSProperties, ReactNode } from "react";

/** Interruttore accessibile: `role="switch"` con stato annunciato. */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={`switch ${checked ? "is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span />
    </button>
  );
}

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  badge?: number;
};

/** Gruppo di pill mutuamente esclusive (feed, filtri commenti, …). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: {
  options: Array<SegmentedOption<T>>;
  value: T;
  onChange: (next: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div className={`segmented segmented--${size}`} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "is-active" : ""}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.badge ? <i>{option.badge}</i> : null}
        </button>
      ))}
    </div>
  );
}

export function Chip({
  children,
  active,
  onClick,
  ariaLabel,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  if (!onClick) return <span className="chip">{children}</span>;
  return (
    <button
      type="button"
      className={`chip ${active ? "is-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

export function EmptyState({
  icon,
  title,
  detail,
  action,
}: {
  icon?: ReactNode;
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      {icon && <span className="empty-state__icon">{icon}</span>}
      <strong>{title}</strong>
      {detail && <p>{detail}</p>}
      {action}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  aside,
}: {
  eyebrow?: string;
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {aside}
    </div>
  );
}

/** Ritardo progressivo per le animazioni di comparsa in lista. */
export function revealDelay(index: number, step = 38): CSSProperties {
  return { "--reveal-delay": `${Math.min(index, 10) * step}ms` } as CSSProperties;
}
