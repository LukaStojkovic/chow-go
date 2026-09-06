import { useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ChevronsRight } from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

const THUMB = 52;
const COMPLETE_AT = 0.75;

/**
 * A slider rather than a button, for the steps that cannot be undone.
 *
 * Marking an order picked up or delivered is irreversible and happens on a
 * phone held one-handed, often in the rain. A misplaced tap costs a support
 * call; a misplaced swipe does not happen.
 */
export function SwipeToConfirm({ label, onConfirm, disabled, busy }) {
  const { color } = useTokens();
  const [width, setWidth] = useState(0);

  const offset = useSharedValue(0);
  const travel = Math.max(0, width - THUMB - 8);

  const finish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  const pan = Gesture.Pan()
    .enabled(!disabled && !busy && travel > 0)
    .onChange((event) => {
      offset.value = Math.min(travel, Math.max(0, offset.value + event.changeX));
    })
    .onEnd(() => {
      if (offset.value >= travel * COMPLETE_AT) {
        offset.value = withSpring(travel);
        runOnJS(finish)();
      } else {
        offset.value = withSpring(0);
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: offset.value + THUMB }));

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      className={`h-16 justify-center overflow-hidden rounded-full bg-secondary ${
        disabled ? "opacity-50" : ""
      }`}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint="Swipe right to confirm"
    >
      <Animated.View style={fillStyle} className="absolute left-0 top-0 h-full bg-primary-subtle" />

      <Text variant="label" className="text-center" tone="muted">
        {busy ? "Working…" : label}
      </Text>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={thumbStyle}
          className="absolute left-1 h-[52px] w-[52px] items-center justify-center rounded-full bg-primary"
        >
          <ChevronsRight size={22} color={color["primary-foreground"]} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
