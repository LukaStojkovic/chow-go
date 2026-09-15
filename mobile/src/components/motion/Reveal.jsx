import { useState } from "react";
import Animated from "react-native-reanimated";
import { useMotion } from "@/theme/motion";

export function Reveal({ delay = 0, children, ...props }) {
  const motion = useMotion();
  const [entering] = useState(() => motion.enter.page(delay));
  return (
    <Animated.View entering={entering} {...props}>
      {children}
    </Animated.View>
  );
}

export function RevealSection({ delay = 0, children, ...props }) {
  const motion = useMotion();
  const [entering] = useState(() => motion.enter.content(delay));
  return (
    <Animated.View entering={entering} {...props}>
      {children}
    </Animated.View>
  );
}

export function RevealItem({ index = 0, limit = 8, children, ...props }) {
  const motion = useMotion();
  const [entering] = useState(() => (index <= limit ? motion.enter.item(index) : undefined));
  return (
    <Animated.View entering={entering} {...props}>
      {children}
    </Animated.View>
  );
}
