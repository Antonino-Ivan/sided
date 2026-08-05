import { createId } from "@/lib/ids";
import { readStored, writeStored, clearStored } from "@/lib/storage";
import { SSR_NOW, defaultFollowing, defaultProfile } from "@/lib/seed";
import type {
  ChatMessage,
  Choice,
  Comment,
  ID,
  Preferences,
  Profile,
} from "@/lib/types";

/**
 * Store esterno dell'app.
 *
 * Sided non ha (ancora) un backend, quindi questo file *è* il backend: tiene
 * lo stato dell'utente, lo scrive su localStorage e notifica React.
 *
 * È implementato come store esterno invece che con `useState` + `useEffect`
 * perché il primo render avviene sul server, dove localStorage non esiste.
 * `useSyncExternalStore` ci lascia dichiarare uno snapshot "server" stabile e
 * passare a quello reale dopo l'idratazione, senza mismatch e senza scrivere
 * stato dentro un effect.
 */

export type Toast = {
  id: ID;
  message: string;
  tone: "default" | "success";
};

/** Il voto dell'utente su una scelta, con il momento in cui l'ha espresso. */
export type VoteRecord = { optionId: ID; at: number };

/** La parte di stato che sopravvive a un refresh. */
export type PersistedState = {
  profile: Profile;
  preferences: Preferences;
  /** choiceId → voto dell'utente. Il timestamp alimenta "scelte recenti". */
  votes: Record<ID, VoteRecord>;
  /** Commenti a cui l'utente ha dato upvote. */
  commentUpvotes: ID[];
  following: ID[];
  readNotifications: ID[];
  myComments: Comment[];
  myChoices: Choice[];
  sentMessages: ChatMessage[];
  /** conversationId → istante dell'ultima apertura, per i badge "non letti". */
  chatSeen: Record<ID, number>;
  /**
   * Voti accumulati dalla simulazione "live" sulle singole opzioni. Tenerli
   * separati dal seed permette di riapplicarli al reload senza duplicare i
   * contenuti di base.
   */
  drift: Record<ID, number>;
  onboarded: boolean;
};

export type StoreState = PersistedState & {
  /** Ancora temporale di tutti i contenuti seed. */
  now: number;
  /** `false` finché non abbiamo letto localStorage. */
  hydrated: boolean;
  toasts: Toast[];
};

export const defaultPreferences: Preferences = {
  theme: "system",
  notifications: true,
  privateProfile: false,
  livePulse: true,
};

export function defaultPersisted(): PersistedState {
  return {
    profile: { ...defaultProfile },
    preferences: { ...defaultPreferences },
    votes: {},
    commentUpvotes: [],
    following: [...defaultFollowing],
    readNotifications: [],
    myComments: [],
    myChoices: [],
    sentMessages: [],
    chatSeen: {},
    drift: {},
    onboarded: false,
  };
}

const STORAGE_KEY = "state";

/**
 * Snapshot usato dal render sul server e dal primo render sul client.
 * Deve essere lo *stesso oggetto* a ogni chiamata, altrimenti React entra in
 * loop di render.
 */
const serverSnapshot: StoreState = Object.freeze({
  ...defaultPersisted(),
  now: SSR_NOW,
  hydrated: false,
  toasts: [] as Toast[],
}) as StoreState;

/** Gli URL `blob:` non sopravvivono al reload: non ha senso salvarli. */
function stripEphemeralMedia(choices: Choice[]): Choice[] {
  return choices.map((choice) => ({
    ...choice,
    background: choice.background?.ephemeral ? undefined : choice.background,
    audio: choice.audio?.ephemeral ? undefined : choice.audio,
    options: choice.options.map((option) => ({
      ...option,
      media: option.media?.ephemeral ? undefined : option.media,
    })),
  }));
}

