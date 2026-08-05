"use client";

import { Check } from "lucide-react";
import { useSided } from "@/state/context";

/** Conferme brevi delle azioni: nessun alert bloccante. */
export function Toasts() {
  const { state, actions } = useSided();
  if (!state.toasts.length) return null;

  return (
    <div className="toasts" role="status" aria-live="polite">
      {state.toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`toast toast--${toast.tone}`}
          onClick={() => actions.dismissToast(toast.id)}
        >
          {toast.tone === "success" && <Check aria-hidden="true" />}
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  );
}
