import { Stack } from "expo-router";
import { useTokens } from "@/theme/useTokens";

export default function CustomerLayout() {
  const { color } = useTokens();

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
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}
