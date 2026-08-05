"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, Minus, Music2, Plus, Trash2, X } from "lucide-react";
import { createId } from "@/lib/ids";
import { sideLabel } from "@/lib/format";
import { CATEGORIES } from "@/lib/types";
import type { CategoryName, Choice, ChoiceFormat, Media } from "@/lib/types";
import type { Route } from "@/lib/router";
import { useSided } from "@/state/context";
import { useReveal } from "@/hooks/ui";
import { Chip, revealDelay } from "@/components/ui/Controls";
import { MediaView } from "@/components/ui/MediaView";

/**
 * Composizione di una nuova scelta.
 *
 * Rispetto al prototipo le opzioni sono una lista sola invece di
 * `createA` + `createB` + `extras`: aggiungere un formato non richiede più di
 * tenere allineati tre stati diversi.
 */

const MAX_FILE_MB = 12;

type Draft = { id: string; label: string; media?: Media };

const formats: Array<{
  value: ChoiceFormat;
  title: string;
  detail: string;
  min: number;
  max: number;
  step: number;
}> = [
  { value: "classic", title: "2 sides", detail: "La scelta classica", min: 2, max: 2, step: 1 },
  { value: "multi", title: "Multi", detail: "Da 3 a 8 alternative", min: 3, max: 8, step: 1 },
  { value: "chain", title: "Chained", detail: "Scelte consecutive a coppie", min: 4, max: 8, step: 2 },
  { value: "contest", title: "Contest", detail: "Torneo a eliminazione", min: 4, max: 8, step: 2 },
];

function emptyOption(): Draft {
  return { id: createId("draft"), label: "" };
}

function fileToMedia(file: File): Media {
  return {
    url: URL.createObjectURL(file),
    kind: file.type.startsWith("video/") ? "video" : "image",
    name: file.name,
    ephemeral: true,
  };
}

