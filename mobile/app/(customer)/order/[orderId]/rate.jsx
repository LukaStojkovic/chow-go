import { useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Star } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useOrder } from "@/hooks/Orders/useOrders";
import { rateOrder } from "@/services/apiOrder";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

function Stars({ value, onChange, label }) {
  const { color } = useTokens();

  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((score) => (
          <Pressable
            key={score}
            accessibilityRole="button"
            accessibilityLabel={`${score} ${score === 1 ? "star" : "stars"}`}
            accessibilityState={{ selected: value === score }}
            onPress={() => onChange(score)}
            hitSlop={6}
            className="p-1"
          >
            <Star
              size={30}
              color={color.rating}
              fill={score <= value ? color.rating : "transparent"}
            />
          </Pressable>
        ))}
      </View>
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
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-6 p-5" keyboardShouldPersistTaps="handled">
        <View className="gap-1">
          <Text variant="h1">How was it?</Text>
          <Text variant="body" tone="muted">
            {order?.restaurant?.name ?? "Your order"}
          </Text>
        </View>

        <View className="gap-3">
          <Stars value={restaurantRating} onChange={setRestaurantRating} label="The food" />
          <Input
            value={restaurantReview}
            onChangeText={setRestaurantReview}
            placeholder="Anything you'd like the restaurant to know?"
            multiline
            maxLength={500}
            className="h-24 py-3"
            style={{ textAlignVertical: "top" }}
          />
        </View>

        {order?.courier ? (
          <View className="gap-3">
            <Stars
              value={courierRating}
              onChange={setCourierRating}
              label={`Delivery by ${order.courier.name}`}
            />
            <Input
              value={courierReview}
              onChangeText={setCourierReview}
              placeholder="Anything about the delivery?"
              multiline
              maxLength={500}
              className="h-24 py-3"
              style={{ textAlignVertical: "top" }}
            />
          </View>
        ) : null}
      </ScrollView>

      <View className="border-t border-border bg-card p-4">
        <Button
          size="lg"
          disabled={restaurantRating === 0}
          loading={submit.isPending}
          onPress={() => submit.mutate()}
        >
          {restaurantRating === 0 ? "Pick a rating" : "Submit"}
        </Button>
      </View>
    </Screen>
  );
}
