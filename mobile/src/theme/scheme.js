import { Appearance } from "react-native";
import { colorScheme } from "nativewind";

/**
 * Imperative colour-scheme control, usable outside React.
 *
 * NativeWind's `setColorScheme` goes through the native Appearance module and
 * only reaches JS again when the module echoes an `appearanceChanged` event
 * back, so the swap is never synchronous with the call. Anything that wants to
 * animate around it has to drive the call itself and wait for the echo.
 */

// Read before we ever set an override: from that point on RN's getColorScheme()
// reports our own override rather than the device setting.
let systemScheme = Appearance.getColorScheme() === "dark" ? "dark" : "light";
let overridden = false;

Appearance.addChangeListener((preferences) => {
  if (overridden) return;
  systemScheme = preferences.colorScheme === "dark" ? "dark" : "light";
});

export function resolveScheme(preference) {
  if (preference === "dark" || preference === "light") return preference;
  return systemScheme;
}

export function currentScheme() {
  return colorScheme.get() === "dark" ? "dark" : "light";
}

export function applyPreference(preference) {
  overridden = preference === "dark" || preference === "light";
  colorScheme.set(preference);
}
