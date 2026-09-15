import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { cn } from "@/lib/cn";
import { useMotion } from "@/theme/motion";
import { useTokens } from "@/theme/useTokens";

const SWEEP_MS = 1150;
const BAND = 0.55;

export function Skeleton({ className, shimmer = true, style }) {
  const motion = useMotion();
  const { isDark } = useTokens();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);
  const active = shimmer && !motion.isReduced && width > 0;

  useEffect(() => {
    if (!active) {
      cancelAnimation(progress);
      progress.value = 0;
      return;
    }
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, {
        duration: SWEEP_MS,
        easing: Easing.inOut(Easing.ease),
        reduceMotion: ReduceMotion.Never,
      }),
      -1,
      false,
    );
    return () => cancelAnimation(progress);
  }, [active, progress]);

  const band = width * BAND;
  const sweep = useAnimatedStyle(() => ({
    transform: [{ translateX: -band + progress.value * (width + band) }],
  }));

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={style}
      className={cn("overflow-hidden rounded-md bg-muted", className)}
    >
      {active ? (
        <Animated.View
          pointerEvents="none"
          style={[sweep, { position: "absolute", top: 0, bottom: 0, width: band }]}
        >
          <LinearGradient
            colors={
              isDark
                ? ["rgba(255,255,255,0)", "rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]
                : ["rgba(255,255,255,0)", "rgba(255,255,255,0.85)", "rgba(255,255,255,0)"]
            }
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
