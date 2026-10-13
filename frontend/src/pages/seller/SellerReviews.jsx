import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquareText, Pencil, Trash2 } from "lucide-react";

import { REVIEW_LIMITS } from "@chowgo/shared/reviews";
import { useAuthStore } from "@/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/common/StateViews";
import {
  ReviewCard,
  ReviewFilters,
  ReviewReply,
  ReviewSummary,
} from "@/components/reviews/ReviewParts";
import {
  useDeleteReviewReply,
  useSaveReviewReply,
  useSellerReviews,
} from "@/hooks/Reviews/useReviews";

function ReplyEditor({ review, onDone }) {
  const { t } = useTranslation(["restaurant", "common"]);
  const [text, setText] = useState(review.reply?.text ?? "");
  const save = useSaveReviewReply();
  const trimmed = text.trim();
  const fieldId = `reply-${review.id}`;

  const submit = (event) => {
    event.preventDefault();
    if (!trimmed) return;
    save.mutate({ orderId: review.id, text: trimmed }, { onSuccess: onDone });
  };

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <Label htmlFor={fieldId} className="sr-only">
        {t("restaurant:reviews.reply")}
      </Label>
      <Textarea
        id={fieldId}
        rows={3}
        maxLength={REVIEW_LIMITS.replyLength}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={t("restaurant:reviews.replyPlaceholder")}
        autoFocus
      />
      <div className="text-caption text-muted-foreground flex items-center justify-between gap-3">
        <span>{t("restaurant:reviews.replyHint")}</span>
        <span className="tabular shrink-0">
          {text.length}/{REVIEW_LIMITS.replyLength}
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t("common:actions.cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={!trimmed} isLoading={save.isPending}>
          {t("common:actions.save")}
        </Button>
      </div>
    </form>
  );
}

function SellerReviewItem({ review, restaurantName }) {
  const { t } = useTranslation(["restaurant", "common"]);
  const [isEditing, setIsEditing] = useState(false);
  const remove = useDeleteReviewReply();
  const orderLabel = review.orderNumber ? `#${String(review.orderNumber).split("-").pop()}` : null;

  return (
    <ReviewCard review={review} restaurantName={restaurantName} meta={orderLabel}>
      {isEditing ? (
        <ReplyEditor review={review} onDone={() => setIsEditing(false)} />
      ) : review.reply ? (
        <>
          <ReviewReply reply={review.reply} restaurantName={restaurantName} />
          <div className="mt-2 flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil aria-hidden="true" />
              {t("restaurant:reviews.editReply")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              isLoading={remove.isPending}
              onClick={() => remove.mutate(review.id)}
            >
              <Trash2 aria-hidden="true" />
              {t("restaurant:reviews.deleteReply")}
            </Button>
          </div>
        </>
      ) : (
        <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsEditing(true)}>
          <MessageSquareText aria-hidden="true" />
          {t("restaurant:reviews.reply")}
        </Button>
      )}
    </ReviewCard>
  );
}

export function SellerReviews() {
  const { t } = useTranslation(["restaurant", "common"]);
  const restaurantName = useAuthStore((state) => state.authUser?.restaurant?.[0]?.name) ?? "";
  const [filter, setFilter] = useState("all");
  const list = useSellerReviews(filter);
  const { summary } = useSellerReviews("all");

  return (
    <div className="space-y-6">
      <Card padded>
        {summary ? (
          <ReviewSummary summary={summary} />
        ) : (
          <Skeleton className="h-28 w-full" />
        )}
      </Card>

      <Card padded className="space-y-4">
        <ReviewFilters value={filter} onChange={setFilter} includeUnanswered />

        {list.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : list.isError ? (
          <p className="text-body-sm text-destructive py-6">{t("errors:request.generic")}</p>
        ) : list.reviews.length === 0 ? (
          <EmptyState icon={MessageSquareText} title={t("restaurant:reviews.empty")} />
        ) : (
          <div>
            {list.reviews.map((review) => (
              <SellerReviewItem key={review.id} review={review} restaurantName={restaurantName} />
            ))}
          </div>
        )}

        {list.hasNextPage && (
          <Button
            variant="outline"
            block
            onClick={() => list.fetchNextPage()}
            isLoading={list.isFetchingNextPage}
          >
            {t("restaurant:reviews.loadMore")}
          </Button>
        )}
      </Card>
    </div>
  );
}

export default SellerReviews;
