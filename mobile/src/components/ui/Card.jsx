import { Pressable, View } from "react-native";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";

/**
 * The white surface everything sits on.
 *
 * Cards separate from the blue-cast canvas by elevation rather than a border,
 * which is what keeps the layout feeling airy instead of ruled. A hairline
 * border is still available via `bordered` for the rare card that sits on
 * another card, where a shadow has nothing to cast onto.
 */
export function Card({ className, elevation = "subtle", bordered = false, style, ...props }) {
  const { elevation: shadows, scheme } = useTokens();
  const shadow = elevation === "none" ? null : shadows[elevation][scheme];

  return (
    <View
      style={[shadow, style]}
      className={cn("rounded-lg bg-card p-4", bordered && "border border-border", className)}
      {...props}
    />
  );
}

// Same surface, pressable. Dips slightly instead of fading so the shadow stays.
export function PressableCard({ className, elevation = "subtle", onPress, style, ...props }) {
  const { elevation: shadows, scheme } = useTokens();
  const shadow = elevation === "none" ? null : shadows[elevation][scheme];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[shadow, style]}
      className={cn("rounded-lg bg-card p-4 active:opacity-80", className)}
      {...props}
    />
  );
}

/**
 * A recessed tile *inside* a card - the icon squares, the promo strip in a
 * restaurant header, the PIN block on the tracking screen. Reads as carved out
 * of the card rather than floating on it, so it never takes a shadow.
 */
export function Inset({ className, tone = "muted", ...props }) {
  const TONES = {
    muted: "bg-muted",
    mint: "bg-primary-subtle",
    citrus: "bg-tertiary-subtle",
    info: "bg-info-subtle",
    warning: "bg-warning-subtle",
    danger: "bg-destructive-subtle",
  };
  return <View className={cn("rounded-md p-3", TONES[tone], className)} {...props} />;
}
