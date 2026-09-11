import { View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";

/**
 * The bar that hovers over the bottom of a screen: the basket mini-bar, the
 * Place Order CTA, the courier "3 blocks away" strip.
 *
 * It floats clear of the screen edge rather than sitting flush against it, and
 * carries a green-tinted shadow, which together are what read as "this is
 * above everything else" rather than "this is the end of the page".
 *
 * The absolutely-positioned container is the animated one, and `entering` /
 * `exiting` are forwarded onto it. Wrapping this component in an Animated.View
 * instead would give the absolute child a zero-height parent to position
 * against, which Android clips.
 */
export function FloatingBar({
  children,
  className,
  tone = "dark",
  inset = true,
  style,
  entering,
  exiting,
  // Clearance for anything already occupying the bottom edge - in practice the
  // tab bar. Without it the bar sits on top of the navigation it is supposed
  // to float above.
  bottomOffset = 0,
}) {
  const { elevation, scheme } = useTokens();
  const insets = useSafeAreaInsets();

  const TONES = {
    dark: "bg-foreground",
    primary: "bg-primary",
    surface: "bg-card",
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      entering={entering}
      exiting={exiting}
      style={{
        paddingBottom: (bottomOffset || Math.max(insets.bottom, 12)) + (bottomOffset ? 10 : 0),
      }}
      className="absolute inset-x-0 bottom-0 px-4"
    >
      <View
        style={[tone === "surface" ? elevation.raised[scheme] : elevation.glow[scheme], style]}
        className={cn(
          "flex-row items-center rounded-full",
          inset && "gap-3 py-2.5 pl-3 pr-2.5",
          TONES[tone],
          className,
        )}
      >
        {children}
      </View>
    </Animated.View>
  );
}

/**
 * A plain docked footer for full-width actions - checkout totals, destructive
 * confirmations. Sits flush, blurs nothing, and keeps its own safe-area pad.
 */
export function DockedBar({ children, className }) {
  const insets = useSafeAreaInsets();
  const { elevation, scheme } = useTokens();

  return (
    <View
      style={[elevation.overlay[scheme], { paddingBottom: Math.max(insets.bottom, 16) }]}
      className={cn("gap-3 rounded-t-xl border-t border-border bg-card px-5 pt-4", className)}
    >
      {children}
    </View>
  );
}
