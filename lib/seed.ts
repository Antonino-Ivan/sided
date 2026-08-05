import type {
  CategoryName,
  Choice,
  ChoiceFormat,
  Comment,
  Conversation,
  ChatMessage,
  Notification,
  Person,
} from "./types";

/**
 * Contenuto dimostrativo di Sided.
 *
 * I tempi sono espressi come *minuti fa* e vengono convertiti in timestamp
 * assoluti da `buildSeed(now)`. Questo tiene allineati render sul server e
 * render sul client: entrambi partono dallo stesso `now` dello store, quindi
 * "45 min" resta "45 min" e non c'è mismatch di idratazione.
 */

const MINUTE = 60_000;

export const people: Person[] = [
  { id: "marco", name: "Marco Bellini", handle: "@marco", bio: "Sempre il primo a dire di sì.", accent: "cyan", followers: 1840 },
  { id: "sara", name: "Sara Conti", handle: "@sara", bio: "Opinioni forti, gentilmente.", accent: "pink", followers: 3120 },
  { id: "luca", name: "Luca Ferrero", handle: "@luca", bio: "Divano, serie, zero rimpianti.", accent: "violet", followers: 940 },
  { id: "giada", name: "Giada Rinaldi", handle: "@giada", bio: "Dipende sempre dalla compagnia.", accent: "mint", followers: 2260 },
  { id: "viola", name: "Viola Amato", handle: "@viola", bio: "Le parole giuste, al momento giusto.", accent: "amber", followers: 1510 },
  { id: "nina", name: "Nina De Luca", handle: "@nina", bio: "Leggo più di quanto dormo.", accent: "pink", followers: 4380 },
  { id: "teo", name: "Matteo Greco", handle: "@teo", bio: "Montagna tutta la vita.", accent: "blue", followers: 780 },
  { id: "bea", name: "Beatrice Sala", handle: "@bea", bio: "Sentieri, silenzio, aria fresca.", accent: "mint", followers: 1290 },
  { id: "edo", name: "Edoardo Villa", handle: "@edo", bio: "Primo bagno alle sette.", accent: "cyan", followers: 660 },
  { id: "nora", name: "Nora Fontana", handle: "@nora", bio: "Tech senza tifoserie. Quasi.", accent: "violet", followers: 5210 },
  { id: "tommi", name: "Tommaso Riva", handle: "@tommi", bio: "Chiamami, non scrivermi.", accent: "amber", followers: 430 },
  { id: "miki", name: "Michele Rossi", handle: "@miki", bio: "Dark mode anche d'estate.", accent: "blue", followers: 1120 },
];

type SeedOption = [label: string, votes: number];

type SeedChoice = {
  id: string;
  format: ChoiceFormat;
  authorId: string;
  category: CategoryName;
  agoMinutes: number;
  options: SeedOption[];
};