function toPersisted(state: StoreState): PersistedState {
  return {
    profile: state.profile,
    preferences: state.preferences,
    votes: state.votes,
    commentUpvotes: state.commentUpvotes,
    following: state.following,
    readNotifications: state.readNotifications,
    myComments: state.myComments,
    myChoices: stripEphemeralMedia(state.myChoices),
    sentMessages: state.sentMessages,
    chatSeen: state.chatSeen,
    drift: state.drift,
    onboarded: state.onboarded,
  };
}

/** Fonde i dati salvati con i default, tollerando file scritti male. */
function mergePersisted(stored: Partial<PersistedState> | null): PersistedState {
  const base = defaultPersisted();
  if (!stored || typeof stored !== "object") return base;
  return {
    profile: { ...base.profile, ...stored.profile },
    preferences: { ...base.preferences, ...stored.preferences },
    votes: stored.votes ?? base.votes,
    commentUpvotes: stored.commentUpvotes ?? base.commentUpvotes,
    following: stored.following ?? base.following,
    readNotifications: stored.readNotifications ?? base.readNotifications,
    myComments: stored.myComments ?? base.myComments,
    myChoices: stored.myChoices ?? base.myChoices,
    sentMessages: stored.sentMessages ?? base.sentMessages,
    chatSeen: stored.chatSeen ?? base.chatSeen,
    drift: stored.drift ?? base.drift,
    onboarded: stored.onboarded ?? base.onboarded,
  };
}

