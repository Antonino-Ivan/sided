import { choicePercentages, normalize, optionIndex, totalVotes } from "@/lib/format";
import type {
  CategoryName,
  Choice,
  Comment,
  FeedMode,
  ID,
  Notification,
  Person,
} from "@/lib/types";
import type { VoteRecord } from "./store";

/**
 * Funzioni derivate pure: nessun accesso a React, a `window` o allo store.
 * Stanno separate proprio per poterle testare con `node --test`.
 */

export type CommentNode = Comment & { replies: Comment[] };

/** Applica ai conteggi del seed i voti accumulati dalla simulazione live. */
export function applyDrift(choices: Choice[], drift: Record<ID, number>): Choice[] {
  if (!Object.keys(drift).length) return choices;
  return choices.map((choice) => {
    if (!choice.options.some((option) => drift[option.id])) return choice;
    return {
      ...choice,
      options: choice.options.map((option) => ({
        ...option,
        votes: option.votes + (drift[option.id] ?? 0),
      })),
    };
  });
}

export function byId<T extends { id: ID }>(items: T[]): Map<ID, T> {
  return new Map(items.map((item) => [item.id, item]));
}

/**
 * "Per te" mescola freschezza e attività: un contenuto molto votato ma vecchio
 * non deve schiacciare per sempre le scelte nuove.
 */
function relevanceScore(choice: Choice, now: number): number {
  const hours = Math.max(0.5, (now - choice.createdAt) / 3_600_000);
  const votes = choice.options.reduce((sum, option) => sum + option.votes, 0);
  return (votes + 30) / Math.pow(hours + 2, 1.15);
}

export function feedChoices(
  choices: Choice[],
  mode: FeedMode,
  options: { following: ID[]; now: number },
): Choice[] {
  const list = [...choices];
  switch (mode) {
    case "trend":
      return list.sort(
        (a, b) => totalVotes(b) - totalVotes(a) || b.createdAt - a.createdAt,
      );
    case "seguiti": {
      const following = new Set([...options.following, "me"]);
      return list
        .filter((choice) => following.has(choice.authorId))
        .sort((a, b) => b.createdAt - a.createdAt);
    }
    case "perte":
    default:
      return list.sort(
        (a, b) => relevanceScore(b, options.now) - relevanceScore(a, options.now),
      );
  }
}

export function commentsFor(comments: Comment[], choiceId: ID): Comment[] {
  return comments.filter((comment) => comment.choiceId === choiceId);
}

/**
 * Struttura a due livelli: le risposte alle risposte vengono riattaccate al
 * commento di primo livello, così il thread resta leggibile su mobile.
 */
export function threadComments(
  comments: Comment[],
  options: {
    sort: "hot" | "recenti";
    optionFilter?: ID | null;
    myUpvotes: ID[];
  },
): CommentNode[] {
  const upvoted = new Set(options.myUpvotes);
  const score = (comment: Comment) => comment.upvotes + (upvoted.has(comment.id) ? 1 : 0);

  const roots = comments.filter((comment) => !comment.parentId);
  const parentOf = new Map<ID, ID>();
  roots.forEach((root) => parentOf.set(root.id, root.id));

  const replies = comments.filter((comment) => comment.parentId);
  // Due passate: la seconda risolve le risposte annidate a più livelli.
  for (let pass = 0; pass < 2; pass += 1) {
    replies.forEach((reply) => {
      if (parentOf.has(reply.id) || !reply.parentId) return;
      const root = parentOf.get(reply.parentId);
      if (root) parentOf.set(reply.id, root);
    });
  }

  const filtered = options.optionFilter
    ? roots.filter((comment) => comment.optionId === options.optionFilter)
    : roots;

  const sorted = [...filtered].sort((a, b) =>
    options.sort === "recenti" ? b.createdAt - a.createdAt : score(b) - score(a),
  );

  return sorted.map((root) => ({
    ...root,
    replies: replies
      .filter((reply) => parentOf.get(reply.id) === root.id)
      .sort((a, b) => a.createdAt - b.createdAt),
  }));
}

export type SearchResults = {
  choices: Choice[];
  people: Person[];
  categories: CategoryName[];
};

export function search(
  query: string,
  data: { choices: Choice[]; people: Person[]; categories: readonly CategoryName[] },
): SearchResults {
  const q = normalize(query.trim());
  if (!q) return { choices: [], people: [], categories: [] };

  const matchesChoice = (choice: Choice) =>
    normalize(choice.category).includes(q) ||
    choice.options.some((option) => normalize(option.label).includes(q));

  return {
    choices: data.choices.filter(matchesChoice).slice(0, 12),
    people: data.people
      .filter(
        (person) =>
          normalize(person.name).includes(q) ||
          normalize(person.handle).includes(q) ||
          normalize(person.bio).includes(q),
      )
      .slice(0, 8),
    categories: data.categories.filter((category) => normalize(category).includes(q)),
  };
}

