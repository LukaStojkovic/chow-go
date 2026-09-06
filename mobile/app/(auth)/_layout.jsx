import { Stack } from "expo-router";
import { useTokens } from "@/theme/useTokens";

export default function AuthLayout() {
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
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: "Sign in" }} />
      <Stack.Screen name="register" options={{ title: "Create account" }} />
      <Stack.Screen name="forgot-password" options={{ title: "Reset password" }} />
      <Stack.Screen name="verify-otp" options={{ title: "Check your email" }} />
      <Stack.Screen name="reset-password" options={{ title: "New password" }} />
      <Stack.Screen name="google-complete" options={{ title: "Finish signing up" }} />
      <Stack.Screen name="seller" options={{ title: "List your restaurant" }} />
    </Stack>
  );
}