class SidedStore {
  private state: StoreState = serverSnapshot;
  private listeners = new Set<() => void>();
  private toastTimers = new Map<ID, ReturnType<typeof setTimeout>>();
  private pulseTimer: ReturnType<typeof setInterval> | null = null;
  /** Id delle opzioni su cui la simulazione può far salire i voti. */
  private pulseTargets: ID[] = [];

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): StoreState => this.state;

  getServerSnapshot = (): StoreState => serverSnapshot;

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  private update(patch: Partial<StoreState>, persist = true) {
    this.state = { ...this.state, ...patch };
    if (persist && this.state.hydrated) writeStored(STORAGE_KEY, toPersisted(this.state));
    this.emit();
  }

  /** Chiamato una volta dopo il mount: legge localStorage e riparte dall'orologio vero. */
  hydrate = (pulseTargets: ID[]) => {
    if (this.state.hydrated) return;
    this.pulseTargets = pulseTargets;
    const stored = readStored<Partial<PersistedState> | null>(STORAGE_KEY, null);
    this.state = {
      ...mergePersisted(stored),
      now: Date.now(),
      hydrated: true,
      toasts: [],
    };
    this.emit();
    this.startPulse();
  }

  // ---------------------------------------------------------------- simulazione

  private startPulse() {
    this.stopPulse();
    if (!this.state.preferences.livePulse || typeof window === "undefined") return;
    this.pulseTimer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      this.tick();
    }, 9_000);
  }

  private stopPulse() {
    if (this.pulseTimer !== null) clearInterval(this.pulseTimer);
    this.pulseTimer = null;
  }

  /** Fa salire i voti di qualche opzione: dà l'impressione di una community viva. */
  private tick() {
    if (!this.pulseTargets.length) return;
    const drift = { ...this.state.drift };
    const bumps = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < bumps; i += 1) {
      const target = this.pulseTargets[Math.floor(Math.random() * this.pulseTargets.length)];
      drift[target] = (drift[target] ?? 0) + 1 + Math.floor(Math.random() * 4);
    }
    this.update({ drift, now: Date.now() });
  }

  // -------------------------------------------------------------------- azioni

  vote = (choiceId: ID, optionId: ID) => {
    this.update({
      votes: { ...this.state.votes, [choiceId]: { optionId, at: Date.now() } },
    });
  }

  clearVote = (choiceId: ID) => {
    const votes = { ...this.state.votes };
    delete votes[choiceId];
    this.update({ votes });
  }

  addComment = (input: { choiceId: ID; parentId: ID | null; optionId: ID | null; body: string }): Comment => {
    const comment: Comment = {
      id: createId("cm"),
      choiceId: input.choiceId,
      parentId: input.parentId,
      authorId: "me",
      optionId: input.optionId,
      body: input.body,
      createdAt: Date.now(),
      upvotes: 0,
    };
    this.update({ myComments: [comment, ...this.state.myComments] });
    return comment;
  }

  removeComment = (commentId: ID) => {
    this.update({
      myComments: this.state.myComments.filter(
        (comment) => comment.id !== commentId && comment.parentId !== commentId,
      ),
    });
  }

  toggleCommentUpvote = (commentId: ID) => {
    const current = this.state.commentUpvotes;
    const next = current.includes(commentId)
      ? current.filter((id) => id !== commentId)
      : [...current, commentId];
    this.update({ commentUpvotes: next });
  }

  toggleFollow = (personId: ID) => {
    const current = this.state.following;
    const following = current.includes(personId)
      ? current.filter((id) => id !== personId)
      : [...current, personId];
    this.update({ following });
    return following.includes(personId);
  }

  publishChoice = (choice: Choice) => {
    this.update({ myChoices: [choice, ...this.state.myChoices] });
  }

  deleteChoice = (choiceId: ID) => {
    const votes = { ...this.state.votes };
    delete votes[choiceId];
    this.update({
      myChoices: this.state.myChoices.filter((choice) => choice.id !== choiceId),
      myComments: this.state.myComments.filter((comment) => comment.choiceId !== choiceId),
      votes,
    });
  }

  sendMessage = (conversationId: ID, body: string, choiceId?: ID) => {
    const message: ChatMessage = {
      id: createId("msg"),
      conversationId,
      from: "me",
      body,
      createdAt: Date.now(),
      choiceId,
    };
    this.update({ sentMessages: [...this.state.sentMessages, message] });
  }

  markChatSeen = (conversationId: ID) => {
    this.update({
      chatSeen: { ...this.state.chatSeen, [conversationId]: Date.now() },
    });
  }

  markNotificationsRead = (ids: ID[]) => {
    const merged = Array.from(new Set([...this.state.readNotifications, ...ids]));
    if (merged.length === this.state.readNotifications.length) return;
    this.update({ readNotifications: merged });
  }

  updateProfile = (patch: Partial<Profile>) => {
    this.update({ profile: { ...this.state.profile, ...patch } });
  }

  updatePreferences = (patch: Partial<Preferences>) => {
    const preferences = { ...this.state.preferences, ...patch };
    this.update({ preferences });
    if (patch.livePulse !== undefined) {
      if (preferences.livePulse) this.startPulse();
      else this.stopPulse();
    }
  }

  completeOnboarding = (profile: Partial<Profile>, following: ID[]) => {
    this.update({
      profile: { ...this.state.profile, ...profile },
      following: Array.from(new Set([...this.state.following, ...following])),
      onboarded: true,
    });
  }

  skipOnboarding = () => {
    this.update({ onboarded: true });
  }

  reset = () => {
    clearStored();
    this.stopPulse();
    this.state = { ...defaultPersisted(), now: Date.now(), hydrated: true, toasts: [] };
    this.emit();
    this.startPulse();
  }

  // -------------------------------------------------------------------- toast

  toast = (message: string, tone: Toast["tone"] = "default") => {
    const item: Toast = { id: createId("t"), message, tone };
    this.update({ toasts: [...this.state.toasts, item] }, false);
    const timer = setTimeout(() => this.dismissToast(item.id), 3_200);
    this.toastTimers.set(item.id, timer);
  }

  dismissToast = (id: ID) => {
    const timer = this.toastTimers.get(id);
    if (timer) clearTimeout(timer);
    this.toastTimers.delete(id);
    this.update({ toasts: this.state.toasts.filter((toast) => toast.id !== id) }, false);
  }
}

export const sidedStore = new SidedStore();