const seedChoices: SeedChoice[] = [
  {
    id: "c1", format: "classic", authorId: "marco", category: "Lifestyle", agoMinutes: 42,
    options: [["Esci stasera", 934], ["Resta a casa", 297]],
  },
  {
    id: "c2", format: "classic", authorId: "viola", category: "Relazioni", agoMinutes: 88,
    options: [["Messaggio", 536], ["Chiamata", 328]],
  },
  {
    id: "c3", format: "classic", authorId: "edo", category: "Travel", agoMinutes: 175,
    options: [["Mare", 1512], ["Montagna", 1288]],
  },
  {
    id: "c4", format: "classic", authorId: "nora", category: "Tech", agoMinutes: 240,
    options: [["iPhone", 1968], ["Android", 2132]],
  },
  {
    id: "c5", format: "multi", authorId: "giada", category: "Food", agoMinutes: 63,
    options: [["Carbonara", 1420], ["Cacio e pepe", 980], ["Amatriciana", 742], ["Gricia", 418]],
  },
  {
    id: "c6", format: "classic", authorId: "teo", category: "Sport", agoMinutes: 21,
    options: [["Ferrari", 2740], ["Red Bull", 1960]],
  },
  {
    id: "c7", format: "classic", authorId: "nina", category: "Cultura", agoMinutes: 310,
    options: [["Il libro", 1104], ["Il film", 876]],
  },
  {
    id: "c8", format: "multi", authorId: "sara", category: "Musica", agoMinutes: 137,
    options: [["Sanremo", 612], ["Live in un club", 1340], ["Festival d'estate", 908], ["Cuffie e basta", 486]],
  },
  {
    id: "c9", format: "classic", authorId: "miki", category: "Tech", agoMinutes: 14,
    options: [["Dark mode", 3180], ["Light mode", 604]],
  },
  {
    id: "c10", format: "contest", authorId: "luca", category: "Sport", agoMinutes: 420,
    options: [
      ["Milan", 0], ["Inter", 0], ["Roma", 0], ["Lazio", 0],
      ["Juventus", 0], ["Torino", 0], ["Napoli", 0], ["Genoa", 0],
    ],
  },
  {
    id: "c11", format: "chain", authorId: "tommi", category: "Relazioni", agoMinutes: 95,
    options: [
      ["Cena fuori", 820], ["Aperitivo lungo", 640],
      ["Lo dici tu", 410], ["Aspetti che lo dica lei", 1030],
      ["Ti offri di pagare", 990], ["Dividete", 760],
    ],
  },
  {
    id: "c12", format: "classic", authorId: "nina", category: "Lifestyle", agoMinutes: 480,
    options: [["Sveglia alle 6", 712], ["Sveglia alle 9", 1348]],
  },
  {
    id: "c13", format: "classic", authorId: "bea", category: "Travel", agoMinutes: 640,
    options: [["Zaino in spalla", 1180], ["Valigia con le rotelle", 690]],
  },
  {
    id: "c14", format: "multi", authorId: "edo", category: "Cultura", agoMinutes: 200,
    options: [["Cinema", 940], ["Serie TV", 1610], ["Teatro", 380]],
  },
  {
    id: "c15", format: "classic", authorId: "viola", category: "Relazioni", agoMinutes: 30,
    options: [["Dividete il conto", 1460], ["Offre chi invita", 1120]],
  },
  {
    id: "c16", format: "classic", authorId: "bea", category: "Food", agoMinutes: 155,
    options: [["Pizza al piatto", 1720], ["Pizza al taglio", 830]],
  },
];

type SeedComment = {
  id: string;
  choiceId: string;
  parentId: string | null;
  authorId: string;
  /** Indice dell'opzione votata, `null` se chi commenta non si schiera. */
  option: number | null;
  body: string;
  agoMinutes: number;
  upvotes: number;
};

