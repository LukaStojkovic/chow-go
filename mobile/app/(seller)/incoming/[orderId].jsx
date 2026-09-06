import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { RejectOrderPrompt } from "@/features/seller/RejectOrderPrompt";
import { silenceAlert } from "@/features/seller/SellerAlert";
import { useConfirmOrder, useRejectOrder } from "@/hooks/SellerOrders/useSellerOrders";
import { getRestaurantOrderById } from "@/services/apiRestaurantOrder";
import { toast } from "@/store/useToastStore";

const PREP_TIMES = [15, 20, 30, 45];

export default function IncomingOrder() {
  const { orderId } = useLocalSearchParams();
  const confirm = useConfirmOrder();
  const reject = useRejectOrder();

  const [prepTime, setPrepTime] = useState(20);
  const [rejecting, setRejecting] = useState(false);

  const { data } = useQuery({
    queryKey: ["restaurantOrder", orderId],
    queryFn: () => getRestaurantOrderById(orderId),
    enabled: Boolean(orderId),
  });

  // Opening the screen means the seller has seen it; the buzzing has done its
  // job and continuing would just be irritating.
  useEffect(() => silenceAlert, []);

  const order = data ? toOrderView(data) : null;

  async function accept() {
    silenceAlert();
    try {
      await confirm.mutateAsync({ orderId, estimatedPreparationTime: prepTime });
      toast.success("Order confirmed", { description: `${prepTime} min` });
      router.back();
    } catch (error) {
      toast.error("Could not confirm", { description: errorMessage(error) });
    }
  }

  return (
    <Screen className="justify-between">
      <ScrollView contentContainerClassName="gap-5 p-5">
        <View className="gap-1">
          <Text variant="caption" tone="warning">
            NEW ORDER
          </Text>
          <Text variant="display">{order ? formatPrice(order.pricing?.total ?? 0) : "—"}</Text>
          <Text variant="body" tone="muted">
            {order ? `#${order.number} · ${order.itemCount} items` : "Loading…"}
          </Text>
        </View>

        <View className="gap-2 rounded-md border border-border bg-card p-4">
          {(order?.items ?? []).map((line) => (
            <View key={line.id} className="flex-row justify-between gap-3">
              <Text variant="body" className="flex-1">
                {line.quantity} × {line.name}
              </Text>
              <Text variant="body-sm" tone="muted">
                {formatPrice(line.lineTotal)}
              </Text>
            </View>
          ))}
          {order?.items?.some((line) => line.notes) ? (
            <View className="mt-1 gap-1 border-t border-border pt-2">
              {order.items
                .filter((line) => line.notes)
                .map((line) => (
                  <Text key={`${line.id}-note`} variant="caption" tone="warning">
                    {line.name}: {line.notes}
                  </Text>
                ))}
            </View>
          ) : null}
        </View>

        <View className="gap-2">
          <Text variant="label">How long will it take?</Text>
          <View className="flex-row gap-2">
            {PREP_TIMES.map((minutes) => (
              <Button
                key={minutes}
                size="sm"
                variant={prepTime === minutes ? "primary" : "outline"}
                className="flex-1"
                onPress={() => setPrepTime(minutes)}
              >
                {`${minutes}m`}
              </Button>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="gap-2 border-t border-border bg-card p-4">
        <Button size="lg" loading={confirm.isPending} onPress={accept}>
          {`Accept · ${prepTime} min`}
        </Button>
        <Button
          size="lg"
          variant="ghost"
          onPress={() => {
            silenceAlert();
            setRejecting(true);
          }}
        >
          Reject
        </Button>
      </View>

      <RejectOrderPrompt
        visible={rejecting}
        isPending={reject.isPending}
        onCancel={() => setRejecting(false)}
        onConfirm={async (reason) => {
          try {
            await reject.mutateAsync({ orderId, reason });
            setRejecting(false);
            toast.info("Order rejected");
            router.back();
          } catch (error) {
            toast.error("Could not reject", { description: errorMessage(error) });
          }
        }}
      />
    </Screen>
  );
}
