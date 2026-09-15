import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { WifiOff } from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { useMotion } from "@/theme/motion";
import { useTokens } from "@/theme/useTokens";

// React Query already pauses on NetInfo; this is only so the user knows why
// nothing is loading.
export function OfflineBanner() {
  const { t } = useTranslation("common");
  const [offline, setOffline] = useState(false);
  const insets = useSafeAreaInsets();
  const motion = useMotion();
  const { color } = useTokens();

  useEffect(
    () =>
      NetInfo.addEventListener((state) =>
        setOffline(!(state.isConnected && state.isInternetReachable !== false)),
      ),
    [],
  );

  if (!offline) return null;

  return (
    <Animated.View
      entering={motion.enter.top()}
      exiting={motion.exit.top()}
      pointerEvents="none"
      className="absolute left-0 right-0 z-40"
      style={{ top: insets.top }}
    >
      <View className="mx-4 flex-row items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5">
        <WifiOff size={14} color={color.background} />
        <Text variant="label-sm" className="text-background">
          {t("state.offline")}
        </Text>
      </View>
    </Animated.View>
  );
}
