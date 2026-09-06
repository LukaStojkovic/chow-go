import { View } from "react-native";
import { Link, router } from "expo-router";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { GoogleButton } from "@/features/auth/GoogleButton";
import { Text } from "@/components/ui/Text";

export default function Welcome() {
  return (
    <Screen className="justify-between p-5">
      <View className="grow items-center justify-center gap-5">
        <BrandLogo size={96} />
        <View className="items-center gap-2">
          <Text variant="display">Chow &amp; Go</Text>
          <Text variant="body-lg" tone="muted" className="text-center">
            Food from restaurants near you, tracked to your door.
          </Text>
        </View>
      </View>

      <View className="gap-3">
        <Button size="lg" onPress={() => router.push("/(auth)/register")}>
          Create account
        </Button>
        <GoogleButton />
        <Button size="lg" variant="outline" onPress={() => router.push("/(auth)/login")}>
          I already have an account
        </Button>
        <Button size="lg" variant="ghost" onPress={() => router.push("/(auth)/seller")}>
          List your restaurant
        </Button>
        <Button size="lg" variant="ghost" onPress={() => router.push("/(auth)/courier")}>
          Deliver with us
        </Button>
        <Link href="/(customer)" asChild>
          <Button size="lg" variant="ghost">
            Browse without signing in
          </Button>
        </Link>
      </View>
    </Screen>
  );
}
