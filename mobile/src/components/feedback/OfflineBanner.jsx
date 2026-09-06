import { useEffect, useState } from "react";
import { View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { WifiOff } from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

// React Query already pauses on NetInfo; this is only so the user knows why
// nothing is loading.
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  const insets = useSafeAreaInsets();
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
      entering={FadeInDown.duration(250)}
      exiting={FadeOutUp.duration(150)}
      pointerEvents="none"
      className="absolute left-0 right-0 z-40"
      style={{ top: insets.top }}
    >
      <View className="mx-4 flex-row items-center justify-center gap-2 rounded-sm bg-warning px-3 py-2">
        <WifiOff size={14} color={color["warning-foreground"]} />
        <Text variant="caption" className="text-warning-foreground">
          You're offline
        </Text>
      </View>
    </Animated.View>
  );
}
