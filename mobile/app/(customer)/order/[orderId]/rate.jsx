import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Star } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DockedBar } from "@/components/ui/FloatingBar";

import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useOrder } from "@/hooks/Orders/useOrders";
import { rateOrder } from "@/services/apiOrder";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

// Stated back to the person rating, so a tap on the third star is confirmed by
// words rather than only by four unfilled outlines. The score is the catalog
// key, resolved inside the component so a language switch reaches it.
function Stars({ value, onChange }) {
  const { t } = useTranslation("order");
  const { color } = useTokens();

  return (
    <View className="items-center gap-2">
      <View className="flex-row gap-1.5">
        {[1, 2, 3, 4, 5].map((score) => (
          <Pressable
            key={score}
            accessibilityRole="button"
            accessibilityLabel={`${score} ${score === 1 ? "star" : "stars"}`}
            accessibilityState={{ selected: value === score }}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(score);
            }}
            hitSlop={6}
            className="p-1 active:opacity-60"
          >
            <Star
              size={34}
              strokeWidth={1.8}
              color={score <= value ? color.rating : color["border-strong"]}
              fill={score <= value ? color.rating : "transparent"}
            />
          </Pressable>
        ))}
      </View>
      <Text variant="label-sm" tone={value ? "foreground" : "muted"}>
        {value ? t(`order:rating.scores.${value}`) : t("order:rating.tapToRate")}
      </Text>
    </View>
  );
}

export default function RateOrder() {
  const { t } = useTranslation(["order", "restaurant", "basket", "profile", "auth", "errors", "validation", "courier", "common"]);
  const { orderId } = useLocalSearchParams();
  const { data } = useOrder(orderId);
  const queryClient = useQueryClient();

  const [restaurantRating, setRestaurantRating] = useState(0);
  const [restaurantReview, setRestaurantReview] = useState("");
  const [courierRating, setCourierRating] = useState(0);
  const [courierReview, setCourierReview] = useState("");

  const order = data ? toOrderView(data) : null;

  const submit = useMutation({
    mutationFn: () =>
      rateOrder(orderId, {
        restaurantRating,
        restaurantReview: restaurantReview.trim() || undefined,
        // Only sent when a courier actually delivered it.
        ...(order?.courier && courierRating
          ? { courierRating, courierReview: courierReview.trim() || undefined }
          : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      toast.success(t("order:rating.thanks"));
      router.back();
    },
    onError: (error) =>
      toast.error(t("order:rating.submitFailed"), { description: errorMessage(error) }),
  });

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("rating.title")} subtitle={order?.restaurant?.name} />

      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h3">{t("rating.restaurantHeading")}</Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {order?.restaurant?.name ?? t("order:detail.itemsHeading")}
              </Text>
            </View>
          </View>

          <Stars value={restaurantRating} onChange={setRestaurantRating} />

          <Input
            value={restaurantReview}
            onChangeText={setRestaurantReview}
            placeholder={t("rating.foodPlaceholder")}
            multiline
            maxLength={500}
          />
        </Card>

        {order?.courier ? (
          <Card className="gap-4">
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text variant="h3">{t("rating.courierHeading")}</Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {order.courier.name}
                </Text>
              </View>
            </View>

            <Stars value={courierRating} onChange={setCourierRating} />

            <Input
              value={courierReview}
              onChangeText={setCourierReview}
              placeholder={t("rating.deliveryPlaceholder")}
              multiline
              maxLength={500}
            />
          </Card>
        ) : null}
      </ScrollView>

      <DockedBar>
        <Button
          size="lg"
          fullWidth
          disabled={restaurantRating === 0}
          loading={submit.isPending}
          onPress={() => submit.mutate()}
        >
          {restaurantRating === 0
            ? t("validation:order.ratingRequired")
            : t("rating.submit")}
        </Button>
      </DockedBar>
    </Screen>
  );
}
