import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { BarChart3, LayoutDashboard, Settings, UtensilsCrossed } from "lucide-react-native";
import { ReceiptText } from "lucide-react-native";
import { useSellerOrders } from "@/hooks/SellerOrders/useSellerOrders";
import { useTokens } from "@/theme/useTokens";

const TABS = [
  { name: "index", title: "Overview", icon: LayoutDashboard },
  { name: "orders", title: "Orders", icon: ReceiptText, badge: true },
  { name: "menu", title: "Menu", icon: UtensilsCrossed },
  { name: "analytics", title: "Analytics", icon: BarChart3 },
  { name: "settings", title: "Settings", icon: Settings },
];

export default function SellerTabs() {
  const { color, isDark } = useTokens();
  const translucent = Platform.OS === "ios";

  // The badge is the whole point of the tab: a seller needs to know an order is
  // waiting without opening the app's second screen.
  const active = useSellerOrders({ status: "pending", limit: 1 });
  const pending = active.data?.counts?.pending ?? 0;

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
            tabBarBadge: badge && pending > 0 ? pending : undefined,
            tabBarBadgeStyle: { backgroundColor: color.destructive, fontSize: 10 },
            tabBarIcon: ({ color: tint, size }) => <Icon size={size} color={tint} />,
          }}
        />
      ))}
    </Tabs>
  );
}
