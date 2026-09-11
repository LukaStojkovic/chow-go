import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  BarChart3,
  LayoutDashboard,
  ReceiptText,
  Settings,
  UtensilsCrossed,
} from "lucide-react-native";
import { tabItemOptions, tabScreenOptions } from "@/navigation/tabBar";
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
  const insets = useSafeAreaInsets();

  // The badge is the whole point of the tab: a seller needs to know an order is
  // waiting without opening the app's second screen.
  const active = useSellerOrders({ status: "pending", limit: 1 });
  const pending = active.data?.counts?.pending ?? 0;

  return (
    <Tabs
      screenOptions={tabScreenOptions({ color, isDark, insets })}
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}
    >
      {TABS.map(({ name, title, icon, badge }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={tabItemOptions({
            icon,
            title,
            badge: badge && pending > 0 ? pending : undefined,
          })}
        />
      ))}
    </Tabs>
  );
}
