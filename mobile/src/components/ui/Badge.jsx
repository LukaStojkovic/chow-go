import { View } from "react-native";
import { cn } from "@/lib/cn";
import { isTextual } from "@/lib/isTextual";
import { useTokens } from "@/theme/useTokens";
import { Text } from "./Text";

/**
 * A compact status tag.
 *
 * Used far more sparingly than it once was. A badge is a claim that something
 * is exceptional; when every row of a screen carries two of them, none of them
 * reads as anything. Most secondary information is better as plain grey text.
 *
 * The label always truncates to one line. Order status strings are written for
 * screen readers ("Courier on the way to the restaurant") and putting one of
 * those in a pill without a limit is what pushed text off the edge of cards.
 */
const TONES = {
  neutral: { view: "bg-muted", text: "text-muted-foreground", icon: "muted-foreground" },
  mint: { view: "bg-primary-subtle", text: "text-primary-subtle-foreground", icon: "primary" },
  citrus: { view: "bg-tertiary-subtle", text: "text-tertiary-subtle-foreground", icon: "tertiary" },
  info: { view: "bg-info-subtle", text: "text-info", icon: "info" },
  warning: { view: "bg-warning-subtle", text: "text-warning", icon: "warning" },
  danger: { view: "bg-destructive-subtle", text: "text-destructive", icon: "destructive" },
  // Solid fills, for badges over a photograph where a tint would vanish.
  solid: { view: "bg-primary", text: "text-primary-foreground", icon: "primary-foreground" },
  "solid-citrus": {
    view: "bg-tertiary",
    text: "text-tertiary-foreground",
    icon: "tertiary-foreground",
  },
  scrim: { view: "bg-card", text: "text-foreground", icon: "foreground" },
  dark: { view: "bg-foreground", text: "text-background", icon: "background" },
};

export function Badge({ children, tone = "neutral", icon: Icon, size = "md", className }) {
  const style = TONES[tone];
  const { color } = useTokens();
  const compact = size === "sm";

  return (
    <View
      className={cn(
        "shrink flex-row items-center self-start rounded-full",
        compact ? "gap-1 px-2.5 py-1" : "gap-1.5 px-3 py-1.5",
        style.view,
        className,
      )}
    >
      {Icon ? (
        <Icon size={compact ? 11 : 13} color={color[style.icon]} style={{ flexShrink: 0 }} />
      ) : null}
      {isTextual(children) ? (
        <Text variant="label-sm" numberOfLines={1} className={cn("shrink", style.text)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

// A live status: the small dot that fronts "On the way" or "Accepting orders".
export function StatusDot({ tone = "success", size = 7 }) {
  const TINTS = {
    success: "bg-primary-bright",
    warning: "bg-warning",
    danger: "bg-destructive",
    muted: "bg-muted-foreground",
  };
  return <View style={{ width: size, height: size }} className={cn("rounded-full", TINTS[tone])} />;
}
