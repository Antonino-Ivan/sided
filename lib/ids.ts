import type { ID } from "./types";

let counter = 0;

/**
 * Id stabile per il client. `crypto.randomUUID` non è garantito in ogni
 * runtime che tocchiamo (worker, browser vecchi), quindi teniamo un fallback
 * deterministico basato su contatore + timestamp.
 */
export function createId(prefix = "id"): ID {
  const globalCrypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (globalCrypto?.randomUUID) return `${prefix}_${globalCrypto.randomUUID().slice(0, 12)}`;
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}
