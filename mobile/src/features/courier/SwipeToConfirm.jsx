import { useCallback, useEffect, useState } from "react";
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

const THUMB = 56;
const COMPLETE_AT = 0.75;

/**
 * A slider rather than a button, for the steps that cannot be undone.
 *
 * Marking an order picked up or delivered is irreversible and happens on a
 * phone held one-handed, often in the rain. A misplaced tap costs a support
 * call; a misplaced swipe does not happen.
 *
 * The track fills green behind the thumb as it travels, so the gesture reports
 * its own progress instead of relying on the courier to judge the distance.
 *
 * The thumb parks at the end while the confirm is in flight and springs back
 * once it settles - `onConfirm` is awaited, so a failed request returns a
 * usable control instead of a slider stuck at 100% with nothing to show for it.
 */
export function SwipeToConfirm({ label, onConfirm, disabled, busy }) {
  const { color, elevation, scheme } = useTokens();
  const [width, setWidth] = useState(0);

  const offset = useSharedValue(0);
  const travel = Math.max(0, width - THUMB - 8);

  const reset = useCallback(() => {
    offset.value = withSpring(0);
  }, [offset]);

  const finish = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await onConfirm?.();
    } finally {
      reset();
    }
  }, [onConfirm, reset]);

  // The step that was just confirmed is replaced by the next one, and the same
  // component instance carries it. Without this the second leg would open with
  // the thumb already at the far end.
  useEffect(() => {
    offset.value = withSpring(0);
  }, [label, offset]);

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
  // The label fades as the thumb passes over it rather than being covered.
  const labelStyle = useAnimatedStyle(() => ({
    opacity: travel > 0 ? 1 - Math.min(1, offset.value / (travel * 0.7)) : 1,
  }));

  return (
    <View
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        setWidth(next);
        // A rotation mid-swipe would otherwise leave the thumb parked past the
        // end of a now-shorter track.
        offset.value = Math.min(offset.value, Math.max(0, next - THUMB - 8));
      }}
      style={elevation.glow[scheme]}
      className={`h-16 justify-center overflow-hidden rounded-full bg-muted ${
        disabled ? "opacity-50" : ""
      }`}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityHint="Swipe right to confirm"
      // Swiping a thumb across a track is not something a screen reader can
      // drive, so assistive tech gets the same action as a direct call.
      accessibilityActions={[{ name: "increment" }, { name: "activate" }]}
      onAccessibilityAction={() => {
        if (!disabled && !busy) finish();
      }}
    >
      <Animated.View style={fillStyle} className="absolute left-0 top-0 h-full bg-primary-subtle" />

      <Animated.View style={labelStyle}>
        <Text variant="label" tone="primary" className="text-center">
          {busy ? "Working…" : label}
        </Text>
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={thumbStyle}
          className="absolute left-1 h-14 w-14 items-center justify-center rounded-full bg-primary"
        >
          <ChevronsRight size={24} strokeWidth={2.6} color={color["primary-foreground"]} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
