/**
 * Dominio di Sided.
 *
 * Regola di modellazione: una scelta ha SEMPRE un array di opzioni, anche
 * quando ne ha due. Il vecchio prototipo trattava "lato A / lato B" come
 * concetti primari e questo rendeva impossibile rappresentare correttamente
 * commenti e voti sui formati con più di due opzioni.
 */

export type ID = string;

export type ChoiceFormat =
  /** Due opzioni contrapposte: il formato storico di Sided. */
  | "classic"
  /** Da tre a otto opzioni mostrate insieme. */
  | "multi"
  /** Coppie consecutive: ogni step è uno scontro fra due opzioni. */
  | "chain"
  /** Torneo a eliminazione diretta su un numero pari di partecipanti. */
  | "contest";

export type MediaKind = "image" | "video";

export type Media = {
  url: string;
  kind: MediaKind;
  name: string;
  /**
   * Gli URL `blob:` vivono solo finché la pagina resta aperta. Marcandoli
   * possiamo scartarli in fase di reidratazione invece di mostrare immagini
   * rotte dopo un refresh.
   */
  ephemeral?: boolean;
};

export type Audio = {
  url: string;
  name: string;
  ephemeral?: boolean;
};

export type Accent = "cyan" | "pink" | "violet" | "mint" | "amber" | "blue";

export type Person = {
  id: ID;
  name: string;
  handle: string;
  bio: string;
  accent: Accent;
  /** Popolarità di partenza, serve solo a rendere credibili i suggeriti. */
  followers: number;
};

export type ChoiceOption = {
  id: ID;
  label: string;
  media?: Media;
  /** Voti della community, esclusi i tuoi: il tuo voto viene sommato a parte. */
  votes: number;
};

export type Choice = {
  id: ID;
  format: ChoiceFormat;
  authorId: ID;
  category: CategoryName;
  createdAt: number;
  options: ChoiceOption[];
  background?: Media;
  audio?: Audio;
};

export type Comment = {
  id: ID;
  choiceId: ID;
  /** `null` per i commenti di primo livello. */
  parentId: ID | null;
  authorId: ID;
  /** L'opzione votata da chi commenta, `null` se non ha votato. */
  optionId: ID | null;
  body: string;
  createdAt: number;
  /** Upvote della community, esclusi i tuoi. */
  upvotes: number;
};

export type ChatMessage = {
  id: ID;
  conversationId: ID;
  from: "me" | "them";
  body: string;
  createdAt: number;
  /** Una scelta allegata al messaggio, mostrata come card. */
  choiceId?: ID;
};

export type Conversation = {
  id: ID;
  personId: ID;
  online: boolean;
};

export type NotificationKind = "reply" | "follow" | "trending" | "like" | "choice";

export type Notification = {
  id: ID;
  kind: NotificationKind;
  title: string;
  detail: string;
  createdAt: number;
  /** Deep link opzionale verso la risorsa collegata. */
  href?: string;
};

export const CATEGORIES = [
  "Lifestyle",
  "Sport",
  "Tech",
  "Food",
  "Cultura",
  "Relazioni",
  "Travel",
  "Musica",
] as const;

export type CategoryName = (typeof CATEGORIES)[number];

export type ThemeMode = "system" | "light" | "dark";

export type FeedMode = "perte" | "trend" | "seguiti";

export type CommentSort = "hot" | "recenti";

export type Profile = {
  name: string;
  handle: string;
  bio: string;
  accent: Accent;
};

export type Preferences = {
  theme: ThemeMode;
  notifications: boolean;
  privateProfile: boolean;
  /** Simula attività della community in tempo reale (voti che salgono). */
  livePulse: boolean;
};
