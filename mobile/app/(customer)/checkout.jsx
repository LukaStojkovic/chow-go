import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, Lock } from "lucide-react-native";
import { MAX_ORDER_NOTES, deliveryTypes, paymentMethods } from "@chowgo/shared/constants";
import { PRICING, buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
import { formatPrice } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { DockedBar } from "@/components/ui/FloatingBar";
import { Input } from "@/components/ui/Input";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { OptionRow } from "@/features/checkout/OptionRow";
import { Section } from "@/features/checkout/Section";
import { useAddresses } from "@/hooks/Address/useAddresses";
import { useCreateOrder } from "@/hooks/Orders/useOrders";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

import { makeRouteErrorBoundary } from "@/components/feedback/routeErrorBoundary";

export const ErrorBoundary = makeRouteErrorBoundary(
  "checkout",
  "basket:checkout.error.title",
  "basket:checkout.error.description",
);

export default function Checkout() {
  const { items, totalPrice, clearLocalCart, restaurant, fetchCart } = useCartStore();
  const addresses = useAddresses();
  const createOrder = useCreateOrder();
  const { color } = useTokens();
  const { t, i18n } = useTranslation(["basket", "profile", "order", "common"]);

  // Rebuilt only when the language changes: `t` is a new function on every
  // render, and these lists sit inside a scrolling form.
  const speeds = useMemo(() => deliveryTypes(t), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
  const payments = useMemo(() => paymentMethods(t), [i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [addressId, setAddressId] = useState(null);
  const [deliveryType, setDeliveryType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tip, setTip] = useState(0);
  const [notes, setNotes] = useState("");

  // The basket in memory can be a mutation response older than the server's
  // view - notably one that carried the restaurant as a bare id. Re-reading it
  // here is cheap and makes the screen self-healing.
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Default to the address the customer already marked as default, so the
  // common case needs no interaction at all.
  useEffect(() => {
    if (addressId || !addresses.data?.length) return;
    const preferred = addresses.data.find((entry) => entry.isDefault) ?? addresses.data[0];
    setAddressId(preferred?._id ?? null);
  }, [addresses.data, addressId]);

  const breakdown = buildPriceBreakdown({ subtotal: totalPrice, deliveryType, tip });

  async function placeOrder() {
    if (!addressId) {
      toast.warning(t("basket:chooseAddress"));
      return;
    }

    const restaurantId = restaurant?._id ?? useCartStore.getState().restaurant?._id;
    if (!restaurantId) {
      toast.error(t("order:detail.restaurantLost"), {
        description: t("order:detail.restaurantLostHint"),
      });
      fetchCart();
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        restaurantId,
        deliveryAddressId: addressId,
        paymentMethod,
        deliveryType,
        tip,
        customerNotes: notes.trim() || undefined,
      });
      // The backend deletes the cart document as part of creating the order.
      clearLocalCart();
      router.replace(`/(customer)/order/${order._id}/confirmed`);
    } catch (error) {
      toast.error(t("order:detail.placeFailed"), { description: errorMessage(error) });
    }
  }

  if (items.length === 0) {
    return (
      <Screen>
        <ScreenHeader title={t("basket:checkout.title")} />
        <EmptyState
          title={t("basket:empty.title")}
          description={t("basket:checkout.empty.description")}
          actionLabel={t("basket:empty.action")}
          onAction={() => router.replace("/(customer)/(tabs)")}
        />
      </Screen>
    );
  }

  const ROWS = [
    [t("basket:summary.subtotal"), breakdown.subtotal],
    [t("basket:summary.deliveryFee"), breakdown.deliveryFee],
    [t("basket:summary.serviceFee"), breakdown.serviceFee],
    ...(breakdown.priorityFee
      ? [[t("basket:summary.priorityFee"), breakdown.priorityFee]]
      : []),
    ...(tip ? [[t("basket:summary.tip"), tip]] : []),
  ];

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={t("basket:checkout.title")} subtitle={restaurant?.name} />

      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-6"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Section
          title={t("profile:delivery.deliverTo")}
          action={
            <Button variant="mint" size="sm" onPress={() => router.push("/(customer)/address")}>
              {t("common:actions.change")}
            </Button>
          }
        >
          {addresses.isLoading ? (
            <Text variant="body-sm" tone="muted">
              {t("profile:address.loading")}
            </Text>
          ) : addresses.data?.length ? (
            <View className="gap-2">
              {addresses.data.map((entry) => (
                <OptionRow
                  key={entry._id}
                  label={entry.label ?? "Address"}
                  description={entry.fullAddress}
                  selected={addressId === entry._id}
                  onPress={() => setAddressId(entry._id)}
                />
              ))}
            </View>
          ) : (
            <Button variant="mint" size="lg" onPress={() => router.push("/(customer)/address/new")}>
              {t("basket:checkout.address.add")}
            </Button>
          )}
        </Section>

        <Section title={t("basket:checkout.speed.title")}>
          <View className="gap-2">
            {speeds.map((option) => (
              <OptionRow
                key={option.value}
                label={option.label}
                description={option.description}
                selected={deliveryType === option.value}
                onPress={() => setDeliveryType(option.value)}
                trailing={
                  option.value === "priority" ? (
                    <Badge tone="citrus" size="sm">
                      {`+${formatPrice(PRICING.priorityFee)}`}
                    </Badge>
                  ) : null
                }
              />
            ))}
          </View>
        </Section>

        <Section title={t("basket:checkout.payment.title")}>
          <View className="gap-2">
            {payments.map((option) => (
              <OptionRow
                key={option.value}
                label={option.label}
                description={option.description}
                selected={paymentMethod === option.value}
                onPress={() => setPaymentMethod(option.value)}
              />
            ))}
          </View>
        </Section>

        <Section
          title={t("basket:checkout.tip.title")}
          subtitle={t("basket:checkout.tip.shortDescription")}
        >
          <View className="flex-row gap-2">
            {PRICING.tipPresets.map((preset) => (
              <Chip
                key={preset}
                label={preset === 0 ? t("basket:checkout.tip.none") : formatPrice(preset)}
                active={tip === preset}
                onPress={() => setTip(preset)}
                className="flex-1 justify-center"
              />
            ))}
          </View>
        </Section>

        <Section title={t("order:detail.restaurantNotes")}>
          <Input
            value={notes}
            onChangeText={setNotes}
            maxLength={MAX_ORDER_NOTES}
            multiline
            placeholder={t("basket:checkout.notes.shortPlaceholder")}
          />
        </Section>

        <Card>
          <Text variant="h3" className="mb-2">
            {t("basket:summary.title")}
          </Text>
          {ROWS.map(([label, value]) => (
            <View key={label} className="flex-row items-center justify-between py-1">
              <Text variant="body" tone="muted" numberOfLines={1} className="flex-1">
                {label}
              </Text>
              <Text variant="price" tone="muted">
                {formatPrice(value)}
              </Text>
            </View>
          ))}
          <Divider className="my-2" />
          <View className="flex-row items-end justify-between">
            <View>
              <Text variant="h3">{t("basket:summary.total")}</Text>
              <Text variant="caption" tone="muted">
                {t("basket:summary.includesFees")}
              </Text>
            </View>
            <Text variant="price-lg">{formatPrice(breakdown.total)}</Text>
          </View>
        </Card>
      </ScrollView>

      <DockedBar>
        <Button size="lg" fullWidth loading={createOrder.isPending} onPress={placeOrder}>
          <View className="w-full flex-row items-center justify-center gap-2">
            <Lock size={17} color={color["primary-foreground"]} />
            <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
              {t("basket:checkout.placeOrder")}
            </Text>
            <Text
              variant="body-lg"
              className="font-jakarta-bold text-primary-foreground opacity-70"
            >
              ·
            </Text>
            <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
              {formatPrice(breakdown.total)}
            </Text>
            <ArrowRight size={19} strokeWidth={2.6} color={color["primary-foreground"]} />
          </View>
        </Button>
      </DockedBar>
    </Screen>
  );
}