export function CreateScreen({ onNavigate }: { onNavigate: (route: Route) => void }) {
  const { actions } = useSided();
  const viewRef = useRef<HTMLElement>(null);
  const backgroundInput = useRef<HTMLInputElement>(null);
  const audioInput = useRef<HTMLInputElement>(null);
  const optionInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const [format, setFormat] = useState<ChoiceFormat>("classic");
  const [category, setCategory] = useState<CategoryName>("Lifestyle");
  const [options, setOptions] = useState<Draft[]>([emptyOption(), emptyOption()]);
  const [background, setBackground] = useState<Media>();
  const [audio, setAudio] = useState<{ url: string; name: string }>();
  const [published, setPublished] = useState(false);

  const spec = formats.find((item) => item.value === format) ?? formats[0];
  const canAdd = options.length + spec.step <= spec.max;
  const canRemove = options.length - spec.step >= spec.min;
  const isValid = options.every((option) => option.label.trim().length > 0);

  useReveal(viewRef, [format, options.length]);

  function selectFormat(next: ChoiceFormat) {
    const nextSpec = formats.find((item) => item.value === next) ?? formats[0];
    setFormat(next);
    setOptions((current) => {
      const list = [...current];
      while (list.length < nextSpec.min) list.push(emptyOption());
      // I formati a coppie non tollerano un numero dispari di opzioni.
      const target = Math.min(
        Math.max(list.length, nextSpec.min),
        nextSpec.max,
      );
      const aligned = nextSpec.step === 2 && target % 2 !== 0 ? target + 1 : target;
      while (list.length < aligned) list.push(emptyOption());
      return list.slice(0, Math.min(aligned, nextSpec.max));
    });
  }

  function updateOption(id: string, label: string) {
    setOptions((current) => current.map((option) => (option.id === id ? { ...option, label } : option)));
  }

  function attachMedia(id: string, file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      actions.toast(`Il file supera ${MAX_FILE_MB} MB`);
      return;
    }
    setOptions((current) =>
      current.map((option) => {
        if (option.id !== id) return option;
        if (option.media) URL.revokeObjectURL(option.media.url);
        return { ...option, media: fileToMedia(file) };
      }),
    );
  }

  function detachMedia(id: string) {
    setOptions((current) =>
      current.map((option) => {
        if (option.id !== id) return option;
        if (option.media) URL.revokeObjectURL(option.media.url);
        return { ...option, media: undefined };
      }),
    );
  }

  function publish(event: React.FormEvent) {
    event.preventDefault();
    if (!isValid) return;

    const choice: Choice = {
      id: createId("ch"),
      format,
      authorId: "me",
      category,
      createdAt: Date.now(),
      background,
      audio: audio ? { url: audio.url, name: audio.name, ephemeral: true } : undefined,
      options: options.map((option) => ({
        id: createId("op"),
        label: option.label.trim(),
        media: option.media,
        votes: 0,
      })),
    };

    actions.publishChoice(choice);
    setPublished(true);
    actions.toast("Scelta pubblicata", "success");

    window.setTimeout(() => {
      setPublished(false);
      setOptions([emptyOption(), emptyOption()]);
      setFormat("classic");
      setBackground(undefined);
      setAudio(undefined);
      onNavigate({ name: "choice", choiceId: choice.id });
    }, 700);
  }

  const stepsLabel = useMemo(() => {
    if (format === "chain") return `${options.length / 2} scelte nella sequenza`;
    if (format === "contest") return `${options.length} partecipanti al torneo`;
    return `${options.length} opzioni`;
  }, [format, options.length]);

  return (
    <section className="screen screen--page create" ref={viewRef}>
      <div className="page-title" data-reveal>
        <p className="eyebrow">NUOVA SCELTA</p>
        <h2>
          Scrivi due lati
          <br />
          che si scontrano.
        </h2>
        <p>Più è immediata, più persone avranno qualcosa da dire.</p>
      </div>

      <form onSubmit={publish}>
        <fieldset className="format-picker" data-reveal style={revealDelay(1)}>
          <legend>Formato</legend>
          <div>
            {formats.map((item) => (
              <button
                key={item.value}
                type="button"
                className={format === item.value ? "is-active" : ""}
                onClick={() => selectFormat(item.value)}
                aria-pressed={format === item.value}
              >
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
        </fieldset>

        {spec.max > spec.min && (
          <div className="option-counter" data-reveal style={revealDelay(2)}>
            <div>
              <strong>{stepsLabel}</strong>
              <span>
                {format === "chain"
                  ? "Ogni step è uno scontro fra due opzioni"
                  : format === "contest"
                    ? "Il numero resta pari: ogni + aggiunge due sfidanti"
                    : `Da ${spec.min} a ${spec.max} alternative`}
              </span>
            </div>
            <div className="option-counter__actions">
              <button
                type="button"
                onClick={() => setOptions((current) => current.slice(0, current.length - spec.step))}
                disabled={!canRemove}
                aria-label="Rimuovi opzioni"
              >
                <Minus aria-hidden="true" />
              </button>
              <button
                type="button"
                className="is-add"
                onClick={() =>
                  setOptions((current) => [
                    ...current,
                    ...Array.from({ length: spec.step }, emptyOption),
                  ])
                }
                disabled={!canAdd}
                aria-label="Aggiungi opzioni"
              >
                <Plus aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        <div className="option-editor">
          {options.map((option, index) => (
            <div className="option-field" key={option.id} data-reveal style={revealDelay(index, 30)}>
              <div className="option-field__head">
                <span className={`option-field__badge option-field__badge--${index % 6}`}>
                  {sideLabel(index)}
                </span>
                <label htmlFor={`option-${option.id}`}>
                  {format === "chain"
                    ? `Step ${Math.floor(index / 2) + 1} · opzione ${index % 2 === 0 ? "A" : "B"}`
                    : format === "contest"
                      ? `Partecipante ${index + 1}`
                      : `Lato ${sideLabel(index)}`}
                </label>
                <small>{option.label.length}/40</small>
              </div>

              <textarea
                id={`option-${option.id}`}
                value={option.label}
                onChange={(event) => updateOption(option.id, event.target.value)}
                maxLength={40}
                rows={2}
                placeholder={index === 0 ? "Es. Esci stasera" : index === 1 ? "Es. Resta a casa" : `Opzione ${index + 1}`}
              />

              <input
                ref={(node) => {
                  optionInputs.current[option.id] = node;
                }}
                type="file"
                accept="image/*,video/*"
                className="sr-only"
                onChange={(event) => {
                  attachMedia(option.id, event.target.files?.[0]);
                  event.target.value = "";
                }}
              />

              {option.media ? (
                <div className="option-field__media">
                  <MediaView media={option.media} alt={`Anteprima di ${option.label || "opzione"}`} />
                  <span>{option.media.name}</span>
                  <button
                    type="button"
                    onClick={() => detachMedia(option.id)}
                    aria-label="Rimuovi il contenuto"
                  >
                    <X aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="option-field__add-media"
                  onClick={() => optionInputs.current[option.id]?.click()}
                >
                  <ImagePlus aria-hidden="true" />
                  Aggiungi foto o video
                </button>
              )}
            </div>
          ))}
        </div>

        <fieldset className="category-picker" data-reveal>
          <legend>Categoria</legend>
          <div className="category-chips">
            {CATEGORIES.map((name) => (
              <Chip key={name} active={category === name} onClick={() => setCategory(name)}>
                {name}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="extras" data-reveal>
          <section className="extras__card">
            <div>
              <strong>Background condiviso</strong>
              <span>Una sola immagine dietro tutte le opzioni</span>
            </div>
            <input
              ref={backgroundInput}
              type="file"
              accept="image/*,video/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && file.size <= MAX_FILE_MB * 1024 * 1024) {
                  if (background) URL.revokeObjectURL(background.url);
                  setBackground(fileToMedia(file));
                } else if (file) {
                  actions.toast(`Il file supera ${MAX_FILE_MB} MB`);
                }
                event.target.value = "";
              }}
            />
            {background ? (
              <div className="extras__preview">
                <MediaView media={background} alt="Anteprima del background" />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(background.url);
                    setBackground(undefined);
                  }}
                  aria-label="Rimuovi il background"
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button type="button" className="button button--ghost" onClick={() => backgroundInput.current?.click()}>
                <ImagePlus aria-hidden="true" />
                Scegli
              </button>
            )}
          </section>

          <section className="extras__card">
            <div>
              <strong>Audio</strong>
              <span>Una traccia che accompagna la scelta</span>
            </div>
            <input
              ref={audioInput}
              type="file"
              accept="audio/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file && file.size <= MAX_FILE_MB * 1024 * 1024) {
                  if (audio) URL.revokeObjectURL(audio.url);
                  setAudio({ url: URL.createObjectURL(file), name: file.name });
                } else if (file) {
                  actions.toast(`Il file supera ${MAX_FILE_MB} MB`);
                }
                event.target.value = "";
              }}
            />
            {audio ? (
              <div className="extras__preview extras__preview--audio">
                <audio src={audio.url} controls preload="metadata" />
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(audio.url);
                    setAudio(undefined);
                  }}
                  aria-label="Rimuovi l'audio"
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button type="button" className="button button--ghost" onClick={() => audioInput.current?.click()}>
                <Music2 aria-hidden="true" />
                Scegli
              </button>
            )}
          </section>
        </div>

        <div className="create-preview" data-reveal>
          <span className="create-preview__label">ANTEPRIMA</span>
          <div className={`create-preview__card ${background ? "has-backdrop" : ""}`} data-count={options.length}>
            {background && (
              <span className="create-preview__backdrop" aria-hidden="true">
                <MediaView media={background} />
              </span>
            )}
            {options.map((option, index) => (
              <span key={option.id} className={`create-preview__side create-preview__side--${index % 6}`}>
                {option.media && (
                  <i className="create-preview__media" aria-hidden="true">
                    <MediaView media={option.media} />
                  </i>
                )}
                <small>{sideLabel(index)}</small>
                <strong>{option.label || `Opzione ${index + 1}`}</strong>
              </span>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className={`button button--primary button--block ${published ? "is-success" : ""}`}
          disabled={!isValid || published}
        >
          {published ? "Pubblicata ✓" : "Pubblica scelta"}
        </button>
        {!isValid && <p className="form-hint">Compila tutte le opzioni per pubblicare.</p>}
      </form>
    </section>
  );
}
