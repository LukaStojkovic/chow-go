import { useCallback, useEffect, useRef } from "react";
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
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { useThemeStore } from "@/store/useThemeStore";
import { applyPreference, currentScheme, resolveScheme } from "@/theme/scheme";
import { colors, easing } from "@/theme/tokens";

/**
 * Theme host, and the cross-fade that covers a scheme swap.
 *
 * A swap is neither instant nor cheap. The call has to travel out through the
 * native Appearance module and come back as an `appearanceChanged` event
 * before NativeWind hears about it - on Android by way of a uiMode
 * configuration change - and that echo then re-renders every styled node on
 * screen in a single commit. Bare, a tap on the appearance control buys a beat
 * of nothing at all followed by a hard snap.
 *
 * So the veil goes up first, in the same tick as the tap, which is why the
 * store is subscribed to directly rather than read as state: an effect on
 * `preference` would spend a render pass before the animation could start. The
 * scheme is applied once the veil is opaque, the echo and the re-render happen
 * out of sight, and the veil lifts on the frame after the new theme commits.
 * Reanimated runs the fade on the UI thread, so it stays smooth while the JS
 * thread is busy re-rendering the tree underneath it.
 *
 * The veil is painted in the *outgoing* background and never recoloured, so the
 * two halves read as one dissolve from the old canvas to the new one.
 *
 * It is a fade with no movement in it, so it survives reduced motion for the
 * same reason the web keeps its colour and opacity transitions there.
 *
 * Only one apply may be outstanding at a time. Two taps in quick succession
 * would otherwise put two overrides on the wire and the echoes can come back
 * in either order, leaving the app on a scheme nobody asked for; instead the
 * later tap waits under the veil for the first echo and is issued after it.
 */
const FADE_IN = { duration: 110, easing: Easing.bezier(...easing.exit) };
const FADE_OUT = { duration: 210, easing: Easing.bezier(...easing.standard) };

// The echo can go missing - a preference that resolves to the scheme already
// on screen, a device change under an override - and the veil still has to
// come down.
const ECHO_TIMEOUT = 600;

export function ThemeProvider({ children }) {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";

  const opacity = useSharedValue(0);
  const veil = useSharedValue(colors[scheme].background);
  const request = useRef(null); // the tap we still owe a swap to
  const inFlight = useRef(false); // an apply is out, waiting on its echo

  const lift = useCallback(() => {
    if (request.current) clearTimeout(request.current.timer);
    request.current = null;
    opacity.value = withTiming(0, FADE_OUT);
  }, [opacity]);

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
      else veil.value = colors[currentScheme()].background;
      request.current = { preference, target, timer: setTimeout(bail, ECHO_TIMEOUT) };

      if (opacity.value >= 1) {
        if (!inFlight.current) issue();
        return;
      }

      cancelAnimation(opacity);
      opacity.value = withTiming(1, FADE_IN, (finished) => {
        if (finished) runOnJS(issue)();
      });
    },
    [bail, issue, opacity, veil],
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
    // veil starts dissolving off it.
    const frame = requestAnimationFrame(lift);
    return () => cancelAnimationFrame(frame);
  }, [scheme, issue, lift]);

  const veilStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: veil.value,
  }));

  return (
    <View style={styles.host}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      {children}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, veilStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({ host: { flex: 1 } });
