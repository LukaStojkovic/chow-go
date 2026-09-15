import { useTranslation } from "react-i18next";
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

// Keys rather than labels: this runs at module scope, before a language is
// picked, so a resolved string would stick after the user switches.
const TABS = [
  { name: "index", titleKey: "nav.overview", icon: LayoutDashboard },
  { name: "orders", titleKey: "nav.orders", icon: ReceiptText, badge: true },
  { name: "menu", titleKey: "nav.menu", icon: UtensilsCrossed },
  { name: "analytics", titleKey: "nav.analytics", icon: BarChart3 },
  { name: "settings", titleKey: "nav.settings", icon: Settings },
];

export default function SellerTabs() {
  const { t } = useTranslation("common");
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
      {TABS.map(({ name, titleKey, icon, badge }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={tabItemOptions({
            icon,
            title: t(titleKey),
            badge: badge && pending > 0 ? pending : undefined,
          })}
        />
      ))}
    </Tabs>
  );
}
