import { View } from "react-native";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";

/**
 * The rounded squircle that fronts a row or a card header. Used for settings
 * rows, the courier/wallet/rewards tiles, the "Estimated Delivery" bike icon -
 * anywhere an icon needs to feel like an object rather than a glyph.
 */
const TONES = {
  muted: { view: "bg-muted", icon: "foreground" },
  mint: { view: "bg-primary-subtle", icon: "primary" },
  citrus: { view: "bg-tertiary-subtle", icon: "tertiary" },
  info: { view: "bg-info-subtle", icon: "info" },
  warning: { view: "bg-warning-subtle", icon: "warning" },
  danger: { view: "bg-destructive-subtle", icon: "destructive" },
  primary: { view: "bg-primary", icon: "primary-foreground" },
};

export function IconTile({ icon: Icon, tone = "muted", size = 40, round = false, className }) {
  const style = TONES[tone];
  const { color } = useTokens();

  return (
    <View
      style={{ width: size, height: size }}
      className={cn(
        "items-center justify-center",
        round ? "rounded-full" : "rounded-sm",
        style.view,
        className,
      )}
    >
      <Icon size={Math.round(size * 0.48)} color={color[style.icon]} />
    </View>
  );
}
