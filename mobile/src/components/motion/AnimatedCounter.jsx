import { useEffect, useRef } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Text } from "@/components/ui/Text";
import { useMotion } from "@/theme/motion";

const POP_TO = 1.3;

export function AnimatedCounter({ value, variant = "caption", className, style, ...props }) {
  const motion = useMotion();
  const previous = useRef(value);
  const pop = useSharedValue(1);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    if (motion.isReduced) return;
    cancelAnimation(pop);
    pop.value = withSequence(
      withTiming(POP_TO, motion.timing.instant),
      withSpring(1, motion.spring.pop),
    );
  }, [value, motion, pop]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  return (
    <Animated.View style={[animated, style]} {...props}>
      <Text variant={variant} className={className} style={{ fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
    </Animated.View>
  );
}
