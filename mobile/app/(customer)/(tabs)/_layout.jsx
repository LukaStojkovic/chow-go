import { useTranslation } from "react-i18next";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Heart, Home, Receipt, Search, User } from "lucide-react-native";
import { tabItemOptions, tabScreenOptions } from "@/navigation/tabBar";
import { useTokens } from "@/theme/useTokens";

// Keys rather than labels: this runs at module scope, before a language is
// picked, so a resolved string would stick after the user switches.
const TABS = [
  { name: "index", titleKey: "nav.home", icon: Home },
  { name: "search", titleKey: "nav.browse", icon: Search },
  { name: "orders", titleKey: "nav.orders", icon: Receipt },
  { name: "favourites", titleKey: "nav.saved", icon: Heart },
  { name: "profile", titleKey: "nav.profile", icon: User },
];

export default function TabsLayout() {
  const { t } = useTranslation("common");
  const { color, isDark } = useTokens();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={tabScreenOptions({ color, isDark, insets })}
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}
    >
      {TABS.map(({ name, titleKey, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={tabItemOptions({ icon, title: t(titleKey) })}
        />
      ))}
    </Tabs>
  );
}
