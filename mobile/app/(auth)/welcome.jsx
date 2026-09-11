import { Pressable, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { AuthOptions, PARTNER_OPTIONS } from "@/features/auth/AuthScreen";

/**
 * The way in.
 *
 * Two decisions and nothing else: create an account, or sign in. The partner
 * routes sit under them in the same grouped list the auth screens use, and
 * browsing without an account is a link rather than a third button competing
 * with the two that matter.
 */
export default function Welcome() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow justify-between gap-10 px-5"
      contentContainerStyle={{
        paddingTop: insets.top + 56,
        paddingBottom: Math.max(insets.bottom, 20) + 8,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="gap-5">
        <View className="flex-row">
          <BrandLogo tight size={26} />
        </View>
        <View className="gap-3">
          <Text variant="display">Good food,{"\n"}already on its way.</Text>
          <Text variant="body-lg" tone="muted">
            Order from restaurants near you and follow your courier to your door.
          </Text>
        </View>
      </View>

      <View className="gap-6">
        <AuthOptions label="Work with Chow" options={PARTNER_OPTIONS} />

        <View className="gap-3">
          <Button size="lg" fullWidth onPress={() => router.push("/(auth)/register")}>
            Create an account
          </Button>
          <Button
            size="lg"
            variant="secondary"
            fullWidth
            onPress={() => router.push("/(auth)/login")}
          >
            Sign in
          </Button>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/(customer)")}
            className="items-center py-2 active:opacity-60"
          >
            <Text variant="label" tone="muted">
              Browse without signing in
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}
