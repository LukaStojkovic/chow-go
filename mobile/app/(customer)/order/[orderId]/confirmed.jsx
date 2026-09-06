import { View } from "react-native";
import { CheckCircle2 } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useOrder } from "@/hooks/Orders/useOrders";
import { useTokens } from "@/theme/useTokens";

export default function OrderConfirmed() {
  const { orderId } = useLocalSearchParams();
  const { data } = useOrder(orderId);
  const { color } = useTokens();

  const order = data ? toOrderView(data) : null;

  return (
    <Screen className="justify-between p-5">
      <View className="grow items-center justify-center gap-5">
        <CheckCircle2 size={64} strokeWidth={1.5} color={color.success} />
        <View className="items-center gap-1.5">
          <Text variant="display" className="text-center">
            Order placed
          </Text>
          <Text variant="body" tone="muted" className="text-center">
            {order?.restaurant?.name
              ? `${order.restaurant.name} will confirm it shortly.`
              : "The restaurant will confirm it shortly."}
          </Text>
        </View>

        {order ? (
          <Card className="w-full gap-1">
            <View className="flex-row justify-between">
              <Text variant="body-sm" tone="muted">
                Order number
              </Text>
              <Text variant="body-sm">#{order.number}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text variant="body-sm" tone="muted">
                Total
              </Text>
              <Text variant="price">{formatPrice(order.pricing?.total ?? 0)}</Text>
            </View>
          </Card>
        ) : null}
      </View>

      <View className="gap-3">
        <Button size="lg" onPress={() => router.replace(`/(customer)/order/${orderId}`)}>
          Track order
        </Button>
        <Button size="lg" variant="ghost" onPress={() => router.replace("/(customer)/(tabs)")}>
          Back to browsing
        </Button>
      </View>
    </Screen>
  );
}
