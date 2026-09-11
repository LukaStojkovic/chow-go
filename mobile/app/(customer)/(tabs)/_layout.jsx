import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Heart, Home, Receipt, Search, User } from "lucide-react-native";
import { tabItemOptions, tabScreenOptions } from "@/navigation/tabBar";
import { useTokens } from "@/theme/useTokens";

const TABS = [
  { name: "index", title: "Home", icon: Home },
  { name: "search", title: "Browse", icon: Search },
  { name: "orders", title: "Orders", icon: Receipt },
  { name: "favourites", title: "Saved", icon: Heart },
  { name: "profile", title: "Profile", icon: User },
];

export default function TabsLayout() {
  const { color, isDark } = useTokens();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={tabScreenOptions({ color, isDark, insets })}
      screenListeners={{ tabPress: () => Haptics.selectionAsync() }}
    >
      {TABS.map(({ name, title, icon }) => (
        <Tabs.Screen key={name} name={name} options={tabItemOptions({ icon, title })} />
      ))}
    </Tabs>
  );
}
