"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { formatCount } from "@/lib/format";
import { useSided } from "@/state/context";
import { Sheet } from "@/components/ui/Sheet";
import { Avatar } from "@/components/ui/Avatar";

/**
 * Primo avvio: due passaggi, nome e persone da seguire.
 * Serve a far sì che il feed "Seguiti" abbia senso fin da subito.
 */
export function OnboardingSheet({ open }: { open: boolean }) {
  const { people, state, actions } = useSided();
  const [step, setStep] = useState<0 | 1>(0);
  const [name, setName] = useState(state.profile.name);
  const [handle, setHandle] = useState(state.profile.handle.replace(/^@/, ""));
  const [selected, setSelected] = useState<string[]>(state.following);

  const suggestions = people.filter((person) => person.id !== "me");
  const cleanHandle = `@${handle.replace(/\s+/g, "").toLowerCase()}`;
  const canContinue = name.trim().length > 1 && handle.trim().length > 1;

  function finish() {
    actions.completeOnboarding({ name: name.trim(), handle: cleanHandle }, selected);
    actions.toast(`Benvenuto su Sided, ${name.trim().split(" ")[0]}`, "success");
  }

  return (
    <Sheet
      open={open}
      onClose={() => actions.skipOnboarding()}
      eyebrow={step === 0 ? "BENVENUTO" : "PASSO 2 DI 2"}
      title={step === 0 ? "Scegli da che parte stai." : "Chi vuoi seguire?"}
      footer={
        step === 0 ? (
          <>
            <button type="button" className="button button--ghost" onClick={() => actions.skipOnboarding()}>
              Salta
            </button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => setStep(1)}
              disabled={!canContinue}
            >
              Continua
            </button>
          </>
        ) : (
          <>
            <button type="button" className="button button--ghost" onClick={() => setStep(0)}>
              Indietro
            </button>
            <button type="button" className="button button--primary" onClick={finish}>
              Entra su Sided
            </button>
          </>
        )
      }
    >
      {step === 0 ? (
        <>
          <p className="sheet__lede">
            Sided è il social delle scelte: due lati, nessuna via di mezzo. Prima di iniziare,
            dicci come chiamarti.
          </p>
          <label className="field">
            <span>Nome</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={30}
              placeholder="Come ti chiami"
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span>Nome utente</span>
            <input
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              maxLength={20}
              placeholder="pietro"
              autoComplete="off"
            />
            <small>Ti mostreremo come {cleanHandle}</small>
          </label>
        </>
      ) : (
        <>
          <p className="sheet__lede">
            Le persone che segui riempiono il feed «Seguiti». Puoi cambiare idea quando vuoi.
          </p>
          <div className="stack">
            {suggestions.map((person) => {
              const isOn = selected.includes(person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  className={`follow-row ${isOn ? "is-on" : ""}`}
                  aria-pressed={isOn}
                  onClick={() =>
                    setSelected((current) =>
                      current.includes(person.id)
                        ? current.filter((id) => id !== person.id)
                        : [...current, person.id],
                    )
                  }
                >
                  <Avatar person={person} />
                  <span>
                    <strong>{person.name}</strong>
                    <small>
                      {person.handle} · {formatCount(person.followers)} follower
                    </small>
                  </span>
                  <i>{isOn ? <Check aria-hidden="true" /> : "+"}</i>
                </button>
              );
            })}
          </div>
        </>
      )}
    </Sheet>
  );
}
