"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowUp, MessageCircle, Share2, Trash2 } from "lucide-react";
import {
  choicePercentages,
  formatCount,
  formatVotes,
  optionIndex,
  sideLabel,
  timeAgo,
  totalVotes,
} from "@/lib/format";
import type { Choice, Comment, ID, Person } from "@/lib/types";
import type { Route } from "@/lib/router";
import { useSided } from "@/state/context";
import { commentsFor, threadComments } from "@/state/selectors";
import type { CommentNode } from "@/state/selectors";
import { copyToClipboard, useReveal } from "@/hooks/ui";
import { Avatar } from "@/components/ui/Avatar";
import { Chip, EmptyState, Segmented, revealDelay } from "@/components/ui/Controls";

/**
 * La discussione di una singola scelta: risultati in testa, thread sotto.
 * A differenza del prototipo i commenti sono legati all'opzione votata (non
 * più solo "lato A / lato B"), quindi funzionano anche con otto opzioni.
 */
export function DiscussionScreen({
  choice,
  onNavigate,
}: {
  choice: Choice;
  onNavigate: (route: Route) => void;
}) {
  const { comments, state, actions, peopleById, me, now } = useSided();
  const viewRef = useRef<HTMLElement>(null);

  const [sort, setSort] = useState<"hot" | "recenti">("hot");
  const [optionFilter, setOptionFilter] = useState<ID | null>(null);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ID | null>(null);
  const [replyDraft, setReplyDraft] = useState("");

  const myVote = state.votes[choice.id]?.optionId ?? null;
  const percentages = choicePercentages(choice, myVote);
  const myIndex = optionIndex(choice, myVote);

  const all = useMemo(() => commentsFor(comments, choice.id), [comments, choice.id]);
  const thread = useMemo(
    () =>
      threadComments(all, {
        sort,
        optionFilter,
        myUpvotes: state.commentUpvotes,
      }),
    [all, sort, optionFilter, state.commentUpvotes],
  );

  useReveal(viewRef, [choice.id, sort, optionFilter, thread.length]);

  function submitComment(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || !myVote) return;
    actions.addComment({ choiceId: choice.id, parentId: null, optionId: myVote, body });
    setDraft("");
    setSort("recenti");
  }

  function submitReply(parentId: ID) {
    const body = replyDraft.trim();
    if (!body) return;
    actions.addComment({ choiceId: choice.id, parentId, optionId: myVote, body });
    setReplyDraft("");
    setReplyTo(null);
  }

  async function share() {
    const url = `${window.location.origin}${window.location.pathname}#/scelta/${choice.id}`;
    const ok = await copyToClipboard(url);
    actions.toast(ok ? "Link copiato negli appunti" : "Copia non riuscita", ok ? "success" : "default");
  }

  return (
    <section className="screen screen--page discussion" ref={viewRef}>
      <header className="discussion__head" data-reveal>
        <p className="eyebrow">{choice.category}</p>
        <h2>
          {choice.options.map((option, index) => (
            <span key={option.id}>
              {index > 0 && <i>vs</i>}
              {option.label}
            </span>
          ))}
        </h2>
        <p className="discussion__meta">
          {formatVotes(totalVotes(choice, myVote))} · {timeAgo(choice.createdAt, now)}
        </p>
      </header>

      <div className="result-bars" data-reveal style={revealDelay(1)}>
        {choice.options.map((option, index) => (
          <div
            key={option.id}
            className={`result-bar ${option.id === myVote ? "is-mine" : ""}`}
          >
            <div className="result-bar__label">
              <span>
                <b>{sideLabel(index)}</b>
                {option.label}
              </span>
              <strong>{percentages[index]}%</strong>
            </div>
            <div className="result-bar__track">
              <span style={{ width: `${percentages[index]}%` }} />
            </div>
          </div>
        ))}
      </div>

      {myVote ? (
        <p className="discussion__yours" data-reveal style={revealDelay(2)}>
          Hai scelto <strong>{choice.options[myIndex]?.label}</strong> · sei con il{" "}
          <strong>{percentages[myIndex]}%</strong>
          <button type="button" onClick={() => actions.clearVote(choice.id)}>
            Cambia
          </button>
        </p>
      ) : (
        <div className="discussion__vote-first" data-reveal style={revealDelay(2)}>
          <p>Vota per poter commentare questa scelta.</p>
          <div>
            {choice.options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="button button--ghost"
                onClick={() => actions.vote(choice.id, option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="discussion__toolbar" data-reveal style={revealDelay(3)}>
        <Segmented
          size="sm"
          label="Ordina i commenti"
          value={sort}
          onChange={setSort}
          options={[
            { value: "hot", label: "Hot" },
            { value: "recenti", label: "Recenti" },
          ]}
        />
        <div className="discussion__filters">
          <Chip active={optionFilter === null} onClick={() => setOptionFilter(null)}>
            Tutti
          </Chip>
          {choice.options.map((option, index) => (
            <Chip
              key={option.id}
              active={optionFilter === option.id}
              onClick={() => setOptionFilter(optionFilter === option.id ? null : option.id)}
              ariaLabel={`Solo commenti di chi ha scelto ${option.label}`}
            >
              {sideLabel(index)}
            </Chip>
          ))}
        </div>
        <span className="discussion__count">{formatCount(all.length)}</span>
      </div>

      <div className="comment-list">
        {thread.length === 0 ? (
          <EmptyState
            icon={<MessageCircle aria-hidden="true" />}
            title={optionFilter ? "Nessun commento da questo lato" : "Ancora nessun commento"}
            detail={
              optionFilter
                ? "Prova a togliere il filtro o apri tu la discussione."
                : "Apri tu la discussione: la prima opinione pesa sempre di più."
            }
          />
        ) : (
          thread.map((node, index) => (
            <CommentItem
              key={node.id}
              node={node}
              choice={choice}
              index={index}
              upvoted={state.commentUpvotes.includes(node.id)}
              upvotedIds={state.commentUpvotes}
              onUpvote={actions.toggleCommentUpvote}
              onDelete={actions.removeComment}
              isReplying={replyTo === node.id}
              replyDraft={replyDraft}
              onReplyDraft={setReplyDraft}
              onToggleReply={() => {
                setReplyTo(replyTo === node.id ? null : node.id);
                setReplyDraft("");
              }}
              onSubmitReply={() => submitReply(node.id)}
              canReply={Boolean(myVote)}
              resolveAuthor={(id) => (id === "me" ? me : peopleById.get(id))}
              now={now}
            />
          ))
        )}
      </div>

      <div className="discussion__actions" data-reveal>
        <button type="button" className="button button--ghost" onClick={share}>
          <Share2 aria-hidden="true" />
          Condividi la scelta
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={() => onNavigate({ name: "home" })}
        >
          Torna al feed
        </button>
      </div>

      <form className="composer" onSubmit={submitComment}>
        <Avatar person={me} size="sm" />
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={500}
          placeholder={myVote ? "Aggiungi la tua opinione" : "Vota per commentare"}
          aria-label="Aggiungi la tua opinione"
          disabled={!myVote}
        />
        <button type="submit" disabled={!draft.trim() || !myVote} aria-label="Pubblica commento">
          <ArrowUp aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

function CommentItem({
  node,
  choice,
  index,
  upvoted,
  upvotedIds,
  onUpvote,
  onDelete,
  isReplying,
  replyDraft,
  onReplyDraft,
  onToggleReply,
  onSubmitReply,
  canReply,
  resolveAuthor,
  now,
}: {
  node: CommentNode;
  choice: Choice;
  index: number;
  upvoted: boolean;
  upvotedIds: ID[];
  onUpvote: (id: ID) => void;
  onDelete: (id: ID) => void;
  isReplying: boolean;
  replyDraft: string;
  onReplyDraft: (value: string) => void;
  onToggleReply: () => void;
  onSubmitReply: () => void;
  canReply: boolean;
  resolveAuthor: (id: ID) => Person | undefined;
  now: number;
}) {
  return (
    <article className="comment" data-reveal style={revealDelay(index, 30)}>
      <CommentBody
        comment={node}
        choice={choice}
        upvoted={upvoted}
        onUpvote={onUpvote}
        onDelete={onDelete}
        onReply={onToggleReply}
        replyCount={node.replies.length}
        resolveAuthor={resolveAuthor}
        now={now}
      />

      {isReplying && (
        <form
          className="comment__reply-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmitReply();
          }}
        >
          <input
            value={replyDraft}
            onChange={(event) => onReplyDraft(event.target.value)}
            placeholder={canReply ? "Scrivi una risposta" : "Vota per rispondere"}
            aria-label="Scrivi una risposta"
            maxLength={400}
            disabled={!canReply}
            autoFocus
          />
          <button type="submit" disabled={!replyDraft.trim() || !canReply}>
            Rispondi
          </button>
        </form>
      )}

      {node.replies.length > 0 && (
        <div className="comment__replies">
          {node.replies.map((reply) => (
            <CommentBody
              key={reply.id}
              comment={reply}
              choice={choice}
              compact
              upvoted={upvotedIds.includes(reply.id)}
              onUpvote={onUpvote}
              onDelete={onDelete}
              resolveAuthor={resolveAuthor}
              now={now}
            />
          ))}
        </div>
      )}
    </article>
  );
}

function CommentBody({
  comment,
  choice,
  compact,
  upvoted,
  onUpvote,
  onDelete,
  onReply,
  replyCount,
  resolveAuthor,
  now,
}: {
  comment: Comment;
  choice: Choice;
  compact?: boolean;
  upvoted: boolean;
  onUpvote: (id: ID) => void;
  onDelete: (id: ID) => void;
  onReply?: () => void;
  replyCount?: number;
  resolveAuthor: (id: ID) => Person | undefined;
  now: number;
}) {
  const author = resolveAuthor(comment.authorId);
  const index = optionIndex(choice, comment.optionId);
  const isMine = comment.authorId === "me";
  const score = comment.upvotes + (upvoted ? 1 : 0);

  return (
    <div className={`comment__body ${compact ? "is-reply" : ""}`}>
      <Avatar person={author ?? undefined} name={author?.name ?? "Utente"} size={compact ? "xs" : "sm"} />
      <div>
        <p className="comment__meta">
          <strong>{author?.handle ?? "@utente"}</strong>
          {index >= 0 && <span className={`side-badge side-badge--${index}`}>{sideLabel(index)}</span>}
          <time dateTime={new Date(comment.createdAt).toISOString()}>
            {timeAgo(comment.createdAt, now)}
          </time>
        </p>
        <p className="comment__text">{comment.body}</p>
        <p className="comment__actions">
          <button
            type="button"
            className={upvoted ? "is-active" : ""}
            onClick={() => onUpvote(comment.id)}
            aria-pressed={upvoted}
            aria-label={`${upvoted ? "Togli" : "Dai"} un voto positivo al commento`}
          >
            <ArrowUp aria-hidden="true" />
            {formatCount(score)}
          </button>
          {onReply && (
            <button type="button" onClick={onReply}>
              {replyCount ? `${replyCount} ${replyCount === 1 ? "risposta" : "risposte"}` : "Rispondi"}
            </button>
          )}
          {isMine && (
            <button
              type="button"
              className="is-danger"
              onClick={() => onDelete(comment.id)}
              aria-label="Elimina il tuo commento"
            >
              <Trash2 aria-hidden="true" />
            </button>
          )}
        </p>
      </div>
    </div>
  );
}
