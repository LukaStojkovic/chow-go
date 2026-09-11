import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/lib/cn";
import { useMotionStore } from "@/store/useMotionStore";

export function Skeleton({ className }) {
  const reduced = useMotionStore((state) => state.isReduced);
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    if (reduced) {
      pulse.value = 0.5;
      return;
    }
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [reduced, pulse]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View style={style}>
      <View className={cn("rounded-md bg-muted", className)} />
    </Animated.View>
  );
}
