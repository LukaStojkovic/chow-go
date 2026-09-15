import {
  Easing,
  LinearTransition,
  ReduceMotion,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useMotionStore } from "@/store/useMotionStore";

export const duration = {
  instant: 90,
  micro: 160,
  standard: 220,
  page: 300,
  panel: 340,
  image: 500,
};

export const curve = {
  standard: [0.22, 1, 0.36, 1],
  emphasized: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
  inOut: [0.45, 0, 0.15, 1],
};

export const ease = {
  standard: Easing.bezier(...curve.standard),
  emphasized: Easing.bezier(...curve.emphasized),
  exit: Easing.bezier(...curve.exit),
  inOut: Easing.bezier(...curve.inOut),
};

export const spring = {
  press: { duration: 340, dampingRatio: 0.7 },
  snappy: { duration: 320, dampingRatio: 0.85 },
  sheet: { duration: 420, dampingRatio: 0.86, clamp: { min: 0 } },
  dismiss: { duration: 280, dampingRatio: 1 },
  pop: { duration: 400, dampingRatio: 0.55 },
  settle: { duration: 460, dampingRatio: 1 },
};

export const pressScale = { icon: 0.92, control: 0.97, card: 0.985 };
export const travel = { page: 14, item: 12, edge: 20 };
export const stagger = { step: 45, max: 6 };
export const gesture = { dismissDistance: 110, flickVelocity: 900, completeRatio: 0.75 };

export function staggerDelay(index = 0) {
  return Math.min(Math.max(index, 0), stagger.max) * stagger.step;
}

function make(mode, isReduced) {
  const timing = {
    instant: { duration: duration.instant, easing: ease.standard, reduceMotion: mode },
    micro: { duration: duration.micro, easing: ease.standard, reduceMotion: mode },
    standard: { duration: duration.standard, easing: ease.standard, reduceMotion: mode },
    page: { duration: duration.page, easing: ease.emphasized, reduceMotion: mode },
    panel: { duration: duration.panel, easing: ease.emphasized, reduceMotion: mode },
    exit: { duration: duration.micro, easing: ease.exit, reduceMotion: mode },
  };

  const springs = {
    press: { ...spring.press, reduceMotion: mode },
    snappy: { ...spring.snappy, reduceMotion: mode },
    sheet: { ...spring.sheet, reduceMotion: mode },
    dismiss: { ...spring.dismiss, reduceMotion: mode },
    pop: { ...spring.pop, reduceMotion: mode },
    settle: { ...spring.settle, reduceMotion: mode },
  };

  const crossFade = {
    duration: duration.micro,
    easing: ease.standard,
    reduceMotion: ReduceMotion.Never,
  };

  const fadeIn = (delay = 0) =>
    function entering() {
      "worklet";
      return {
        initialValues: { opacity: 0 },
        animations: { opacity: withDelay(delay, withTiming(1, crossFade)) },
      };
    };

  const fadeOut = () =>
    function exiting() {
      "worklet";
      return {
        initialValues: { opacity: 1 },
        animations: { opacity: withTiming(0, crossFade) },
      };
    };

  const slideIn = ({ dy = 0, dx = 0, from = 1, delay = 0, config = timing.standard }) =>
    function entering() {
      "worklet";
      return {
        initialValues: {
          opacity: 0,
          transform: [{ translateY: dy }, { translateX: dx }, { scale: from }],
        },
        animations: {
          opacity: withDelay(delay, withTiming(1, config)),
          transform: [
            { translateY: withDelay(delay, withTiming(0, config)) },
            { translateX: withDelay(delay, withTiming(0, config)) },
            { scale: withDelay(delay, withTiming(1, config)) },
          ],
        },
      };
    };

  const slideOut = ({ dy = 0, dx = 0, to = 1, config = timing.exit }) =>
    function exiting() {
      "worklet";
      return {
        initialValues: {
          opacity: 1,
          transform: [{ translateY: 0 }, { translateX: 0 }, { scale: 1 }],
        },
        animations: {
          opacity: withTiming(0, config),
          transform: [
            { translateY: withTiming(dy, config) },
            { translateX: withTiming(dx, config) },
            { scale: withTiming(to, config) },
          ],
        },
      };
    };

  const springIn = ({ from = 0.7, delay = 0 }) =>
    function entering() {
      "worklet";
      return {
        initialValues: { opacity: 0, transform: [{ scale: from }] },
        animations: {
          opacity: withDelay(delay, withTiming(1, timing.micro)),
          transform: [{ scale: withDelay(delay, withSpring(1, springs.pop)) }],
        },
      };
    };

  const enter = isReduced
    ? {
        page: (delay = 0) => fadeIn(delay),
        content: (delay = 0) => fadeIn(delay),
        item: (index = 0) => fadeIn(staggerDelay(index)),
        pop: (delay = 0) => fadeIn(delay),
        panel: () => fadeIn(0),
        top: () => fadeIn(0),
        bottom: () => fadeIn(0),
      }
    : {
        page: (delay = 0) => slideIn({ dy: travel.page, from: 0.98, delay, config: timing.page }),
        content: (delay = 0) => slideIn({ dy: travel.item, delay }),
        item: (index = 0) => slideIn({ dy: travel.item, delay: staggerDelay(index) }),
        pop: (delay = 0) => springIn({ delay }),
        panel: () => slideIn({ dy: travel.edge * 2, config: timing.panel }),
        top: () => slideIn({ dy: -travel.edge, config: timing.standard }),
        bottom: () => slideIn({ dy: travel.edge, config: timing.standard }),
      };

  const exit = isReduced
    ? {
        page: () => fadeOut(),
        content: () => fadeOut(),
        item: () => fadeOut(),
        pop: () => fadeOut(),
        panel: () => fadeOut(),
        top: () => fadeOut(),
        bottom: () => fadeOut(),
      }
    : {
        page: () => slideOut({ dy: -travel.item, to: 0.98 }),
        content: () => slideOut({ dy: travel.item }),
        item: () => slideOut({ to: 0.96 }),
        pop: () => slideOut({ to: 0.7 }),
        panel: () => slideOut({ dy: travel.edge * 2 }),
        top: () => slideOut({ dy: -travel.edge }),
        bottom: () => slideOut({ dy: travel.edge }),
      };

  const layout = isReduced
    ? LinearTransition.duration(0).reduceMotion(ReduceMotion.Always)
    : LinearTransition.duration(duration.standard).easing(ease.standard).reduceMotion(mode);

  return Object.freeze({
    mode,
    isReduced,
    duration,
    ease,
    timing,
    spring: springs,
    press: pressScale,
    travel,
    gesture,
    enter,
    exit,
    layout,
    crossFade,
  });
}

const MOTION = {
  full: make(ReduceMotion.Never, false),
  reduced: make(ReduceMotion.Always, true),
  systemOn: make(ReduceMotion.System, true),
  systemOff: make(ReduceMotion.System, false),
};

export function motionFor(preference, systemReduced) {
  if (preference === "full") return MOTION.full;
  if (preference === "reduced") return MOTION.reduced;
  return systemReduced ? MOTION.systemOn : MOTION.systemOff;
}

export function useMotion() {
  const preference = useMotionStore((state) => state.preference);
  const systemReduced = useMotionStore((state) => state.systemReduced);
  return motionFor(preference, systemReduced);
}

export function currentMotion() {
  const { preference, systemReduced } = useMotionStore.getState();
  return motionFor(preference, systemReduced);
}
