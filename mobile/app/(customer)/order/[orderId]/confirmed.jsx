import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { CheckCircle2 } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { useOrder } from "@/hooks/Orders/useOrders";
import { useMotion } from "@/theme/motion";
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
  const { t } = useTranslation([
    "order",
    "restaurant",
    "basket",
    "profile",
    "auth",
    "errors",
    "validation",
    "courier",
    "common",
  ]);
  const { orderId } = useLocalSearchParams();
  const { data } = useOrder(orderId);
  const { color } = useTokens();
  const motion = useMotion();
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
        <Animated.View entering={motion.enter.content()} className="items-center gap-5 px-6 pb-16">
          {/* The tick springs in on its own beat, slightly after the field it
              sits on - it is the thing this screen exists to say. */}
          <Animated.View
            entering={motion.enter.pop(120)}
            className="h-24 w-24 items-center justify-center rounded-full bg-white/20"
          >
            <CheckCircle2 size={52} strokeWidth={2} color={color["primary-foreground"]} />
          </Animated.View>
          <View className="items-center gap-2">
            <Text variant="display" tone="inverse" className="text-center">
              {t("confirmed.title")}
            </Text>
            <Text variant="body-lg" tone="inverse" className="text-center opacity-85">
              {order?.restaurant?.name
                ? t("confirmSoon", { name: order.restaurant.name })
                : t("confirmSoonFallback")}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      <Animated.View
        entering={motion.enter.panel()}
        className="-mt-8 flex-1 gap-3 rounded-t-3xl bg-background px-5 pt-6"
        style={{ paddingBottom: Math.max(insets.bottom, 20) }}
      >
        {order ? (
          <Card className="gap-3">
            <View className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text variant="caption" tone="muted">
                  {t("confirmed.orderNumber")}
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
                      {t("eta.label")}
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
            {t("confirmed.trackAction")}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            fullWidth
            onPress={() => router.replace("/(customer)/(tabs)")}
          >
            {t("confirmed.homeAction")}
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}
