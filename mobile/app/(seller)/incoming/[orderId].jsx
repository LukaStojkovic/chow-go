import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, Check } from "lucide-react-native";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, Inset } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { DockedBar } from "@/components/ui/FloatingBar";

import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { RejectOrderPrompt } from "@/features/seller/RejectOrderPrompt";
import { silenceAlert } from "@/features/seller/SellerAlert";
import { useConfirmOrder, useRejectOrder } from "@/hooks/SellerOrders/useSellerOrders";
import { getRestaurantOrderById } from "@/services/apiRestaurantOrder";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

const PREP_TIMES = [15, 20, 30, 45];

/**
 * The takeover.
 *
 * This is the one screen in the app that interrupts, so it is built to be read
 * across a kitchen: a full green field, the order total in the largest type the
 * system has, and two decisions at the bottom. Nothing here is subtle on
 * purpose - every second this sits unanswered is a customer waiting.
 */
export default function IncomingOrder() {
  const { orderId } = useLocalSearchParams();
  const confirm = useConfirmOrder();
  const reject = useRejectOrder();
  const { color } = useTokens();
  const insets = useSafeAreaInsets();

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
  const notes = (order?.items ?? []).filter((line) => line.notes);

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
    <View className="flex-1 bg-background">
      <LinearGradient
        colors={[color["primary-bright"], color.primary]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ paddingTop: insets.top + 24 }}
      >
        <View className="gap-3 px-5 pb-10">
          <View className="flex-row items-center gap-2 self-start rounded-full bg-white/20 px-3 py-1.5">
            <StatusDot tone="success" />
            <Bell size={12} color={color["primary-foreground"]} />
            <Text variant="caption" tone="inverse">
              New order
            </Text>
          </View>

          <Text variant="price-xl" tone="inverse">
            {order ? formatPrice(order.pricing?.total ?? 0) : "—"}
          </Text>

          <Text variant="body-lg" tone="inverse" className="opacity-85">
            {order ? `#${order.number} · ${order.itemCount} items` : "Loading…"}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerClassName="-mt-6 gap-3 rounded-t-3xl bg-background px-5 pb-6 pt-6"
        showsVerticalScrollIndicator={false}
      >
        <Card className="gap-3">
          {(order?.items ?? []).map((line, index) => (
            <View key={line.id}>
              {index > 0 ? <Divider className="mb-3" /> : null}
              <View className="flex-row items-start gap-3">
                <View className="rounded-xs bg-primary-subtle px-2 py-1">
                  <Text variant="label-sm" tone="primary">
                    {line.quantity}×
                  </Text>
                </View>
                <Text variant="body-lg" className="flex-1" numberOfLines={2}>
                  {line.name}
                </Text>
                <Text variant="price">{formatPrice(line.lineTotal)}</Text>
              </View>
            </View>
          ))}

          {/* Special instructions get their own tinted block rather than grey
               subtext: a missed allergy note is the expensive failure here. */}
          {notes.length ? (
            <Inset tone="warning" className="gap-2">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={14} color={color.warning} />
                <Text variant="caption" tone="warning">
                  Special instructions
                </Text>
              </View>
              {notes.map((line) => (
                <Text key={`${line.id}-note`} variant="body-sm" className="text-warning">
                  {line.name}: {line.notes}
                </Text>
              ))}
            </Inset>
          ) : null}

          {order?.notes ? (
            <Inset tone="citrus" className="gap-1">
              <Text variant="caption" tone="tertiary">
                Note from the customer
              </Text>
              <Text variant="body-sm">{order.notes}</Text>
            </Inset>
          ) : null}
        </Card>

        {order?.deliveryAddress ? (
          <Card className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="caption" tone="muted">
                Delivering to
              </Text>
              <Text variant="body-sm" numberOfLines={2}>
                {order.deliveryAddress}
              </Text>
            </View>
          </Card>
        ) : null}

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h3">How long will it take?</Text>
              <Text variant="caption" tone="muted">
                The customer sees this as their estimate
              </Text>
            </View>
          </View>

          <View className="flex-row gap-2">
            {PREP_TIMES.map((minutes) => (
              <Chip
                key={minutes}
                label={`${minutes} min`}
                active={prepTime === minutes}
                onPress={() => setPrepTime(minutes)}
                className="flex-1 justify-center"
              />
            ))}
          </View>
        </Card>
      </ScrollView>

      <DockedBar className="gap-2.5">
        <Button size="lg" fullWidth loading={confirm.isPending} onPress={accept}>
          <View className="flex-row items-center gap-2">
            <Check size={20} strokeWidth={3} color={color["primary-foreground"]} />
            <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
              {`Accept · ${prepTime} min`}
            </Text>
          </View>
        </Button>
        <Button
          size="lg"
          variant="ghost"
          fullWidth
          onPress={() => {
            silenceAlert();
            setRejecting(true);
          }}
        >
          <Text variant="label" tone="destructive">
            Reject order
          </Text>
        </Button>
      </DockedBar>

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
    </View>
  );
}
