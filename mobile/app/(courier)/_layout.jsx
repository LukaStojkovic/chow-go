import { Redirect, Stack } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useTokens } from "@/theme/useTokens";

export default function CourierLayout() {
  const authUser = useAuthStore((state) => state.authUser);
  const { color } = useTokens();

  if (!authUser) return <Redirect href="/(auth)/welcome" />;
  if (authUser.role !== "courier") return <Redirect href="/(customer)" />;

  return (
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
      <Stack.Screen name="delivery/[orderId]" options={{ headerShown: false }} />
    </Stack>
  );
}
