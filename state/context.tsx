"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { SSR_NOW, buildSeed } from "@/lib/seed";
import type {
  ChatMessage,
  Choice,
  Comment,
  Conversation,
  ID,
  Notification,
  Person,
} from "@/lib/types";
import { applyDrift, byId } from "./selectors";
import { sidedStore } from "./store";
import type { StoreState } from "./store";

/**
 * Unisce il contenuto seed con quello prodotto dall'utente e lo espone come
 * un unico set di dati. I componenti non sanno (e non devono sapere) quale
 * parte arriva dal seed e quale da localStorage.
 */
export type SidedData = {
  state: StoreState;
  now: number;
  hydrated: boolean;
  me: Person;
  people: Person[];
  peopleById: Map<ID, Person>;
  choices: Choice[];
  choicesById: Map<ID, Choice>;
  comments: Comment[];
  conversations: Conversation[];
  messages: ChatMessage[];
  notifications: Notification[];
  actions: typeof sidedStore;
};

const SidedContext = createContext<SidedData | null>(null);

/** Le opzioni su cui la simulazione live può far salire i voti. */
const pulseTargets = buildSeed(SSR_NOW).choices.flatMap((choice) =>
  choice.options.map((option) => option.id),
);

export function SidedProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(
    sidedStore.subscribe,
    sidedStore.getSnapshot,
    sidedStore.getServerSnapshot,
  );

  useEffect(() => {
    sidedStore.hydrate(pulseTargets);
  }, []);

  const seed = useMemo(() => buildSeed(state.now), [state.now]);

  const value = useMemo<SidedData>(() => {
    const me: Person = {
      id: "me",
      name: state.profile.name,
      handle: state.profile.handle,
      bio: state.profile.bio,
      accent: state.profile.accent,
      followers: 840 + state.myComments.length * 7 + Object.keys(state.votes).length * 3,
    };

    const people = [me, ...seed.people];
    const choices = applyDrift([...state.myChoices, ...seed.choices], state.drift).sort(
      (a, b) => b.createdAt - a.createdAt,
    );
    const comments = [...state.myComments, ...seed.comments];
    const messages = [...seed.messages, ...state.sentMessages].sort(
      (a, b) => a.createdAt - b.createdAt,
    );
    const notifications = [...seed.notifications].sort((a, b) => b.createdAt - a.createdAt);

    return {
      state,
      now: state.now,
      hydrated: state.hydrated,
      me,
      people,
      peopleById: byId(people),
      choices,
      choicesById: byId(choices),
      comments,
      conversations: seed.conversations,
      messages,
      notifications,
      actions: sidedStore,
    };
  }, [state, seed]);

  return <SidedContext.Provider value={value}>{children}</SidedContext.Provider>;
}

export function useSided(): SidedData {
  const value = useContext(SidedContext);
  if (!value) throw new Error("useSided va usato dentro <SidedProvider>");
  return value;
}

/** Scorciatoia: la persona dietro un id, con fallback per autori sconosciuti. */
export function usePerson(id: ID): Person {
  const { peopleById } = useSided();
  return (
    peopleById.get(id) ?? {
      id,
      name: "Utente",
      handle: `@${id}`,
      bio: "",
      accent: "cyan",
      followers: 0,
    }
  );
}
