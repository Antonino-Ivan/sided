"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";

/**
 * Gesture verticale del feed: trascinamento con resistenza ai bordi, lancio
 * con inerzia, rotella del mouse e transizioni di uscita/entrata.
 *
 * Era il pezzo più delicato del vecchio `page.tsx` — otto `useRef` e cinque
 * handler mescolati al resto della UI. Qui è isolato e riusabile.
 */

export type DeckMotion =
  | "idle"
  | "leaving-up"
  | "leaving-down"
  | "entering-from-bottom"
  | "entering-from-top";

export type Direction = "next" | "previous";

type Options = {
  /** Chiamata a metà transizione, quando va mostrato il contenuto successivo. */
  onChange: (direction: Direction) => void;
  enabled?: boolean;
};

/** Soglia oltre cui il trascinamento smette di seguire il dito 1:1. */
const DIRECT_LIMIT = 96;
const DISTANCE_THRESHOLD = 64;
const VELOCITY_THRESHOLD = 0.11;
const ENTER_DURATION = 280;

function rubberBand(value: number): number {
  const absolute = Math.abs(value);
  if (absolute <= DIRECT_LIMIT) return value;
  const overshoot = absolute - DIRECT_LIMIT;
  const resisted = (overshoot * 220 * 0.55) / (220 + 0.55 * overshoot);
  return Math.sign(value) * (DIRECT_LIMIT + resisted);
}

export function useSwipeDeck({ onChange, enabled = true }: Options) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState<DeckMotion>("idle");
  const [isDragging, setIsDragging] = useState(false);

  const start = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);
  const captured = useRef(false);
  const locked = useRef(false);
  const history = useRef<Array<{ y: number; time: number }>>([]);
  const exitTimer = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);

  const clearCard = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.removeProperty("transform");
    card.style.removeProperty("opacity");
  }, []);

  const dragTo = useCallback((value: number) => {
    const card = cardRef.current;
    if (!card) return;
    const progress = Math.min(Math.abs(value) / 220, 1);
    card.style.transform = `translate3d(0, ${value}px, 0) scale(${1 - progress * 0.018})`;
    card.style.opacity = `${1 - progress * 0.2}`;
  }, []);

  useEffect(
    () => () => {
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    },
    [],
  );

  /** Se l'utente tocca durante l'animazione d'ingresso, la interrompe subito. */
  const interruptEntry = useCallback(() => {
    if (!locked.current || !motion.startsWith("entering")) return;
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    settleTimer.current = null;
    locked.current = false;
    setMotion("idle");
    clearCard();
  }, [motion, clearCard]);

  const go = useCallback(
    (direction: Direction, velocity = 0) => {
      if (locked.current || !enabled) return;
      if (exitTimer.current !== null) window.clearTimeout(exitTimer.current);
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);

      locked.current = true;
      setIsDragging(false);

      // Un lancio veloce esce più in fretta: la card "segue" il gesto.
      const exitDuration = Math.max(190, Math.min(240, 240 - Math.abs(velocity) * 90));
      cardRef.current?.style.setProperty("--deck-duration", `${exitDuration}ms`);
      setMotion(direction === "next" ? "leaving-up" : "leaving-down");
      window.requestAnimationFrame(clearCard);

      exitTimer.current = window.setTimeout(() => {
        onChange(direction);
        setMotion(direction === "next" ? "entering-from-bottom" : "entering-from-top");
        settleTimer.current = window.setTimeout(() => {
          setMotion("idle");
          locked.current = false;
          settleTimer.current = null;
        }, ENTER_DURATION);
        exitTimer.current = null;
      }, exitDuration);
    },
    [enabled, clearCard, onChange],
  );

  const reset = useCallback(() => {
    start.current = null;
    captured.current = false;
    history.current = [];
    setIsDragging(false);
    clearCard();
  }, [clearCard]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      interruptEntry();
      if (locked.current || !enabled) return;
      moved.current = false;
      captured.current = false;
      start.current = { x: event.clientX, y: event.clientY };
      history.current = [{ y: event.clientY, time: performance.now() }];
      setIsDragging(true);
    },
    [enabled, interruptEntry],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const origin = start.current;
      if (!origin || locked.current) return;
      const deltaX = event.clientX - origin.x;
      const deltaY = event.clientY - origin.y;
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) moved.current = true;
      if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

      if (!captured.current && Math.abs(deltaY) > 10) {
        event.currentTarget.setPointerCapture(event.pointerId);
        captured.current = true;
      }
      dragTo(rubberBand(deltaY));

      const now = performance.now();
      history.current = [
        ...history.current.filter((point) => now - point.time < 120),
        { y: event.clientY, time: now },
      ].slice(-6);
    },
    [dragTo],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const origin = start.current;
      if (!origin) return;

      const deltaX = event.clientX - origin.x;
      const deltaY = event.clientY - origin.y;
      const points = history.current;
      const first = points[0];
      const last = points[points.length - 1];
      const velocity =
        first && last && last.time > first.time
          ? (last.y - first.y) / (last.time - first.time)
          : 0;
      // Proiezione: dove finirebbe la card se continuasse con questa velocità.
      const projected = deltaY + velocity * 240;

      start.current = null;
      history.current = [];
      setIsDragging(false);

      if (captured.current && event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      captured.current = false;

      const passedThreshold =
        Math.abs(deltaY) > DISTANCE_THRESHOLD || Math.abs(velocity) > VELOCITY_THRESHOLD;

      if (Math.abs(deltaY) > Math.abs(deltaX) && passedThreshold) {
        go(projected < 0 ? "next" : "previous", velocity);
        return;
      }
      clearCard();
    },
    [go, clearCard],
  );

  const onWheel = useCallback(
    (event: ReactWheelEvent<HTMLDivElement>) => {
      if (Math.abs(event.deltaY) <= 28) return;
      interruptEntry();
      go(event.deltaY > 0 ? "next" : "previous");
    },
    [go, interruptEntry],
  );

  /**
   * Il click che chiude un trascinamento non deve contare come voto.
   * Consumato una sola volta, così un tap pulito passa sempre.
   */
  const consumeDrag = useCallback(() => {
    if (!moved.current) return false;
    moved.current = false;
    return true;
  }, []);

  return {
    cardRef,
    motion,
    isDragging,
    go,
    consumeDrag,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
    },
    onWheel,
  };
}
