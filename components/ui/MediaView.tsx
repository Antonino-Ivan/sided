"use client";

import type { Media } from "@/lib/types";

/**
 * Immagine o video di una scelta.
 *
 * Usiamo `<img>` e non `next/image`: le sorgenti sono URL `blob:` creati dal
 * browser dopo un upload locale, che l'ottimizzatore non può né leggere né
 * mettere in cache.
 */
export function MediaView({
  media,
  className,
  alt = "",
  controls = false,
}: {
  media: Media;
  className?: string;
  alt?: string;
  controls?: boolean;
}) {
  if (media.kind === "video") {
    return (
      <video
        className={className}
        src={media.url}
        muted
        loop
        playsInline
        autoPlay={!controls}
        controls={controls}
        aria-label={alt || media.name}
      />
    );
  }
  return <img className={className} src={media.url} alt={alt} loading="lazy" decoding="async" />;
}

/** Sfondo multimediale con velo scuro sopra, per tenere leggibile il testo. */
export function MediaBackdrop({ media, className }: { media: Media; className?: string }) {
  return (
    <span className={`media-backdrop ${className ?? ""}`} aria-hidden="true">
      <MediaView media={media} />
      <i className="media-backdrop__veil" />
    </span>
  );
}
