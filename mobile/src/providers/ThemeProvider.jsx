import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useColorScheme } from "nativewind";
import { BlurView } from "expo-blur";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { useThemeStore } from "@/store/useThemeStore";
import { applyPreference, currentScheme, resolveScheme } from "@/theme/scheme";
import { curve, duration as motionDuration } from "@/theme/motion";
import { colors } from "@/theme/tokens";

/**
 * Theme host, and the defocus that covers a scheme swap.
 *
 * A swap is neither instant nor cheap. The call has to travel out through the
 * native Appearance module and come back as an `appearanceChanged` event
 * before NativeWind hears about it - on Android by way of a uiMode
 * configuration change - and that echo then re-renders every styled node on
 * screen in a single commit. Bare, a tap on the appearance control buys a beat
 * of nothing at all followed by a hard snap.
 *
 * So something has to cover the gap, and the question is what. An opaque veil
 * hides the snap by hiding the app: the screen goes blank, then comes back in
 * the other theme, and the beat reads as a load rather than a change. Instead
 * the screen defocuses - the blur comes up, the colours change *behind* it in
 * full view, and it sharpens again. Nothing is ever hidden, and the recolour
 * itself is the thing you watch.
 *
 * The blur is tinted toward the scheme being switched *to*, so the first half
 * reads as a wash toward the destination and the second half has nothing left
 * to show: by the time it clears, the frost and the new canvas are the same
 * colour.
 *
 * It goes up in the same tick as the tap, which is why the store is subscribed
 * to directly rather than read as state: an effect on `preference` would spend
 * a render pass before the animation could start. The scheme is applied once
 * the blur is at full strength, the echo and the re-render happen behind it,
 * and it clears on the frame after the new theme commits.
 *
 * What animates is the pane's opacity, not the blur's `intensity`. Intensity
 * is a prop on expo-blur's inner native view, so driving it means a prop
 * update per frame on the JS thread - which is the one thread that is
 * guaranteed to be busy here, restyling every node in the tree. Opacity is a
 * transform Reanimated owns outright on the UI thread, and it keeps the
 * transition at frame rate no matter how long the re-render takes.
 *
 * Nothing moves, so it survives reduced motion for the same reason the web
 * keeps its colour and opacity transitions there.
 *
 * On Android the blur is left as expo-blur's `none` method, which renders a
 * tinted translucent pane rather than a real blur: a live full-screen blur
 * there costs more frames than the transition is worth, and a translucent
 * wash reads the same way at this duration.
 *
 * Only one apply may be outstanding at a time. Two taps in quick succession
 * would otherwise put two overrides on the wire and the echoes can come back
 * in either order, leaving the app on a scheme nobody asked for; instead the
 * later tap waits behind the blur for the first echo and is issued after it.
 */
const BLUR_INTENSITY = 64;
const FADE_IN = { duration: 140, easing: Easing.bezier(...curve.exit) };
const FADE_OUT = { duration: motionDuration.panel, easing: Easing.bezier(...curve.standard) };

// The echo can go missing - a preference that resolves to the scheme already
// on screen, a device change under an override - and the blur still has to
// clear.
const ECHO_TIMEOUT = 600;

export function ThemeProvider({ children }) {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";

  const progress = useSharedValue(0);
  // The blur pane is mounted only while a swap is in flight. A full-screen
  // visual effect view left in the tree costs compositing on every frame the
  // app draws, for the sake of a transition that runs for half a second.
  const [covering, setCovering] = useState(null);
  const request = useRef(null); // the tap we still owe a swap to
  const inFlight = useRef(false); // an apply is out, waiting on its echo

  const uncover = useCallback(() => setCovering(null), []);

  const lift = useCallback(() => {
    if (request.current) clearTimeout(request.current.timer);
    request.current = null;
    progress.value = withTiming(0, FADE_OUT, (finished) => {
      if (finished) runOnJS(uncover)();
    });
  }, [progress, uncover]);

  const bail = useCallback(() => {
    inFlight.current = false;
    lift();
  }, [lift]);

  const issue = useCallback(() => {
    const pending = request.current;
    if (!pending) return;
    clearTimeout(pending.timer);
    pending.timer = setTimeout(bail, ECHO_TIMEOUT);
    inFlight.current = true;
    applyPreference(pending.preference);
  }, [bail]);

  const swap = useCallback(
    (preference) => {
      const target = resolveScheme(preference);

      // Nothing to cover: the scheme on screen already matches and no swap is
      // in flight that could move it. "Match device" while the device agrees.
      if (!request.current && !inFlight.current && target === currentScheme()) {
        applyPreference(preference);
        return;
      }

      if (request.current) clearTimeout(request.current.timer);
      request.current = { preference, target, timer: setTimeout(bail, ECHO_TIMEOUT) };
      setCovering(target);

      if (progress.value >= 1) {
        if (!inFlight.current) issue();
        return;
      }

      cancelAnimation(progress);
      progress.value = withTiming(1, FADE_IN, (finished) => {
        if (finished) runOnJS(issue)();
      });
    },
    [bail, issue, progress],
  );

  useEffect(
    () =>
      useThemeStore.subscribe((state, previous) => {
        if (state.preference !== previous.preference) swap(state.preference);
      }),
    [swap],
  );

  // The window background sits outside the React tree, so overscroll would
  // flash white in dark mode without this.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors[scheme].background);
  }, [scheme]);

  useEffect(() => {
    inFlight.current = false;
    if (!request.current) return;

    // Not what was asked for - a tap landed while this echo was on the wire.
    if (request.current.target !== scheme) {
      issue();
      return;
    }

    // One frame of slack lets the restyled tree reach the screen before the
    // blur starts clearing off it.
    const frame = requestAnimationFrame(lift);
    return () => cancelAnimationFrame(frame);
  }, [scheme, issue, lift]);

  const paneStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <View style={styles.host}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {children}
      {covering ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, paneStyle]}>
          <BlurView tint={covering} intensity={BLUR_INTENSITY} style={StyleSheet.absoluteFill} />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ host: { flex: 1 } });
