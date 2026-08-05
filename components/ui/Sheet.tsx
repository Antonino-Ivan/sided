"use client";

import { useId, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useDialog } from "@/hooks/ui";

/**
 * Pannello modale che sale dal basso su mobile e si centra su desktop.
 * Gestisce Esc, focus trap e click fuori.
 */
export function Sheet({
  open,
  onClose,
  eyebrow,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  eyebrow?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg";
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialog(panelRef, open, onClose);

  if (!open) return null;

  return (
    <div
      className="sheet-overlay"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`sheet sheet--${size}`}
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="sheet__header">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Chiudi">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="sheet__body">{children}</div>
        {footer && <footer className="sheet__footer">{footer}</footer>}
      </div>
    </div>
  );
}