const seedComments: SeedComment[] = [
  { id: "k1", choiceId: "c1", parentId: null, authorId: "sara", option: 0, body: "Chi resta a casa il sabato sera non vive davvero.", agoMinutes: 34, upvotes: 124 },
  { id: "k2", choiceId: "c1", parentId: "k1", authorId: "luca", option: 1, body: "Vivere è anche non avere il mal di testa la domenica.", agoMinutes: 28, upvotes: 88 },
  { id: "k3", choiceId: "c1", parentId: "k1", authorId: "giada", option: 0, body: "Concordo, però dipende con chi esci.", agoMinutes: 19, upvotes: 31 },
  { id: "k4", choiceId: "c1", parentId: null, authorId: "luca", option: 1, body: "Divano più serie batte club rumoroso. Non c'è gara.", agoMinutes: 26, upvotes: 96 },
  { id: "k5", choiceId: "c1", parentId: null, authorId: "teo", option: 1, body: "Il vero lusso nel 2026 è annullare i piani.", agoMinutes: 11, upvotes: 57 },

  { id: "k6", choiceId: "c2", parentId: null, authorId: "nina", option: 0, body: "Un messaggio ti lascia il tempo di trovare le parole giuste.", agoMinutes: 45, upvotes: 143 },
  { id: "k7", choiceId: "c2", parentId: null, authorId: "tommi", option: 1, body: "La voce dice cose che il testo non potrà mai dire.", agoMinutes: 22, upvotes: 127 },
  { id: "k8", choiceId: "c2", parentId: "k7", authorId: "viola", option: 0, body: "Sì, ma alle 23 di martedì un messaggio è più educato.", agoMinutes: 15, upvotes: 64 },

  { id: "k9", choiceId: "c3", parentId: null, authorId: "bea", option: 1, body: "Silenzio, sentieri, aria fresca. La montagna vince sempre.", agoMinutes: 160, upvotes: 208 },
  { id: "k10", choiceId: "c3", parentId: null, authorId: "edo", option: 0, body: "Primo bagno alle sette e poi colazione vista mare. Fine.", agoMinutes: 120, upvotes: 186 },
  { id: "k11", choiceId: "c3", parentId: "k10", authorId: "teo", option: 1, body: "Alle sette in montagna sei già in cima. Punti di vista.", agoMinutes: 96, upvotes: 74 },

  { id: "k12", choiceId: "c4", parentId: null, authorId: "teo", option: 1, body: "Libertà di scelta e personalizzazione: Android, facile.", agoMinutes: 210, upvotes: 312 },
  { id: "k13", choiceId: "c4", parentId: null, authorId: "miki", option: 0, body: "Il punto non è il telefono, è tutto quello che ci sta attorno.", agoMinutes: 190, upvotes: 288 },
  { id: "k14", choiceId: "c4", parentId: "k12", authorId: "nora", option: 0, body: "Personalizzo di meno e finisco le giornate prima. Non è un caso.", agoMinutes: 150, upvotes: 141 },

  { id: "k15", choiceId: "c5", parentId: null, authorId: "marco", option: 0, body: "La carbonara è la risposta anche quando la domanda è un'altra.", agoMinutes: 50, upvotes: 176 },
  { id: "k16", choiceId: "c5", parentId: null, authorId: "bea", option: 1, body: "Cacio e pepe: tre ingredienti, zero posti dove nascondersi.", agoMinutes: 41, upvotes: 154 },
  { id: "k17", choiceId: "c5", parentId: null, authorId: "sara", option: 3, body: "La gricia è la carbonara per chi sa cosa sta facendo.", agoMinutes: 22, upvotes: 91 },

  { id: "k18", choiceId: "c6", parentId: null, authorId: "marco", option: 0, body: "Rosso. Sempre. Anche quando fa male.", agoMinutes: 18, upvotes: 204 },
  { id: "k19", choiceId: "c6", parentId: null, authorId: "nora", option: 1, body: "Tifare per chi vince è noioso, tifare per chi progetta meglio no.", agoMinutes: 12, upvotes: 97 },

  { id: "k20", choiceId: "c7", parentId: null, authorId: "nina", option: 0, body: "Il film dura due ore, il libro ti resta addosso per anni.", agoMinutes: 280, upvotes: 233 },
  { id: "k21", choiceId: "c7", parentId: "k20", authorId: "giada", option: 1, body: "Però il film me lo guardo stasera, il libro fra sei mesi.", agoMinutes: 240, upvotes: 118 },

  { id: "k22", choiceId: "c8", parentId: null, authorId: "sara", option: 1, body: "Duecento persone in un club battono ventimila in uno stadio.", agoMinutes: 100, upvotes: 165 },
  { id: "k23", choiceId: "c9", parentId: null, authorId: "miki", option: 0, body: "Light mode è un'aggressione, non un tema.", agoMinutes: 10, upvotes: 421 },
  { id: "k24", choiceId: "c9", parentId: "k23", authorId: "nora", option: 1, body: "Con la luce del sole ne riparliamo.", agoMinutes: 6, upvotes: 189 },
  { id: "k25", choiceId: "c12", parentId: null, authorId: "marco", option: 1, body: "Chi si sveglia alle 6 lo dice, ed è quello il problema.", agoMinutes: 400, upvotes: 276 },
  { id: "k26", choiceId: "c15", parentId: null, authorId: "viola", option: 0, body: "Dividere non è freddezza, è non dover tenere il conto.", agoMinutes: 25, upvotes: 148 },
  { id: "k27", choiceId: "c16", parentId: null, authorId: "giada", option: 1, body: "Al taglio si cammina mangiando. È mezza vacanza.", agoMinutes: 130, upvotes: 112 },
];

type SeedConversation = {
  id: string;
  personId: string;
  online: boolean;
  messages: Array<{ from: "me" | "them"; body: string; agoMinutes: number; choiceId?: string }>;
};

const seedConversations: SeedConversation[] = [
  {
    id: "sara", personId: "sara", online: true,
    messages: [
      { from: "them", body: "Hai visto la scelta di Marco?", agoMinutes: 14, choiceId: "c1" },
      { from: "me", body: "Sì, ma stavolta resto a casa 😅", agoMinutes: 12 },
      { from: "them", body: "No, su questa non puoi scegliere casa 😄", agoMinutes: 11 },
    ],
  },
  {
    id: "luca", personId: "luca", online: true,
    messages: [
      { from: "them", body: "Ti mando quella su iPhone vs Android", agoMinutes: 52, choiceId: "c4" },
      { from: "me", body: "Preparati, qui si litiga 😂", agoMinutes: 49 },
    ],
  },
  {
    id: "nina", personId: "nina", online: false,
    messages: [
      { from: "them", body: "Abbiamo scelto uguale anche questa volta", agoMinutes: 96 },
      { from: "me", body: "Il nostro 78% non mente", agoMinutes: 91 },
    ],
  },
  {
    id: "giada", personId: "giada", online: true,
    messages: [
      { from: "them", body: "Serve il tuo voto qui, sto perdendo", agoMinutes: 140, choiceId: "c5" },
    ],
  },
  {
    id: "teo", personId: "teo", online: false,
    messages: [{ from: "them", body: "Montagna tutta la vita.", agoMinutes: 210 }],
  },
];

