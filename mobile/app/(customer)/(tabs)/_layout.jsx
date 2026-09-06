import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Heart, Home, Receipt, Search, User } from "lucide-react-native";
import { useTokens } from "@/theme/useTokens";

const TABS = [
  { name: "index", title: "Home", icon: Home },
  { name: "search", title: "Search", icon: Search },
  { name: "orders", title: "Orders", icon: Receipt },
  { name: "favourites", title: "Favourites", icon: Heart },
  { name: "profile", title: "Profile", icon: User },
];

export default function TabsLayout() {
  const { color, isDark } = useTokens();
  const translucent = Platform.OS === "ios";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color["muted-foreground"],
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 11 },
        // iOS gets a translucent material so content scrolls under the bar;
        // Android stays opaque, which is what Material expects.
        tabBarStyle: {
          backgroundColor: translucent ? "transparent" : color.card,
          borderTopColor: color.border,
          position: translucent ? "absolute" : "relative",
        },
        tabBarBackground: translucent
          ? () => <BlurView intensity={80} tint={isDark ? "dark" : "light"} style={{ flex: 1 }} />
          : undefined,
      }}
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}
    >
      {TABS.map(({ name, title, icon: Icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color: tint, size }) => <Icon size={size} color={tint} />,
          }}
        />
      ))}
    </Tabs>
  );
}
