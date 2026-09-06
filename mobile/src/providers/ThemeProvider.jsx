import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { useThemeStore } from "@/store/useThemeStore";
import { colors } from "@/theme/tokens";

export function ThemeProvider({ children }) {
  const preference = useThemeStore((state) => state.preference);
  const { colorScheme, setColorScheme } = useColorScheme();

  // NativeWind follows Appearance itself in "system" mode, so it only ever
  // receives the three values it already understands.
  useEffect(() => {
    setColorScheme(preference);
  }, [preference, setColorScheme]);

  // The window background sits outside the React tree, so overscroll would
  // flash white in dark mode without this.
  useEffect(() => {
    const scheme = colorScheme === "dark" ? "dark" : "light";
    SystemUI.setBackgroundColorAsync(colors[scheme].background);
  }, [colorScheme]);

  return (
    <>
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      {children}
    </>
  );
}