type SeedNotification = Omit<Notification, "createdAt"> & { agoMinutes: number };

const seedNotifications: SeedNotification[] = [
  { id: "n1", kind: "reply", title: "@sara ha risposto al tuo commento", detail: "«Su questo non cambierò mai idea.»", agoMinutes: 2, href: "#/scelta/c1" },
  { id: "n2", kind: "trending", title: "Una scelta che segui sta esplodendo", detail: "Dark mode vs Light mode: 500 voti nell'ultima ora", agoMinutes: 18, href: "#/scelta/c9" },
  { id: "n3", kind: "follow", title: "@nina ha iniziato a seguirti", detail: "Avete il 78% di scelte in comune", agoMinutes: 64, href: "#/persona/nina" },
  { id: "n4", kind: "choice", title: "Nuova scelta in Relazioni", detail: "Dividete il conto vs Offre chi invita", agoMinutes: 30, href: "#/scelta/c15" },
  { id: "n5", kind: "like", title: "@luca ha apprezzato la tua opinione", detail: "«Divano più serie batte club rumoroso.»", agoMinutes: 300, href: "#/scelta/c1" },
  { id: "n6", kind: "trending", title: "Il tuo lato è in minoranza", detail: "Solo il 34% ha scelto come te su Sveglia alle 6", agoMinutes: 420, href: "#/scelta/c12" },
];

export type Seed = {
  people: Person[];
  choices: Choice[];
  comments: Comment[];
  conversations: Conversation[];
  messages: ChatMessage[];
  notifications: Notification[];
};

export function optionId(choiceId: string, index: number): string {
  return `${choiceId}#${index}`;
}

/**
 * Costruisce lo stato iniziale ancorato a `now`. Chiamato con lo stesso valore
 * su server e client, produce esattamente lo stesso output.
 */
export function buildSeed(now: number): Seed {
  const choices: Choice[] = seedChoices.map((item) => ({
    id: item.id,
    format: item.format,
    authorId: item.authorId,
    category: item.category,
    createdAt: now - item.agoMinutes * MINUTE,
    options: item.options.map(([label, votes], index) => ({
      id: optionId(item.id, index),
      label,
      votes,
    })),
  }));

  const comments: Comment[] = seedComments.map((item) => ({
    id: item.id,
    choiceId: item.choiceId,
    parentId: item.parentId,
    authorId: item.authorId,
    optionId: item.option === null ? null : optionId(item.choiceId, item.option),
    body: item.body,
    createdAt: now - item.agoMinutes * MINUTE,
    upvotes: item.upvotes,
  }));

  const conversations: Conversation[] = seedConversations.map((item) => ({
    id: item.id,
    personId: item.personId,
    online: item.online,
  }));

  const messages: ChatMessage[] = seedConversations.flatMap((conversation) =>
    conversation.messages.map((message, index) => ({
      id: `${conversation.id}-m${index}`,
      conversationId: conversation.id,
      from: message.from,
      body: message.body,
      createdAt: now - message.agoMinutes * MINUTE,
      choiceId: message.choiceId,
    })),
  );

  const notifications: Notification[] = seedNotifications.map(({ agoMinutes, ...rest }) => ({
    ...rest,
    createdAt: now - agoMinutes * MINUTE,
  }));

  return { people, choices, comments, conversations, messages, notifications };
}

/**
 * Ancora temporale usata durante il render sul server e al primo render sul
 * client. Un valore fisso garantisce markup identico; subito dopo
 * l'idratazione lo store ribasa tutto sull'orologio reale.
 */
export const SSR_NOW = Date.UTC(2026, 7, 3, 18, 30, 0);

/** Persone che l'utente segue già alla prima apertura. */
export const defaultFollowing = ["marco", "sara", "nina", "teo", "giada"];

export const defaultProfile = {
  name: "Pietro",
  handle: "@pietro",
  bio: "Curioso per natura. Quasi sempre dalla parte difficile.",
  accent: "violet" as const,
};
