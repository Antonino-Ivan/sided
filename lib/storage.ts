/**
 * Persistenza locale. Finché non esiste un backend, `localStorage` è l'unico
 * posto in cui i dati dell'utente sopravvivono a un refresh.
 *
 * Tutti gli accessi passano da qui perché:
 *  - in SSR `window` non esiste;
 *  - in navigazione privata Safari `localStorage.setItem` può lanciare;
 *  - i dati salvati da una versione precedente vanno scartati, non fatti
 *    esplodere in faccia all'utente.
 */

export const STORAGE_PREFIX = "sided";

/** Alzare quando la forma dello stato persistito cambia in modo incompatibile. */
export const STORAGE_VERSION = 2;

type Envelope<T> = { v: number; data: T };

function available(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStored<T>(key: string, fallback: T): T {
  const store = available();
  if (!store) return fallback;
  try {
    const raw = store.getItem(`${STORAGE_PREFIX}:${key}`);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (!parsed || typeof parsed !== "object" || parsed.v !== STORAGE_VERSION) return fallback;
    return parsed.data;
  } catch {
    return fallback;
  }
}

export function writeStored<T>(key: string, data: T): void {
  const store = available();
  if (!store) return;
  try {
    const envelope: Envelope<T> = { v: STORAGE_VERSION, data };
    store.setItem(`${STORAGE_PREFIX}:${key}`, JSON.stringify(envelope));
  } catch {
    // Quota piena o storage negato: l'app continua a funzionare in memoria.
  }
}

export function clearStored(): void {
  const store = available();
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key?.startsWith(`${STORAGE_PREFIX}:`)) keys.push(key);
    }
    keys.forEach((key) => store.removeItem(key));
  } catch {
    // Niente da fare: lo stato in memoria viene comunque resettato dal chiamante.
  }
}
