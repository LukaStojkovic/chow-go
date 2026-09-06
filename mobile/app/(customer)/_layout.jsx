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
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: color.background },
          headerTintColor: color.foreground,
          headerTitleStyle: { fontFamily: "Inter_600SemiBold", fontSize: 17 },
          contentStyle: { backgroundColor: color.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="restaurant/[restaurantId]" options={{ title: "" }} />
        <Stack.Screen
          name="item/[menuItemId]"
          options={{ presentation: "formSheet", sheetAllowedDetents: [0.85], title: "" }}
        />
        <Stack.Screen
          name="basket"
          options={{ presentation: "formSheet", sheetAllowedDetents: [0.9], title: "Basket" }}
        />
        <Stack.Screen name="checkout" options={{ title: "Checkout" }} />
        <Stack.Screen name="address/index" options={{ title: "Delivery addresses" }} />
        <Stack.Screen name="order/[orderId]/index" options={{ title: "Order" }} />
        <Stack.Screen
          name="order/[orderId]/confirmed"
          options={{ presentation: "fullScreenModal", headerShown: false }}
        />
      </Stack>

      <BasketMiniBar />
      <ReplaceBasketDialog />
    </View>
  );
}
