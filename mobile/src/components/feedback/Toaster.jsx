import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { useToastStore } from "@/store/useToastStore";
import { Text } from "@/components/ui/Text";

const TONES = {
  success: { border: "border-success", tone: "success" },
  error: { border: "border-destructive", tone: "destructive" },
  warning: { border: "border-warning", tone: "warning" },
  info: { border: "border-info", tone: "info" },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  const insets = useSafeAreaInsets();

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
              className={`rounded-md border border-l-4 border-border bg-popover p-3 shadow-lg ${style.border}`}
            >
              <Text variant="label" tone={style.tone}>
                {item.title}
              </Text>
              {item.description ? (
                <Text variant="body-sm" tone="muted" className="mt-0.5">
                  {item.description}
                </Text>
              ) : null}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}
