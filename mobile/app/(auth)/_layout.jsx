import { Stack } from "expo-router";
import { useTokens } from "@/theme/useTokens";

export default function AuthLayout() {
  const { color } = useTokens();

  return (
    // Every screen in this stack draws its own <ScreenHeader>, the same as the
    // customer, seller and courier stacks. Leaving the native bar on top of
    // that is what put two back buttons on the seller and courier signups.
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: color.background },
      }}
    />
  );
}
