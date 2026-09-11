import { useEffect } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { BasketMiniBar } from "@/features/basket/BasketMiniBar";
import { ReplaceBasketDialog } from "@/features/basket/ReplaceBasketDialog";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { useTokens } from "@/theme/useTokens";

export default function CustomerLayout() {
  const { color } = useTokens();
  const authUser = useAuthStore((state) => state.authUser);
  const fetchCart = useCartStore((state) => state.fetchCart);

  // The server owns the cart, so a cold start or a fresh sign-in re-reads it
  // rather than trusting anything held locally.
  useEffect(() => {
    if (authUser) fetchCart();
  }, [authUser, fetchCart]);

  return (
    <View className="flex-1 bg-background">
      {/* Every screen draws its own <ScreenHeader>: the design's header is a
          circular back button with a two-line centred title, which the native
          bar cannot produce, and mixing the two would give the stack two
          different headers depending on which screen you were on. */}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="restaurant/[restaurantId]" />
        <Stack.Screen
          name="item/[menuItemId]"
          options={{ presentation: "formSheet", sheetAllowedDetents: [0.85] }}
        />
        <Stack.Screen
          name="basket"
          options={{ presentation: "formSheet", sheetAllowedDetents: [0.9] }}
        />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="address/index" />
        <Stack.Screen name="address/new" />
        <Stack.Screen name="order/[orderId]/index" />
        <Stack.Screen
          name="order/[orderId]/rate"
          options={{ presentation: "formSheet", sheetAllowedDetents: [0.9] }}
        />
        <Stack.Screen name="address/[addressId]" />
        <Stack.Screen name="settings/profile" />
        <Stack.Screen
          name="order/[orderId]/confirmed"
          options={{ presentation: "fullScreenModal" }}
        />
      </Stack>

      <BasketMiniBar />
      <ReplaceBasketDialog />
    </View>
  );
}
