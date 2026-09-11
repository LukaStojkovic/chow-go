import { useState } from "react";
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
// words rather than only by four unfilled outlines.
const SCORE_LABELS = ["", "Poor", "Not great", "Fine", "Good", "Excellent"];

function Stars({ value, onChange }) {
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
        {value ? SCORE_LABELS[value] : "Tap to rate"}
      </Text>
    </View>
  );
}

export default function RateOrder() {
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
      toast.success("Thanks for the feedback");
      router.back();
    },
    onError: (error) =>
      toast.error("Could not submit your rating", { description: errorMessage(error) }),
  });

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title="How was it?" subtitle={order?.restaurant?.name} />

      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card className="gap-4">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h3">The food</Text>
              <Text variant="caption" tone="muted" numberOfLines={1}>
                {order?.restaurant?.name ?? "Your order"}
              </Text>
            </View>
          </View>

          <Stars value={restaurantRating} onChange={setRestaurantRating} />

          <Input
            value={restaurantReview}
            onChangeText={setRestaurantReview}
            placeholder="Anything you'd like the restaurant to know?"
            multiline
            maxLength={500}
          />
        </Card>

        {order?.courier ? (
          <Card className="gap-4">
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text variant="h3">The delivery</Text>
                <Text variant="caption" tone="muted" numberOfLines={1}>
                  {order.courier.name}
                </Text>
              </View>
            </View>

            <Stars value={courierRating} onChange={setCourierRating} />

            <Input
              value={courierReview}
              onChangeText={setCourierReview}
              placeholder="Anything about the delivery?"
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
          {restaurantRating === 0 ? "Pick a rating" : "Submit rating"}
        </Button>
      </DockedBar>
    </Screen>
  );
}
