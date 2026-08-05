import assert from "node:assert/strict";
import test from "node:test";
import { loadModule } from "./helpers/load-ts.mjs";

/**
 * Test sulla logica di dominio: percentuali, feed, ricerca, thread dei
 * commenti e routing. Sono le parti che, se si rompono, mostrano numeri
 * sbagliati all'utente senza far fallire la build.
 */

const format = await loadModule("lib/format.ts");
const selectors = await loadModule("state/selectors.ts");
const router = await loadModule("lib/router.ts");
const seed = await loadModule("lib/seed.ts");

const NOW = Date.UTC(2026, 7, 3, 18, 30, 0);

/** Costruisce una scelta i cui id di opzione derivano dall'id della scelta. */
function choice(id, votes, extra = {}) {
  return {
    id,
    format: "classic",
    authorId: "marco",
    category: "Tech",
    createdAt: NOW - 3_600_000,
    options: votes.map((count, index) => ({
      id: `${id}#${index}`,
      label: `Opzione ${index}`,
      votes: count,
    })),
    ...extra,
  };
}

test("le percentuali sommano sempre a 100", () => {
  const cases = [
    [1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [10, 20, 30],
    [0, 0],
    [999, 1],
    [1, 2, 3, 4, 5, 6, 7, 8],
  ];

  for (const values of cases) {
    const result = format.toPercentages(values);
    const total = result.reduce((sum, value) => sum + value, 0);
    assert.equal(total, 100, `${values} ha prodotto ${result}`);
  }
});

test("senza voti le percentuali sono distribuite, non azzerate", () => {
  assert.deepEqual(format.toPercentages([0, 0, 0]), [34, 33, 33]);
});

test("il voto dell'utente sposta davvero le percentuali", () => {
  const item = choice("c", [2, 2]);
  assert.deepEqual(format.choicePercentages(item, null), [50, 50]);

  const withMyVote = format.choicePercentages(item, "c#0");
  assert.deepEqual(withMyVote, [60, 40]);
  assert.equal(format.totalVotes(item, "c#0"), 5);
});

test("su grandi numeri un singolo voto non falsa l'arrotondamento", () => {
  const item = choice("c", [50, 50]);
  const withMyVote = format.choicePercentages(item, "c#0");
  assert.equal(withMyVote[0] + withMyVote[1], 100);
  assert.equal(format.totalVotes(item, "c#0"), 101);
});

test("i numeri compatti non dipendono dall'ICU del runtime", () => {
  assert.equal(format.formatCount(999), "999");
  assert.equal(format.formatCount(1_000), "1k");
  assert.equal(format.formatCount(1_240), "1,2k");
  assert.equal(format.formatCount(43_005), "43k");
  assert.equal(format.formatCount(2_400_000), "2,4mln");
});

test("il tempo relativo è calcolato rispetto all'ancora passata", () => {
  assert.equal(format.timeAgo(NOW - 30_000, NOW), "ora");
  assert.equal(format.timeAgo(NOW - 45 * 60_000, NOW), "45 min");
  assert.equal(format.timeAgo(NOW - 3 * 3_600_000, NOW), "3 h");
  assert.equal(format.timeAgo(NOW - 2 * 86_400_000, NOW), "2 g");
});

test("il feed «seguiti» mostra solo chi segui", () => {
  const choices = [
    choice("a", [10, 5], { authorId: "marco" }),
    choice("b", [10, 5], { authorId: "nora" }),
    choice("c", [10, 5], { authorId: "me" }),
  ];

  const result = selectors.feedChoices(choices, "seguiti", { following: ["marco"], now: NOW });
  assert.deepEqual(
    result.map((item) => item.id).sort(),
    ["a", "c"],
    "devono comparire gli autori seguiti e le proprie scelte",
  );
});

test("il feed «trend» ordina per voti totali", () => {
  const choices = [
    choice("bassa", [10, 5]),
    choice("alta", [900, 800]),
    choice("media", [100, 50]),
  ];

  const result = selectors.feedChoices(choices, "trend", { following: [], now: NOW });
  assert.deepEqual(result.map((item) => item.id), ["alta", "media", "bassa"]);
});

test("la ricerca trova opzioni, categorie e persone, ignorando gli accenti", () => {
  const choices = [choice("x", [1, 1], { options: [
    { id: "x#0", label: "Città", votes: 3 },
    { id: "x#1", label: "Campagna", votes: 1 },
  ] })];
  const people = [{ id: "n", name: "Nora Fontana", handle: "@nora", bio: "Tech", accent: "cyan", followers: 1 }];

  const byOption = selectors.search("citta", { choices, people, categories: ["Tech"] });
  assert.equal(byOption.choices.length, 1);

  const byPerson = selectors.search("nora", { choices, people, categories: ["Tech"] });
  assert.equal(byPerson.people.length, 1);

  const empty = selectors.search("   ", { choices, people, categories: ["Tech"] });
  assert.deepEqual(empty, { choices: [], people: [], categories: [] });
});

test("le risposte annidate risalgono al commento di primo livello", () => {
  const comments = [
    { id: "r1", choiceId: "c", parentId: null, authorId: "a", optionId: "c#0", body: "radice", createdAt: 1, upvotes: 5 },
    { id: "r2", choiceId: "c", parentId: "r1", authorId: "b", optionId: "c#1", body: "risposta", createdAt: 2, upvotes: 1 },
    { id: "r3", choiceId: "c", parentId: "r2", authorId: "c", optionId: "c#0", body: "risposta alla risposta", createdAt: 3, upvotes: 0 },
  ];

  const thread = selectors.threadComments(comments, { sort: "hot", myUpvotes: [] });
  assert.equal(thread.length, 1);
  assert.equal(thread[0].replies.length, 2, "anche la risposta di secondo livello resta nel thread");
});

test("il filtro per opzione tiene solo i commenti di quel lato", () => {
  const comments = [
    { id: "a", choiceId: "c", parentId: null, authorId: "x", optionId: "c#0", body: "A", createdAt: 1, upvotes: 0 },
    { id: "b", choiceId: "c", parentId: null, authorId: "y", optionId: "c#1", body: "B", createdAt: 2, upvotes: 0 },
  ];

  const onlyB = selectors.threadComments(comments, { sort: "hot", optionFilter: "c#1", myUpvotes: [] });
  assert.deepEqual(onlyB.map((item) => item.id), ["b"]);
});

test("il tuo upvote conta nell'ordinamento «hot»", () => {
  const comments = [
    { id: "a", choiceId: "c", parentId: null, authorId: "x", optionId: null, body: "A", createdAt: 1, upvotes: 3 },
    { id: "b", choiceId: "c", parentId: null, authorId: "y", optionId: null, body: "B", createdAt: 2, upvotes: 3 },
  ];

  const hot = selectors.threadComments(comments, { sort: "hot", myUpvotes: ["b"] });
  assert.equal(hot[0].id, "b");
});

test("la choice map deriva dai voti reali e resta vuota senza voti", () => {
  const choices = [choice("t", [80, 20], { category: "Tech" })];
  assert.deepEqual(selectors.leanings(choices, {}), []);

  const rows = selectors.leanings(choices, { t: { optionId: "t#0", at: NOW } });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].category, "Tech");
  assert.equal(rows[0].alignment > 50, true);
});

