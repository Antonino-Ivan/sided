"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { formatClock } from "@/lib/format";
import type { Route } from "@/lib/router";
import { useSided } from "@/state/context";
import { EmptyState } from "@/components/ui/Controls";
import { Sheet } from "@/components/ui/Sheet";
import { Avatar } from "@/components/ui/Avatar";
import { ChoiceRow } from "@/components/choice/ChoiceRow";

/** Conversazione con un amico. I messaggi inviati restano salvati sul dispositivo. */
export function ChatScreen({
  conversationId,
  onNavigate,
}: {
  conversationId: string;
  onNavigate: (route: Route) => void;
}) {
  const { conversations, messages, choices, choicesById, state, actions, peopleById, now } = useSided();
  const endRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);

  const conversation = conversations.find((item) => item.id === conversationId);
  const person = conversation ? peopleById.get(conversation.personId) : undefined;

  const thread = useMemo(
    () => messages.filter((message) => message.conversationId === conversationId),
    [messages, conversationId],
  );

  // Aprire la chat azzera il badge dei non letti.
  useEffect(() => {
    actions.markChatSeen(conversationId);
  }, [conversationId, actions]);

  useEffect(() => {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    endRef.current?.scrollIntoView({ block: "end", behavior });
  }, [thread.length]);

  if (!conversation || !person) {
    return (
      <section className="screen screen--center">
        <EmptyState
          title="Conversazione non trovata"
          action={
            <button
              type="button"
              className="button button--primary"
              onClick={() => onNavigate({ name: "activity" })}
            >
              Torna alle chat
            </button>
          }
        />
      </section>
    );
  }

  function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    actions.sendMessage(conversationId, body);
    setDraft("");
  }

  const firstName = person.name.split(" ")[0];

  function attach(choiceId: string) {
    actions.sendMessage(conversationId, "Che ne pensi di questa?", choiceId);
    setAttachOpen(false);
    actions.toast(`Scelta inviata a ${firstName}`, "success");
  }

  return (
    <section className="screen screen--chat">
      <header className="chat-header">
        <Avatar person={person} online={conversation.online} size="md" />
        <span>
          <strong>{person.name}</strong>
          <small>{conversation.online ? "Online ora" : person.handle}</small>
        </span>
        <button
          type="button"
          className="link-button"
          onClick={() => onNavigate({ name: "person", handle: person.handle })}
        >
          Profilo
        </button>
      </header>

      <div className="chat-messages" aria-live="polite">
        {thread.map((message) => {
          const attached = message.choiceId ? choicesById.get(message.choiceId) : undefined;
          return (
            <div className={`chat-message chat-message--${message.from}`} key={message.id}>
              <p>{message.body}</p>
              {attached && (
                <div className="chat-message__attachment">
                  <ChoiceRow
                    choice={attached}
                    myOptionId={state.votes[attached.id]?.optionId}
                    now={now}
                    onOpen={() => onNavigate({ name: "choice", choiceId: attached.id })}
                  />
                </div>
              )}
              <time dateTime={new Date(message.createdAt).toISOString()}>
                {formatClock(message.createdAt)}
              </time>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form className="chat-composer" onSubmit={send}>
        <button
          type="button"
          onClick={() => setAttachOpen(true)}
          aria-label="Allega una scelta"
        >
          <Paperclip aria-hidden="true" />
        </button>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={`Scrivi a ${firstName}`}
          aria-label={`Messaggio per ${person.name}`}
          maxLength={500}
        />
        <button type="submit" className="chat-send" disabled={!draft.trim()} aria-label="Invia messaggio">
          <Send aria-hidden="true" />
        </button>
      </form>

      <Sheet
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        eyebrow="ALLEGA"
        title="Manda una scelta"
        size="lg"
      >
        <div className="stack">
          {choices.slice(0, 12).map((choice) => (
            <ChoiceRow
              key={choice.id}
              choice={choice}
              myOptionId={state.votes[choice.id]?.optionId}
              now={now}
              onOpen={() => attach(choice.id)}
            />
          ))}
        </div>
      </Sheet>
    </section>
  );
}
