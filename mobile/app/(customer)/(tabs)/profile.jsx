import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { ChevronRight, LogOut, MapPin, Moon, Receipt, UserRound } from "lucide-react-native";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useAuthStore } from "@/store/useAuthStore";
import { useMotionStore } from "@/store/useMotionStore";
import { useThemeStore } from "@/store/useThemeStore";
import { useTokens } from "@/theme/useTokens";

function Row({ icon: Icon, label, onPress }) {
  const { color } = useTokens();
  return (
    <Button variant="ghost" className="justify-start px-0" haptic={false} onPress={onPress}>
      <View className="flex-row items-center gap-3 py-1">
        <Icon size={18} color={color["muted-foreground"]} />
        <Text variant="label" className="flex-1">
          {label}
        </Text>
        <ChevronRight size={16} color={color["muted-foreground"]} />
      </View>
    </Button>
  );
}

function Choice({ options, value, onChange, label }) {
  return (
    <View className="gap-2">
      <Text variant="label">{label}</Text>
      <View className="flex-row gap-2">
        {options.map((option) => (
          <Button
            key={option}
            size="sm"
            variant={value === option ? "primary" : "outline"}
            className="flex-1"
            onPress={() => onChange(option)}
          >
            {option}
          </Button>
        ))}
      </View>
    </View>
  );
}

export default function Profile() {
  const { authUser, logout } = useAuthStore();
  const theme = useThemeStore();
  const motion = useMotionStore();

  if (!authUser) {
    return (
      <Screen edges={["top"]} className="justify-center">
        <EmptyState
          title="You're browsing as a guest"
          description="Sign in to order, track deliveries and save favourites."
          actionLabel="Sign in"
          onAction={() => router.push("/(auth)/login")}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <ScrollView contentContainerClassName="gap-6 p-5 pb-28">
        <View className="flex-row items-center gap-3">
          <View className="h-14 w-14 overflow-hidden rounded-full bg-muted">
            {authUser.profilePicture ? (
              <Image source={authUser.profilePicture} style={{ flex: 1 }} contentFit="cover" />
            ) : null}
          </View>
          <View className="flex-1 gap-0.5">
            <Text variant="h2" numberOfLines={1}>
              {authUser.name}
            </Text>
            <Text variant="body-sm" tone="muted" numberOfLines={1}>
              {authUser.email}
            </Text>
          </View>
        </View>

        <Card className="gap-1">
          <Row
            icon={UserRound}
            label="Your details"
            onPress={() => router.push("/(customer)/settings/profile")}
          />
          <View className="h-px bg-border" />
          <Row
            icon={Receipt}
            label="Your orders"
            onPress={() => router.push("/(customer)/(tabs)/orders")}
          />
          <View className="h-px bg-border" />
          <Row
            icon={MapPin}
            label="Delivery addresses"
            onPress={() => router.push("/(customer)/address")}
          />
        </Card>

        <Card className="gap-4">
          <View className="flex-row items-center gap-2">
            <Moon size={16} className="text-muted-foreground" />
            <Text variant="h3">Appearance</Text>
          </View>
          <Choice
            label="Theme"
            options={["light", "dark", "system"]}
            value={theme.preference}
            onChange={theme.setPreference}
          />
          <Choice
            label="Motion"
            options={["full", "reduced", "system"]}
            value={motion.preference}
            onChange={motion.setPreference}
          />
        </Card>

        <Button
          variant="outline"
          onPress={async () => {
            await logout();
            router.replace("/(auth)/welcome");
          }}
        >
          <View className="flex-row items-center gap-2">
            <LogOut size={16} className="text-foreground" />
            <Text variant="label">Sign out</Text>
          </View>
        </Button>
      </ScrollView>
    </Screen>
  );
}
