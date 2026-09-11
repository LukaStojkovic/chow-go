import { useMemo } from "react";
import { useTokens } from "./useTokens";

/**
 * Colours for a pull-to-refresh spinner.
 *
 * Left alone, Android draws a black arrow on a white puck whatever the theme
 * is, and iOS a fixed grey - both of which sit on the app's dark background
 * looking like something that failed to load.
 *
 * This is a hook returning props rather than a wrapped `<RefreshControl>`
 * component, deliberately: on Android, ScrollView *clones* the element passed
 * to `refreshControl` and hands it the entire scroll view as children. A
 * wrapper that rendered its own RefreshControl would drop those children on
 * the floor and blank the screen.
 */
export function useRefreshTint() {
  const { color } = useTokens();

  return useMemo(
    () => ({
      // Android: the arrow, then the disc it spins on.
      colors: [color.primary],
      progressBackgroundColor: color.card,
      // iOS: the whole spinner.
      tintColor: color.primary,
    }),
    [color],
  );
}
