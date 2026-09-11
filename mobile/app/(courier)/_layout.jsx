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
        headerShown: false,
        contentStyle: { backgroundColor: color.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="delivery/[orderId]" />
    </Stack>
  );
}
