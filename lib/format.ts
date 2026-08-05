import type { Choice, ChoiceOption, ID } from "./types";

/**
 * Percentuali che sommano esattamente a 100 usando il metodo dei resti più
 * grandi. Arrotondare ogni valore singolarmente produce totali tipo 99% o
 * 101%, che in una UI che mostra "sei con il 47%" si notano subito.
 */
export function toPercentages(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    if (!values.length) return [];
    // Nessun voto: distribuiamo equamente invece di mostrare tutti zero.
    const base = Math.floor(100 / values.length);
    const result = values.map(() => base);
    for (let i = 0; i < 100 - base * values.length; i += 1) result[i] += 1;
    return result;
  }

  const exact = values.map((value) => (value / total) * 100);
  const floors = exact.map(Math.floor);
  let remainder = 100 - floors.reduce((sum, value) => sum + value, 0);

  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (const { index } of order) {
    if (remainder <= 0) break;
    floors[index] += 1;
    remainder -= 1;
  }

  return floors;
}

/** Conteggi reali dell'opzione, incluso il voto dell'utente corrente. */
export function optionCounts(choice: Choice, myOptionId?: ID | null): number[] {
  return choice.options.map((option) => option.votes + (option.id === myOptionId ? 1 : 0));
}

export function choicePercentages(choice: Choice, myOptionId?: ID | null): number[] {
  return toPercentages(optionCounts(choice, myOptionId));
}

export function totalVotes(choice: Choice, myOptionId?: ID | null): number {
  return optionCounts(choice, myOptionId).reduce((sum, value) => sum + value, 0);
}

/** "A", "B", … "Z", poi numeri: etichetta del lato. */
export function sideLabel(index: number): string {
  return index < 26 ? String.fromCharCode(65 + index) : String(index + 1);
}

export function optionIndex(choice: Choice, optionId: ID | null | undefined): number {
  if (!optionId) return -1;
  return choice.options.findIndex((option) => option.id === optionId);
}

export function findOption(choice: Choice, optionId: ID | null | undefined): ChoiceOption | undefined {
  if (!optionId) return undefined;
  return choice.options.find((option) => option.id === optionId);
}

/** Arrotonda a una cifra decimale e usa la virgola come separatore. */
function short(value: number): string {
  const rounded = Math.abs(value) >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return String(rounded).replace(".", ",");
}

/**
 * 1240 diventa "1,2k". Sotto il migliaio resta il numero pieno.
 *
 * Scritto a mano invece di usare `Intl.NumberFormat({ notation: "compact" })`
 * perché il runtime Worker ha un ICU ridotto: lì la notazione compatta viene
 * ignorata e produce "43.005" mentre il browser produce "43k". Due output
 * diversi per lo stesso dato significano un errore di idratazione.
 */
export function formatCount(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1_000) return String(value);
  if (abs < 1_000_000) return `${short(value / 1_000)}k`;
  return `${short(value / 1_000_000)}mln`;
}

export function formatVotes(value: number): string {
  return `${formatCount(value)} ${value === 1 ? "voto" : "voti"}`;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Tempo relativo compatto in italiano: "ora", "12 min", "3 h", "5 g". */
export function timeAgo(timestamp: number, now = Date.now()): string {
  const elapsed = Math.max(0, now - timestamp);
  if (elapsed < MINUTE) return "ora";
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)} min`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)} h`;
  if (elapsed < 7 * DAY) return `${Math.floor(elapsed / DAY)} g`;
  return new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "short" }).format(timestamp);
}

const clockFormat = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" });

export function formatClock(timestamp: number): string {
  return clockFormat.format(timestamp);
}

export function initialOf(name: string): string {
  const clean = name.replace(/^@/, "").trim();
  return (clean[0] ?? "?").toUpperCase();
}

/** Normalizzazione per la ricerca: minuscole e senza accenti. */
export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
