import { View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { CheckCircle2 } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { useOrder } from "@/hooks/Orders/useOrders";
import { useTokens } from "@/theme/useTokens";

/**
 * The moment the order lands.
 *
 * A full green field with one tick on it, then the receipt sliding up from
 * below. It is the only celebratory screen in the app, so it gets to be the
 * loudest - and it deliberately looks nothing like the tracking screen it
 * hands you on to.
 */
export default function OrderConfirmed() {
  const { orderId } = useLocalSearchParams();
  const { data } = useOrder(orderId);
  const { color } = useTokens();
  const insets = useSafeAreaInsets();

  const order = data ? toOrderView(data) : null;

  return (
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={[color["primary-bright"], color.primary]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ paddingTop: insets.top + 56 }}
      >
        <Animated.View entering={FadeIn.duration(400)} className="items-center gap-5 px-6 pb-16">
          <View className="h-24 w-24 items-center justify-center rounded-full bg-white/20">
            <CheckCircle2 size={52} strokeWidth={2} color={color["primary-foreground"]} />
          </View>
          <View className="items-center gap-2">
            <Text variant="display" tone="inverse" className="text-center">
              Order placed
            </Text>
            <Text variant="body-lg" tone="inverse" className="text-center opacity-85">
              {order?.restaurant?.name
                ? `${order.restaurant.name} will confirm it in a moment.`
                : "The restaurant will confirm it in a moment."}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <Animated.View
        entering={FadeInDown.duration(400).delay(120)}
        className="-mt-8 flex-1 gap-3 rounded-t-3xl bg-background px-5 pt-6"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {order ? (
          <Card className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text variant="caption" tone="muted">
                  Order number
                </Text>
                <Text variant="h3">#{order.number}</Text>
              </View>
            </View>

            <Divider />

            <View className="flex-row items-center gap-3">
              <Text variant="body" className="flex-1" numberOfLines={1}>
                {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
              </Text>
              <Text variant="price-lg">{formatPrice(order.pricing?.total ?? 0)}</Text>
            </View>

            {order.restaurant?.deliveryEstimate ? (
              <>
                <Divider />
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text variant="caption" tone="muted">
                      Estimated delivery
                    </Text>
                    <Text variant="h3">{order.restaurant.deliveryEstimate}</Text>
                  </View>
                </View>
              </>
            ) : null}
          </Card>
        ) : null}

        <View className="mt-auto gap-2.5">
          <Button
            size="lg"
            fullWidth
            onPress={() => router.replace(`/(customer)/order/${orderId}`)}
          >
            Track your order
          </Button>
          <Button
            size="lg"
            variant="ghost"
            fullWidth
            onPress={() => router.replace("/(customer)/(tabs)")}
          >
            Back to browsing
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}
