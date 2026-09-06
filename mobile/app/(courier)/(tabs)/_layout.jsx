import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LayoutDashboard, PackageSearch, UserRound } from "lucide-react-native";
import { useAvailableOrders } from "@/hooks/Courier/useCourier";
import { useTokens } from "@/theme/useTokens";

const TABS = [
  { name: "index", title: "Today", icon: LayoutDashboard },
  { name: "orders", title: "Orders", icon: PackageSearch, badge: true },
  { name: "profile", title: "Profile", icon: UserRound },
];

export default function CourierTabs() {
  const { color, isDark } = useTokens();
  const translucent = Platform.OS === "ios";

  // How many jobs are up for grabs is the number a courier checks constantly.
  const pool = useAvailableOrders();
  const waiting = pool.data?.orders?.length ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.primary,
        tabBarInactiveTintColor: color["muted-foreground"],
        tabBarLabelStyle: { fontFamily: "Inter_500Medium", fontSize: 11 },
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
      {TABS.map(({ name, title, icon: Icon, badge }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarBadge: badge && waiting > 0 ? waiting : undefined,
            tabBarBadgeStyle: { backgroundColor: color.primary, fontSize: 10 },
            tabBarIcon: ({ color: tint, size }) => <Icon size={size} color={tint} />,
          }}
        />
      ))}
    </Tabs>
  );
}
