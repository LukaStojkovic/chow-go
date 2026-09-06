import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { DELIVERY_TYPES, MAX_ORDER_NOTES, PAYMENT_METHODS } from "@chowgo/shared/constants";
import { PRICING, buildPriceBreakdown } from "@chowgo/shared/adapters/pricing";
import { formatPrice } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { OptionRow } from "@/features/checkout/OptionRow";
import { Section } from "@/features/checkout/Section";
import { useAddresses } from "@/hooks/Address/useAddresses";
import { useCreateOrder } from "@/hooks/Orders/useOrders";
import { useCartStore } from "@/store/useCartStore";
import { toast } from "@/store/useToastStore";

export default function Checkout() {
  const { items, totalPrice, clearLocalCart } = useCartStore();
  const addresses = useAddresses();
  const createOrder = useCreateOrder();

  const [addressId, setAddressId] = useState(null);
  const [deliveryType, setDeliveryType] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [tip, setTip] = useState(0);
  const [notes, setNotes] = useState("");

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
      toast.warning("Choose a delivery address");
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        restaurantId: useCartStore.getState().restaurant?._id,
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
      toast.error("Could not place your order", { description: errorMessage(error) });
    }
  }

  if (items.length === 0) {
    return (
      <Screen className="items-center justify-center p-8">
        <Text variant="body" tone="muted">
          Your basket is empty.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen edges={["bottom"]}>
      <ScrollView contentContainerClassName="gap-6 p-5 pb-6" keyboardShouldPersistTaps="handled">
        <Section
          title="Deliver to"
          action={
            <Button variant="ghost" size="sm" onPress={() => router.push("/(customer)/address")}>
              Manage
            </Button>
          }
        >
          {addresses.isLoading ? (
            <Text variant="body-sm" tone="muted">
              Loading addresses…
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
            <Button variant="outline" onPress={() => router.push("/(customer)/address")}>
              Add a delivery address
            </Button>
          )}
        </Section>

        <Section title="Delivery">
          <View className="gap-2">
            {DELIVERY_TYPES.map((option) => (
              <OptionRow
                key={option.value}
                label={option.label}
                description={option.description}
                selected={deliveryType === option.value}
                onPress={() => setDeliveryType(option.value)}
                trailing={
                  option.value === "priority" ? (
                    <Text variant="body-sm" tone="muted">
                      +{formatPrice(PRICING.priorityFee)}
                    </Text>
                  ) : null
                }
              />
            ))}
          </View>
        </Section>

        <Section title="Payment">
          <View className="gap-2">
            {PAYMENT_METHODS.map((option) => (
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

        <Section title="Tip your courier">
          <View className="flex-row gap-2">
            {PRICING.tipPresets.map((preset) => (
              <Button
                key={preset}
                size="sm"
                variant={tip === preset ? "primary" : "outline"}
                className="flex-1"
                onPress={() => setTip(preset)}
              >
                {preset === 0 ? "None" : formatPrice(preset)}
              </Button>
            ))}
          </View>
        </Section>

        <Section title="Notes for the restaurant">
          <Input
            value={notes}
            onChangeText={setNotes}
            maxLength={MAX_ORDER_NOTES}
            multiline
            placeholder="Allergies, buzzer code, anything else"
            className="h-24 py-3"
            style={{ textAlignVertical: "top" }}
          />
        </Section>

        <View className="gap-1.5 rounded-md border border-border bg-card p-4">
          {[
            ["Subtotal", breakdown.subtotal],
            ["Delivery", breakdown.deliveryFee],
            ["Service", breakdown.serviceFee],
            ...(breakdown.priorityFee ? [["Priority", breakdown.priorityFee]] : []),
            ...(tip ? [["Tip", tip]] : []),
          ].map(([label, value]) => (
            <View key={label} className="flex-row justify-between">
              <Text variant="body-sm" tone="muted">
                {label}
              </Text>
              <Text variant="body-sm" tone="muted">
                {formatPrice(value)}
              </Text>
            </View>
          ))}
          <View className="h-px bg-border" />
          <View className="flex-row justify-between">
            <Text variant="label">Total</Text>
            <Text variant="price">{formatPrice(breakdown.total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-border bg-card p-4">
        <Button size="lg" loading={createOrder.isPending} onPress={placeOrder}>
          {`Place order · ${formatPrice(breakdown.total)}`}
        </Button>
      </View>
    </Screen>
  );
}
