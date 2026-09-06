import { Redirect, Stack } from "expo-router";
import { SellerAlert } from "@/features/seller/SellerAlert";
import { useAuthStore } from "@/store/useAuthStore";
import { useTokens } from "@/theme/useTokens";

export default function SellerLayout() {
  const authUser = useAuthStore((state) => state.authUser);
  const { color } = useTokens();

  if (!authUser) return <Redirect href="/(auth)/welcome" />;
  if (authUser.role !== "seller") return <Redirect href="/(customer)" />;

  return (
    <>
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
        <Stack.Screen
          name="incoming/[orderId]"
          options={{ presentation: "fullScreenModal", headerShown: false }}
        />
        <Stack.Screen name="order/[orderId]" options={{ title: "Order" }} />
        <Stack.Screen name="menu-item/[menuItemId]" options={{ title: "Dish" }} />
      </Stack>

      <SellerAlert />
    </>
  );
}
