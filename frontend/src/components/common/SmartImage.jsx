/**
 * Image with a real loading and failure story.
 *
 * Menu photos come from Cloudinary URLs stored directly on the document. They
 * go missing (deleted assets, seed data pointing at expired stock URLs), so
 * every food image in the product goes through this component: fixed aspect
 * ratio to prevent layout shift, a muted placeholder while it decodes, and a
 * neutral icon fallback rather than a broken-image glyph.
 */

import { useState } from "react";
import { ImageOff } from "lucide-react";

import { cloudinarySrcSet, cloudinaryUrl } from "@chowgo/shared/image";

import { cn } from "@/lib/utils";

const RATIOS = {
  /** Restaurant cards and menu section heroes. */
  card: "aspect-[16/10]",
  /** Dish thumbnails in a list row. */
  square: "aspect-square",
  /** Restaurant page hero. */
  hero: "aspect-[16/9] sm:aspect-[21/9]",
  /** Caller controls height. */
  none: "",
};

// The widest each ratio is rendered at, in CSS pixels. A 2x variant is
// offered alongside, so these only need to be right to within a card or so.
const RENDER_WIDTHS = { card: 480, square: 240, hero: 1600, none: 800 };

/**
 * @param {Object} props
 * @param {string | null | undefined} props.src
 * @param {string} props.alt Empty string when the image is purely decorative
 *   and an adjacent element already names the thing.
 * @param {keyof typeof RATIOS} [props.ratio]
 * @param {import("lucide-react").LucideIcon} [props.fallbackIcon]
 * @param {"lazy"|"eager"} [props.loading]
 * @param {number} [props.width] Rendered width in CSS pixels, when the ratio's
 *   default is far off; picks the Cloudinary size to request.
 */
export function SmartImage({
  src,
  alt,
  ratio = "card",
  fallbackIcon: FallbackIcon = ImageOff,
  loading = "lazy",
  width,
  className,
  imgClassName,
  children,
}) {
  // Keyed by `src` rather than reset in an effect: a card recycled onto a
  // different item as a list re-renders must not briefly show the previous
  // image's loaded state, and an effect would let that frame through.
  const [loadState, setLoadState] = useState({ src, status: "loading" });
  const status = !src ? "error" : loadState.src === src ? loadState.status : "loading";
  const renderWidth = width ?? RENDER_WIDTHS[ratio] ?? 800;

  return (
    <div
      className={cn(
        "bg-muted relative overflow-hidden",
        RATIOS[ratio],
        className,
      )}
    >
      {src && status !== "error" && (
        <img
          src={cloudinaryUrl(src, { width: renderWidth })}
          srcSet={cloudinarySrcSet(src, renderWidth)}
          sizes={`${renderWidth}px`}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setLoadState({ src, status: "loaded" })}
          onError={() => setLoadState({ src, status: "error" })}
          className={cn(
            "size-full object-cover",
            "transition-opacity duration-(--duration-standard) ease-(--ease-standard)",
            status === "loaded" ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      )}

      {status === "loading" && (
        <div className="bg-muted absolute inset-0 animate-pulse" aria-hidden="true" />
      )}

      {status === "error" && (
        <div
          className="text-muted-foreground/50 absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <FallbackIcon className="size-1/4 max-h-10 min-h-5 max-w-10 min-w-5" />
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * A circular logo or profile picture. Falls back to the initial letter, which
 * reads better at small sizes than a generic icon.
 *
 * @param {Object} props
 * @param {string | null | undefined} props.src
 * @param {string} props.name Used for the alt text and the initial.
 * @param {"sm"|"md"|"lg"} [props.size]
 */
export function Avatar({ src, name, size = "md", className }) {
  // Same reasoning as SmartImage: the failure is remembered against the URL
  // that failed, so a new `src` starts clean without an effect.
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = Boolean(src) && failedSrc === src;
  const initial = (name || "?").trim().charAt(0).toUpperCase();

  const sizes = { sm: "size-8 text-caption", md: "size-10 text-label", lg: "size-14 text-h3" };

  return (
    <span
      className={cn(
        "bg-secondary text-secondary-foreground relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
        sizes[size],
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={cloudinaryUrl(src, { width: 112, height: 112, crop: "fill" })}
          alt={name || ""}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(src)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
