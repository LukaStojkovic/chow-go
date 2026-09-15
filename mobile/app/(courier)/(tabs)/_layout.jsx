import { useTranslation } from "react-i18next";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LayoutDashboard, PackageSearch, UserRound } from "lucide-react-native";
import { tabItemOptions, tabScreenOptions } from "@/navigation/tabBar";
import { useAvailableOrders } from "@/hooks/Courier/useCourier";
import { useTokens } from "@/theme/useTokens";

// Keys rather than labels: this runs at module scope, before a language is
// picked, so a resolved string would stick after the user switches.
const TABS = [
  { name: "index", titleKey: "time.today", icon: LayoutDashboard },
  { name: "orders", titleKey: "nav.jobs", icon: PackageSearch, badge: true },
  { name: "profile", titleKey: "nav.profile", icon: UserRound },
];

export default function CourierTabs() {
  const { t } = useTranslation("common");
  const { color, isDark } = useTokens();
  const insets = useSafeAreaInsets();

  // How many jobs are up for grabs is the number a courier checks constantly.
  const pool = useAvailableOrders();
  const waiting = pool.data?.orders?.length ?? 0;

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
            badge: badge && waiting > 0 ? waiting : undefined,
          })}
        />
      ))}
    </Tabs>
  );
}
