import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate, formatRating } from "@chowgo/shared/format";
import { useTagLabel } from "@/hooks/Reviews/useTagLabel";

export function ReviewStars({ rating, className }) {
  const { t } = useTranslation("restaurant");
  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      role="img"
      aria-label={t("restaurant:reviews.stars", { count: rating })}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            "size-3.5",
            star <= rating ? "fill-rating text-rating" : "text-border-strong",
          )}
        />
      ))}
    </span>
  );
}

export function TagChip({ isActive, onClick, children, disabled }) {
  const base = "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-body-sm";
  if (!onClick) {
    return (
      <span className={cn(base, "border-border bg-muted text-muted-foreground")}>{children}</span>
    );
  }
  return (
    <button
      type="button"
      aria-pressed={Boolean(isActive)}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        base,
        "transition-colors duration-(--duration-micro) disabled:opacity-50",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        isActive
          ? "border-primary bg-primary-subtle text-primary-subtle-foreground"
          : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ReviewSummary({ summary }) {
  const { t } = useTranslation("restaurant");
  const tagLabel = useTagLabel();
  if (!summary) return null;

  const count = summary.count ?? 0;
  const distributionTotal =
    Object.values(summary.distribution ?? {}).reduce((sum, n) => sum + (Number(n) || 0), 0) || 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-5">
        <div className="shrink-0 text-center">
          <p className="text-display tabular">{formatRating(summary.average) ?? "-"}</p>
          <ReviewStars rating={Math.round(summary.average ?? 0)} />
          <p className="text-caption text-muted-foreground mt-1">
            {t("restaurant:reviews.basedOn", { count })}
          </p>
        </div>

        <ul className="min-w-0 flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const n = Number(summary.distribution?.[star]) || 0;
            return (
              <li key={star} className="flex items-center gap-2">
                <span className="text-caption text-muted-foreground tabular w-3">{star}</span>
                <span className="sr-only">{t("restaurant:reviews.stars", { count: star })}</span>
                <span className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                  <span
                    className="bg-rating block h-full rounded-full"
                    style={{ width: `${(n / distributionTotal) * 100}%` }}
                  />
                </span>
                <span className="text-caption text-muted-foreground tabular w-8 text-right">{n}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {summary.topTags?.length > 0 && (
        <div className="space-y-2">
          <p className="text-label">{t("restaurant:reviews.peopleMention")}</p>
          <div className="flex flex-wrap gap-2">
            {summary.topTags.map(({ tag, count: tagCount }) => (
              <TagChip key={tag}>
                {tagLabel(tag)}
                <span className="tabular font-semibold">{tagCount}</span>
              </TagChip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function ReviewReply({ reply, restaurantName }) {
  const { t } = useTranslation("restaurant");
  if (!reply) return null;
  return (
    <div className="bg-muted border-primary mt-3 rounded-sm border-l-2 p-3">
      <p className="text-label">
        {t("restaurant:reviews.replyFrom", { restaurant: restaurantName })}
        {reply.editedAt && (
          <span className="text-caption text-muted-foreground ml-2 font-normal">
            ({t("restaurant:reviews.edited")})
          </span>
        )}
      </p>
      <p className="text-body-sm text-muted-foreground mt-1 whitespace-pre-line">{reply.text}</p>
    </div>
  );
}

export function ReviewCard({ review, restaurantName, meta, children }) {
  const { t } = useTranslation("common");
  const tagLabel = useTagLabel();
  return (
    <article className="border-border border-b py-4 last:border-b-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="text-label">{review.author || t("common:fallback.customer")}</span>
        <ReviewStars rating={review.rating} />
        <span className="text-caption text-muted-foreground">{formatDate(review.ratedAt)}</span>
        {meta && <span className="text-caption text-muted-foreground ml-auto">{meta}</span>}
      </div>

      {review.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {review.tags.map((tag) => (
            <TagChip key={tag}>{tagLabel(tag)}</TagChip>
          ))}
        </div>
      )}

      {review.text && (
        <p className="text-body-sm mt-2 whitespace-pre-line">{review.text}</p>
      )}

      {children ?? <ReviewReply reply={review.reply} restaurantName={restaurantName} />}
    </article>
  );
}

export function ReviewFilters({ value, onChange, includeUnanswered = false }) {
  const { t } = useTranslation("restaurant");
  const options = [
    ["all", t("restaurant:reviews.filterAll")],
    ...(includeUnanswered ? [["unanswered", t("restaurant:reviews.unanswered")]] : []),
    ["withText", t("restaurant:reviews.withText")],
    ...[5, 4, 3, 2, 1].map((star) => [String(star), t("restaurant:reviews.stars", { count: star })]),
  ];
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={t("restaurant:reviews.title")}>
      {options.map(([id, label]) => (
        <TagChip key={id} isActive={value === id} onClick={() => onChange(id)}>
          {label}
        </TagChip>
      ))}
    </div>
  );
}
