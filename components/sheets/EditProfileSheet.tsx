"use client";

import { useState } from "react";
import type { Accent } from "@/lib/types";
import { useSided } from "@/state/context";
import { Sheet } from "@/components/ui/Sheet";
import { Avatar } from "@/components/ui/Avatar";

const accents: Accent[] = ["cyan", "pink", "violet", "mint", "amber", "blue"];

/** Montato solo quando serve: lo stato iniziale è già quello giusto. */
export function EditProfileSheet({ onClose }: { onClose: () => void }) {
  const { state, actions } = useSided();
  const [name, setName] = useState(state.profile.name);
  const [handle, setHandle] = useState(state.profile.handle);
  const [bio, setBio] = useState(state.profile.bio);
  const [accent, setAccent] = useState<Accent>(state.profile.accent);

  const cleanHandle = `@${handle.replace(/^@/, "").replace(/\s+/g, "").toLowerCase()}`;
  const isValid = name.trim().length > 1 && cleanHandle.length > 2;

  function save() {
    if (!isValid) return;
    actions.updateProfile({ name: name.trim(), handle: cleanHandle, bio: bio.trim(), accent });
    actions.toast("Profilo aggiornato", "success");
    onClose();
  }

  return (
    <Sheet
      open
      onClose={onClose}
      eyebrow="PROFILO"
      title="Modifica profilo"
      footer={
        <>
          <button type="button" className="button button--ghost" onClick={onClose}>
            Annulla
          </button>
          <button type="button" className="button button--primary" onClick={save} disabled={!isValid}>
            Salva
          </button>
        </>
      }
    >
      <div className="edit-profile__preview">
        <Avatar name={name || "?"} accent={accent} size="xl" />
        <div>
          <strong>{name || "Il tuo nome"}</strong>
          <small>{cleanHandle}</small>
        </div>
      </div>

      <label className="field">
        <span>Nome</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={30}
          placeholder="Come ti chiami"
        />
      </label>

      <label className="field">
        <span>Nome utente</span>
        <input
          value={handle}
          onChange={(event) => setHandle(event.target.value)}
          maxLength={20}
          placeholder="pietro"
        />
        <small>Verrà mostrato come {cleanHandle}</small>
      </label>

      <label className="field">
        <span>Bio</span>
        <textarea
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          maxLength={120}
          rows={3}
          placeholder="Una riga che ti descrive"
        />
        <small>{bio.length}/120</small>
      </label>

      <div className="field">
        <span>Colore</span>
        <div className="accent-picker" role="radiogroup" aria-label="Colore del profilo">
          {accents.map((tone) => (
            <button
              key={tone}
              type="button"
              role="radio"
              aria-checked={accent === tone}
              aria-label={`Colore ${tone}`}
              className={`accent-picker__swatch accent-picker__swatch--${tone} ${
                accent === tone ? "is-active" : ""
              }`}
              onClick={() => setAccent(tone)}
            />
          ))}
        </div>
      </div>
    </Sheet>
  );
}
