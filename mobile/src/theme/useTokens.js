import { useColorScheme } from "nativewind";
import { colors, elevation } from "./tokens";

// One frozen bundle per scheme, built once. Every Card, Button and Input on a
// screen calls this on every render, and a fresh object each time would defeat
// the memoisation of anything downstream that takes a token as a dependency.
const BUNDLES = {
  light: { scheme: "light", isDark: false, color: colors.light, elevation, raw: elevation },
  dark: { scheme: "dark", isDark: true, color: colors.dark, elevation, raw: elevation },
};

// For APIs that take a colour value rather than a className.
export function useTokens() {
  const { colorScheme } = useColorScheme();
  return colorScheme === "dark" ? BUNDLES.dark : BUNDLES.light;
}
