import { build } from "esbuild";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));

/**
 * Carica un modulo TypeScript del progetto dentro il test runner di Node.
 *
 * Node non risolve né il TypeScript né l'alias `@/*` del `tsconfig`, quindi
 * usiamo esbuild (già presente come dipendenza di Vite) per produrre al volo
 * un bundle ESM. Così i test girano sul codice vero, senza duplicarne la logica.
 */
export async function loadModule(relativePath) {
  const dir = await mkdtemp(join(tmpdir(), "sided-test-"));
  const outfile = join(dir, "module.mjs");

  await build({
    entryPoints: [join(root, relativePath)],
    bundle: true,
    format: "esm",
    platform: "neutral",
    target: "es2022",
    outfile,
    alias: { "@": root },
    logLevel: "silent",
  });

  return import(pathToFileURL(outfile).href);
}
