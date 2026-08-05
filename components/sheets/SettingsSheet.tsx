"use client";

import { Activity, BellRing, Check, LockKeyhole, Monitor, Moon, Sun, Trash2 } from "lucide-react";
import type { ThemeMode } from "@/lib/types";
import { useSided } from "@/state/context";
import { Sheet } from "@/components/ui/Sheet";
import { Switch } from "@/components/ui/Controls";

const themes: Array<[ThemeMode, typeof Monitor, string]> = [
  ["system", Monitor, "Sistema"],
  ["light", Sun, "Chiaro"],
  ["dark", Moon, "Scuro"],
];

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions } = useSided();
  const { preferences } = state;

  return (
    <Sheet open={open} onClose={onClose} eyebrow="PROFILO" title="Impostazioni">
      <section className="settings-group">
        <div className="settings-group__title">
          <Moon aria-hidden="true" />
          <div>
            <h3>Aspetto</h3>
            <p>Scegli come visualizzare Sided su questo dispositivo.</p>
          </div>
        </div>
        <div className="theme-picker" role="radiogroup" aria-label="Tema dell'app">
          {themes.map(([mode, Icon, label]) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={preferences.theme === mode}
              className={preferences.theme === mode ? "is-active" : ""}
              onClick={() => actions.updatePreferences({ theme: mode })}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {preferences.theme === mode && <Check className="theme-picker__check" aria-hidden="true" />}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group__title">
          <BellRing aria-hidden="true" />
          <div>
            <h3>Preferenze</h3>
            <p>Notifiche, visibilità e simulazione della community.</p>
          </div>
        </div>

        <div className="settings-row">
          <span className="settings-row__icon">
            <BellRing aria-hidden="true" />
          </span>
          <span className="settings-row__copy">
            <strong>Notifiche</strong>
            <small>Risposte, nuovi follower e scelte in evidenza</small>
          </span>
          <Switch
            checked={preferences.notifications}
            onChange={(next) => actions.updatePreferences({ notifications: next })}
            label="Notifiche"
          />
        </div>

        <div className="settings-row">
          <span className="settings-row__icon">
            <LockKeyhole aria-hidden="true" />
          </span>
          <span className="settings-row__copy">
            <strong>Profilo privato</strong>
            <small>Solo chi approvi può vedere le tue attività</small>
          </span>
          <Switch
            checked={preferences.privateProfile}
            onChange={(next) => actions.updatePreferences({ privateProfile: next })}
            label="Profilo privato"
          />
        </div>

        <div className="settings-row">
          <span className="settings-row__icon">
            <Activity aria-hidden="true" />
          </span>
          <span className="settings-row__copy">
            <strong>Community live</strong>
            <small>Simula i voti che arrivano mentre usi l&apos;app</small>
          </span>
          <Switch
            checked={preferences.livePulse}
            onChange={(next) => actions.updatePreferences({ livePulse: next })}
            label="Community live"
          />
        </div>
      </section>

      <section className="settings-group">
        <div className="settings-group__title">
          <Trash2 aria-hidden="true" />
          <div>
            <h3>Dati locali</h3>
            <p>
              Voti, commenti, chat e scelte pubblicate sono salvati solo su questo dispositivo:
              non esiste ancora un server.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="button button--danger button--block"
          onClick={() => {
            actions.reset();
            onClose();
            actions.toast("Dati locali cancellati");
          }}
        >
          <Trash2 aria-hidden="true" />
          Cancella i miei dati
        </button>
      </section>

      <p className="settings-version">Sided · prototipo frontend · le preferenze restano su questo dispositivo</p>
    </Sheet>
  );
}
