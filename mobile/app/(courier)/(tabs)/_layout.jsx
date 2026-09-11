import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { LayoutDashboard, PackageSearch, UserRound } from "lucide-react-native";
import { tabItemOptions, tabScreenOptions } from "@/navigation/tabBar";
import { useAvailableOrders } from "@/hooks/Courier/useCourier";
import { useTokens } from "@/theme/useTokens";

const TABS = [
  { name: "index", title: "Today", icon: LayoutDashboard },
  { name: "orders", title: "Jobs", icon: PackageSearch, badge: true },
  { name: "profile", title: "Profile", icon: UserRound },
];

export default function CourierTabs() {
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
      {TABS.map(({ name, title, icon, badge }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={tabItemOptions({
            icon,
            title,
            badge: badge && waiting > 0 ? waiting : undefined,
          })}
        />
      ))}
    </Tabs>
  );
}
