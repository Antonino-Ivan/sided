import assert from "node:assert/strict";
import test from "node:test";

/**
 * Smoke test del render sul server.
 *
 * Non verifica il layout, ma che il Worker risponda 200 con l'HTML di Sided:
 * è la rete di sicurezza contro un errore di import o di render che
 * trasformerebbe la home in una pagina bianca.
 */

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  // Query unica: evita che l'ESM cache riusi il modulo fra i test.
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("la home risponde 200 con HTML in italiano", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]*lang="it"/i);
  assert.match(html, /<title>Sided — Scegli da che parte stai<\/title>/i);
});

test("il render iniziale contiene già il guscio dell'app", async () => {
  const html = await (await render()).text();

  // Colonna di presentazione e telaio dell'app.
  assert.match(html, /class="[^"]*site-shell/);
  assert.match(html, /class="[^"]*brand-rail/);
  assert.match(html, /class="[^"]*app-frame/);
  assert.match(html, /Scegli da che/);

  // Navigazione principale, con tutte le sezioni raggiungibili.
  for (const label of ["Home", "Amici", "Crea", "Attività", "Profilo"]) {
    assert.ok(html.includes(label), `manca la voce di navigazione «${label}»`);
  }
});

test("il feed è già popolato senza JavaScript lato client", async () => {
  const html = await (await render()).text();

  assert.match(html, /class="[^"]*choice-card/, "manca la scheda di scelta");
  // React separa i nodi di testo con commenti vuoti: li togliamo prima di cercare.
  const text = html.replaceAll("<!-- -->", "");
  assert.match(text, /LATO A/);
  assert.match(text, /LATO B/);
  assert.match(text, /tocca per scegliere/);
  assert.match(text, /Scorri su o giù per cambiare scelta/);
});

test("non resta traccia dello starter da cui nasce il progetto", async () => {
  const html = await (await render()).text();
  assert.doesNotMatch(html, /Starter Project/i);
  assert.doesNotMatch(html, /react-loading-skeleton/i);
  assert.doesNotMatch(html, /sites-preview/i);
});
