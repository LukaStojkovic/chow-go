import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react-native";
import { useToastStore } from "@/store/useToastStore";
import { IconTile } from "@/components/ui/IconTile";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

const TONES = {
  success: { icon: CheckCircle2, tile: "mint" },
  error: { icon: XCircle, tile: "danger" },
  warning: { icon: AlertTriangle, tile: "warning" },
  info: { icon: Info, tile: "info" },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  const insets = useSafeAreaInsets();
  const { elevation, scheme } = useTokens();

  if (toasts.length === 0) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute left-0 right-0 z-50 gap-2 px-4"
      style={{ top: insets.top + 8 }}
    >
      {toasts.map((item) => {
        const style = TONES[item.tone] ?? TONES.info;
        return (
          <Animated.View
            key={item.id}
            entering={FadeInDown.duration(250)}
            exiting={FadeOutUp.duration(150)}
            layout={LinearTransition}
          >
            <Pressable
              onPress={() => dismiss(item.id)}
              accessibilityRole="alert"
              style={elevation.raised[scheme]}
              className="flex-row items-center gap-3 rounded-lg bg-popover p-3"
            >
              <IconTile icon={style.icon} tone={style.tile} size={36} round />
              <View className="flex-1">
                <Text variant="h3" numberOfLines={2}>
                  {item.title}
                </Text>
                {item.description ? (
                  <Text variant="body-sm" tone="muted" numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}
