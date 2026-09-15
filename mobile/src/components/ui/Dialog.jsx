import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  FadeIn,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";
import { gesture as gestureTokens, useMotion } from "@/theme/motion";
import { IconTile } from "./IconTile";
import { Text } from "./Text";

/** How far down the sheet has to travel before letting go dismisses it. */
const DISMISS_AT = gestureTokens.dismissDistance;
/** A flick dismisses regardless of distance, in points per second. */
const FLICK_VELOCITY = gestureTokens.flickVelocity;
/** Fallback travel for a dismissal fired before the sheet has been measured. */
const UNMEASURED_HEIGHT = 400;

/**
 * A confirmation, presented as a sheet from the bottom edge.
 *
 * Bottom rather than centred because every one of these is answered with a
 * thumb, and a centred dialog puts its buttons where a thumb is not.
 *
 * The sheet is draggable. It always had a grab handle, which is a promise -
 * and the promise was false: the handle sat there implying a gesture that did
 * nothing, so the only ways out were the backdrop and the cancel button.
 * Dragging down past `DISMISS_AT`, or flicking, closes it; anything short of
 * that springs back. The backdrop fades with the drag so the gesture reports
 * its own progress rather than leaving the user to guess how far is far enough.
 *
 * The entrance and the drag live on two different nodes on purpose: a layout
 * animation and a `useAnimatedStyle` transform on the same view fight over the
 * same property, and the loser is whichever one the user is looking at.
 *
 * Drag is off under reduce-motion, where a sheet that tracks the finger is
 * exactly the movement the setting asks us not to make. The backdrop and the
 * buttons still close it.
 */
export function Sheet({ visible, onClose, icon, tone = "danger", title, description, children }) {
  const insets = useSafeAreaInsets();
  const motion = useMotion();
  const reduced = motion.isReduced;
  const [height, setHeight] = useState(0);

  const offset = useSharedValue(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // A sheet reopened after being dragged away would otherwise come back already
  // pushed down - or, worse, still off-screen.
  useEffect(() => {
    if (visible) {
      cancelAnimation(offset);
      offset.value = 0;
    }
  }, [visible, offset]);

  const done = useCallback(() => {
    onCloseRef.current?.();
  }, []);

  // Every way out leaves the same way: the backdrop, the cancel button and the
  // drag all carry the sheet off the bottom edge rather than letting one of
  // them blink out while the others slide.
  const close = useCallback(
    (velocity = 0) => {
      if (reduced) {
        done();
        return;
      }
      cancelAnimation(offset);
      offset.value = withSpring(
        height || UNMEASURED_HEIGHT,
        { ...motion.spring.dismiss, velocity },
        (finished) => {
          "worklet";
          if (finished) runOnJS(done)();
        },
      );
    },
    [done, height, motion, offset, reduced],
  );

  const dismissSpring = { ...motion.spring.dismiss };
  const settleSpring = { ...motion.spring.sheet };
  const travel = height || UNMEASURED_HEIGHT;

  const pan = Gesture.Pan()
    .enabled(!reduced)
    // Vertical only: a horizontal swipe belongs to whatever is behind this.
    .activeOffsetY(8)
    .failOffsetX([-16, 16])
    // Grabbing the sheet mid-flight takes it over at wherever it has got to,
    // instead of the finger and a still-running spring fighting for the same
    // value. This is what lets a dismissal be caught and reversed.
    .onBegin(() => {
      cancelAnimation(offset);
    })
    .onChange((event) => {
      // Downwards only. Dragging up would lift the sheet off the bottom edge
      // and open a gap it never fills.
      offset.value = Math.max(0, offset.value + event.changeY);
    })
    .onEnd((event) => {
      if (offset.value > DISMISS_AT || event.velocityY > FLICK_VELOCITY) {
        // Carry it off-screen at the speed it was thrown, rather than at a
        // fixed rate that ignores the gesture. The whole release stays on the
        // UI thread; only the unmount crosses back to JS.
        offset.value = withSpring(
          travel,
          { ...dismissSpring, velocity: event.velocityY },
          (finished) => {
            if (finished) runOnJS(done)();
          },
        );
        return;
      }
      offset.value = withSpring(0, { ...settleSpring, velocity: event.velocityY });
    });

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  // Most of the backdrop is gone by the time the sheet is two thirds of the
  // way out, so the screen behind is already returning during the drag - but it
  // still reaches zero, so a completed dismissal has nothing left to snap away
  // when the modal unmounts.
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: height
      ? interpolate(offset.value, [0, height * 0.6, height], [1, 0.45, 0], "clamp")
      : 1,
  }));

  // The modal itself does not animate: the backdrop and the sheet own both
  // halves of the transition, and a native fade over the top of them would
  // cross-fade a movement that is already being animated.
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => close(0)}>
      {/* A Modal is its own native view hierarchy on Android, mounted outside
          the root provider in app/_layout.jsx - so a gesture in here never
          reaches the handler without a second root. It fails silently, which is
          the worst way for a gesture to be wrong. */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          entering={FadeIn.duration(motion.duration.micro).reduceMotion(motion.mode)}
          className="flex-1 justify-end"
        >
          <Animated.View style={backdropStyle} className="absolute inset-0">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss"
              onPress={() => close(0)}
              className="flex-1 bg-black/55"
            />
          </Animated.View>

          <GestureDetector gesture={pan}>
            <Animated.View
              onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
              style={dragStyle}
            >
              <Animated.View
                entering={motion.enter.panel()}
                style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                className="gap-4 rounded-t-3xl bg-popover px-5 pt-3"
              >
                {/* Decoration, not a control: the gesture is on the whole
                    sheet, so a grab target here would only shrink it. */}
                <View className="items-center py-1" accessible={false}>
                  <View className="h-1 w-10 rounded-full bg-border-strong" />
                </View>

                <View className="items-center gap-3">
                  {icon ? <IconTile icon={icon} tone={tone} size={56} round /> : null}
                  <View className="items-center gap-1.5">
                    <Text variant="h1" className="text-center">
                      {title}
                    </Text>
                    {description ? (
                      <Text variant="body" tone="muted" className="text-center">
                        {description}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {children}
              </Animated.View>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

// The action stack every sheet ends with: the decision, then the way out.
export function SheetActions({ children, className }) {
  return <View className={cn("gap-2.5 pt-1", className)}>{children}</View>;
}