test("la percentuale di maggioranza riflette le scelte votate", () => {
  const choices = [
    choice("vinta", [90, 10]),
    choice("persa", [10, 90]),
  ];
  const votes = {
    vinta: { optionId: "vinta#0", at: NOW },
    persa: { optionId: "persa#0", at: NOW },
  };

  const stats = selectors.profileStats({
    choices,
    votes,
    myComments: [],
    myChoices: [],
    following: ["marco"],
  });

  assert.equal(stats.votes, 2);
  assert.equal(stats.majorityRate, 50);
  assert.equal(stats.following, 1);
});

test("la scelta simulata di una persona è stabile fra chiamate", () => {
  const item = choice("s", [70, 30]);
  const first = selectors.simulatedPick("marco", item);
  const second = selectors.simulatedPick("marco", item);
  assert.equal(first, second);
  assert.equal(item.options.some((option) => option.id === first), true);
});

test("ogni rotta sopravvive al giro hash → route → hash", () => {
  const routes = [
    { name: "home" },
    { name: "choice", choiceId: "c6" },
    { name: "explore", query: "mare", category: "Travel" },
    { name: "friends" },
    { name: "create" },
    { name: "activity" },
    { name: "chat", conversationId: "sara" },
    { name: "profile" },
    { name: "person", handle: "@nina" },
  ];

  for (const route of routes) {
    const hash = router.routeToHash(route);
    assert.deepEqual(router.parseHash(hash), route, `rotta ${hash}`);
  }
});

test("un hash sconosciuto torna alla home invece di rompersi", () => {
  assert.deepEqual(router.parseHash("#/qualcosa-che-non-esiste"), { name: "home" });
  assert.deepEqual(router.parseHash(""), { name: "home" });
  assert.deepEqual(router.parseHash("#/scelta/"), { name: "home" });
});

test("il seed è deterministico rispetto all'ancora temporale", () => {
  const a = seed.buildSeed(NOW);
  const b = seed.buildSeed(NOW);
  assert.deepEqual(a.choices, b.choices);
  assert.equal(a.choices.length > 0, true);

  const optionIds = a.choices.flatMap((item) => item.options.map((option) => option.id));
  assert.equal(new Set(optionIds).size, optionIds.length, "gli id delle opzioni devono essere unici");

  const choiceIds = a.choices.map((item) => item.id);
  assert.equal(new Set(choiceIds).size, choiceIds.length, "gli id delle scelte devono essere unici");
});

test("i formati a coppie hanno un numero pari di opzioni", () => {
  const { choices } = seed.buildSeed(NOW);
  for (const item of choices) {
    if (item.format === "chain" || item.format === "contest") {
      assert.equal(item.options.length % 2, 0, `${item.id} ha ${item.options.length} opzioni`);
    }
  }
});

test("ogni commento del seed punta a una scelta e a un'opzione esistenti", () => {
  const { choices, comments } = seed.buildSeed(NOW);
  const byId = new Map(choices.map((item) => [item.id, item]));

  for (const comment of comments) {
    const target = byId.get(comment.choiceId);
    assert.ok(target, `commento ${comment.id} punta a una scelta inesistente`);
    if (comment.optionId) {
      assert.ok(
        target.options.some((option) => option.id === comment.optionId),
        `commento ${comment.id} punta a un'opzione inesistente`,
      );
    }
  }
});