export type CategoryStat = { name: CategoryName; count: number; votes: number };

export function categoryStats(
  choices: Choice[],
  categories: readonly CategoryName[],
): CategoryStat[] {
  return categories
    .map((name) => {
      const inCategory = choices.filter((choice) => choice.category === name);
      return {
        name,
        count: inCategory.length,
        votes: inCategory.reduce((sum, choice) => sum + totalVotes(choice), 0),
      };
    })
    .sort((a, b) => b.votes - a.votes);
}

export type LeaningRow = {
  category: CategoryName;
  label: string;
  alignment: number;
  votes: number;
};

/**
 * "Choice map": per ogni categoria in cui hai votato mostriamo l'ultima
 * posizione presa e quanto sei allineato alla maggioranza. Deriva davvero dai
 * tuoi voti — se non hai votato, la sezione resta vuota invece di inventare.
 */
export function leanings(
  choices: Choice[],
  votes: Record<ID, VoteRecord>,
): LeaningRow[] {
  const byCategory = new Map<CategoryName, { row: LeaningRow; at: number }>();

  choices.forEach((choice) => {
    const vote = votes[choice.id];
    if (!vote) return;
    const index = optionIndex(choice, vote.optionId);
    if (index < 0) return;
    const alignment = choicePercentages(choice, vote.optionId)[index] ?? 0;
    const existing = byCategory.get(choice.category);
    const votesInCategory = (existing?.row.votes ?? 0) + 1;

    if (!existing || vote.at > existing.at) {
      byCategory.set(choice.category, {
        at: vote.at,
        row: {
          category: choice.category,
          label: choice.options[index].label,
          alignment,
          votes: votesInCategory,
        },
      });
    } else {
      existing.row.votes = votesInCategory;
    }
  });

  return [...byCategory.values()]
    .map((entry) => entry.row)
    .sort((a, b) => b.votes - a.votes || b.alignment - a.alignment);
}

export type RecentVote = { choice: Choice; optionId: ID; at: number };

export function recentVotes(
  choices: Choice[],
  votes: Record<ID, VoteRecord>,
  limit = 6,
): RecentVote[] {
  return Object.entries(votes)
    .map(([choiceId, vote]) => {
      const choice = choices.find((item) => item.id === choiceId);
      return choice ? { choice, optionId: vote.optionId, at: vote.at } : null;
    })
    .filter((entry): entry is RecentVote => entry !== null)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit);
}

export type ProfileStats = {
  votes: number;
  comments: number;
  published: number;
  following: number;
  /** Quanto spesso ti trovi dalla parte della maggioranza. */
  majorityRate: number | null;
};

export function profileStats(input: {
  choices: Choice[];
  votes: Record<ID, VoteRecord>;
  myComments: Comment[];
  myChoices: Choice[];
  following: ID[];
}): ProfileStats {
  let majority = 0;
  let counted = 0;

  input.choices.forEach((choice) => {
    const vote = input.votes[choice.id];
    if (!vote) return;
    const index = optionIndex(choice, vote.optionId);
    if (index < 0) return;
    const percentages = choicePercentages(choice, vote.optionId);
    const best = Math.max(...percentages);
    counted += 1;
    if (percentages[index] === best) majority += 1;
  });

  return {
    votes: counted,
    comments: input.myComments.length,
    published: input.myChoices.length,
    following: input.following.length,
    majorityRate: counted ? Math.round((majority / counted) * 100) : null,
  };
}

/**
 * Affinità con una persona: percentuale di scelte in cui avete votato la
 * stessa opzione. Le opinioni delle altre persone sono simulate in modo
 * deterministico a partire dagli id, così il numero resta stabile fra render.
 */
export function affinityWith(personId: ID, choices: Choice[], votes: Record<ID, VoteRecord>): number {
  const voted = choices.filter((choice) => votes[choice.id]);
  if (!voted.length) return 0;
  let same = 0;
  voted.forEach((choice) => {
    const vote = votes[choice.id];
    const simulated = simulatedPick(personId, choice);
    if (simulated === vote.optionId) same += 1;
  });
  return Math.round((same / voted.length) * 100);
}

/** Hash stabile: stessa persona + stessa scelta ⇒ sempre la stessa opzione. */
export function simulatedPick(personId: ID, choice: Choice): ID {
  let hash = 0;
  const key = `${personId}:${choice.id}`;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  // Le opzioni più votate hanno più probabilità di essere scelte.
  const weights = choice.options.map((option) => option.votes + 1);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let target = hash % total;
  for (let i = 0; i < weights.length; i += 1) {
    target -= weights[i];
    if (target < 0) return choice.options[i].id;
  }
  return choice.options[0].id;
}

export function unreadNotifications(
  notifications: Notification[],
  read: ID[],
): Notification[] {
  const seen = new Set(read);
  return notifications.filter((notification) => !seen.has(notification.id));
}
