import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, FlatList, RefreshControl, View } from "react-native";
import { MessageSquareText, Trash2 } from "lucide-react-native";
import { REVIEW_LIMITS } from "@chowgo/shared/reviews";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Chip, ChipRow } from "@/components/ui/Chip";
import { Sheet, SheetActions } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { ReviewCard } from "@/features/reviews/ReviewCard";
import { ReviewSummary } from "@/features/reviews/ReviewSummary";
import { useOwnRestaurant } from "@/hooks/Restaurants/useOwnRestaurant";
import {
  flattenReviews,
  summaryOf,
  useDeleteReviewReply,
  useSaveReviewReply,
  useSellerReviews,
} from "@/hooks/Reviews/useReviews";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

const FILTERS = ["all", "unanswered", "withText", 5, 4, 3, 2, 1];

function paramsFor(filter) {
  if (filter === "unanswered") return { unreplied: "true" };
  if (filter === "withText") return { withText: "true" };
  if (typeof filter === "number") return { rating: filter };
  return {};
}

function ReplyEditor({ review, onDone }) {
  const { t } = useTranslation(["restaurant", "common"]);
  const save = useSaveReviewReply();
  const [text, setText] = useState(review.reply?.text ?? "");
  const trimmed = text.trim();

  function submit() {
    save.mutate(
      { orderId: review.id, text: trimmed },
      {
        onSuccess: () => {
          toast.success(t("restaurant:reviews.replySaved"));
          onDone();
        },
        onError: (error) => toast.error(t("restaurant:reviews.replyFailed"), { description: errorMessage(error) }),
      },
    );
  }

  return (
    <View className="gap-2">
      <Input
        value={text}
        onChangeText={setText}
        placeholder={t("restaurant:reviews.replyPlaceholder")}
        accessibilityLabel={t("restaurant:reviews.reply")}
        hint={t("restaurant:reviews.replyHint")}
        multiline
        autoFocus
        maxLength={REVIEW_LIMITS.replyLength}
      />
      <Text variant="caption" tone="muted" className="text-right">
        {`${text.length}/${REVIEW_LIMITS.replyLength}`}
      </Text>
      <View className="flex-row gap-2">
        <Button size="sm" variant="ghost" onPress={onDone} disabled={save.isPending}>
          {t("common:actions.cancel")}
        </Button>
        <Button size="sm" disabled={!trimmed} loading={save.isPending} onPress={submit}>
          {t("common:actions.save")}
        </Button>
      </View>
    </View>
  );
}

export default function SellerReviews() {
  const { t } = useTranslation(["restaurant", "common"]);
  const { color } = useTokens();
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const restaurantName = useOwnRestaurant().data?.name;
  const reviews = useSellerReviews(paramsFor(filter));
  const remove = useDeleteReviewReply();
  const items = flattenReviews(reviews.data);
  const summary = summaryOf(reviews.data);

  const loadMore = () => {
    if (reviews.hasNextPage && !reviews.isFetchingNextPage) reviews.fetchNextPage();
  };

  function confirmDelete() {
    const orderId = deleting;
    setDeleting(null);
    remove.mutate(orderId, {
      onSuccess: () => toast.success(t("restaurant:reviews.replyDeleted")),
      onError: (error) => toast.error(t("restaurant:reviews.replyFailed"), { description: errorMessage(error) }),
    });
  }

  function filterLabel(entry) {
    if (entry === "all") return t("restaurant:reviews.filterAll");
    if (entry === "unanswered") return t("restaurant:reviews.unanswered");
    if (entry === "withText") return t("restaurant:reviews.withText");
    return t("restaurant:reviews.stars", { count: entry });
  }

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("restaurant:reviews.title")} subtitle={restaurantName} />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerClassName="gap-3 px-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={reviews.isRefetching && !reviews.isFetchingNextPage} onRefresh={reviews.refetch} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View className="gap-3">
            <ReviewSummary summary={summary} />
            <View className="-mx-5">
              <ChipRow>
                {FILTERS.map((entry) => (
                  <Chip
                    key={String(entry)}
                    label={filterLabel(entry)}
                    active={filter === entry}
                    onPress={() => {
                      setFilter(entry);
                      setEditing(null);
                    }}
                  />
                ))}
              </ChipRow>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ReviewCard review={item} restaurantName={restaurantName}>
            {editing === item.id ? (
              <ReplyEditor review={item} onDone={() => setEditing(null)} />
            ) : item.reply ? (
              <View className="flex-row gap-2">
                <Button size="sm" variant="mint" onPress={() => setEditing(item.id)}>
                  {t("restaurant:reviews.editReply")}
                </Button>
                <Button size="sm" variant="ghost" onPress={() => setDeleting(item.id)}>
                  {t("restaurant:reviews.deleteReply")}
                </Button>
              </View>
            ) : (
              <View className="flex-row">
                <Button size="sm" variant="mint" onPress={() => setEditing(item.id)}>
                  {t("restaurant:reviews.reply")}
                </Button>
              </View>
            )}
          </ReviewCard>
        )}
        ListEmptyComponent={
          reviews.isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-lg" />
              ))}
            </View>
          ) : reviews.isError ? (
            <EmptyState
              tone="danger"
              title={t("common:error.generic")}
              actionLabel={t("common:actions.retry")}
              onAction={reviews.refetch}
            />
          ) : (
            <EmptyState icon={MessageSquareText} title={t("restaurant:reviews.empty")} />
          )
        }
        ListFooterComponent={
          reviews.isFetchingNextPage ? (
            <ActivityIndicator color={color.primary} />
          ) : reviews.hasNextPage ? (
            <Button variant="outline" onPress={loadMore}>
              {t("restaurant:reviews.loadMore")}
            </Button>
          ) : null
        }
      />

      <Sheet
        visible={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        icon={Trash2}
        title={t("restaurant:reviews.deleteReply")}
        description={items.find((review) => review.id === deleting)?.reply?.text}
      >
        <SheetActions>
          <Button variant="destructive" size="lg" fullWidth onPress={confirmDelete}>
            {t("common:actions.delete")}
          </Button>
          <Button variant="outline" size="lg" fullWidth onPress={() => setDeleting(null)}>
            {t("common:actions.cancel")}
          </Button>
        </SheetActions>
      </Sheet>
    </Screen>
  );
}
