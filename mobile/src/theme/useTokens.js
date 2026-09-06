import { useColorScheme } from "nativewind";
import { colors, elevation } from "./tokens";

// For APIs that take a colour value rather than a className.
export function useTokens() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === "dark" ? "dark" : "light";
  return { scheme, isDark: scheme === "dark", color: colors[scheme], elevation, raw: elevation };
}
