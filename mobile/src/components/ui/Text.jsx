import { Text as RNText } from "react-native";
import { cn } from "@/lib/cn";
import { TABULAR_VARIANTS, TEXT_VARIANTS } from "@/theme/typography";

const TONES = {
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  primary: "text-primary",
  tertiary: "text-tertiary-subtle-foreground",
  destructive: "text-destructive",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  scrim: "text-scrim-foreground",
  "scrim-muted": "text-scrim-foreground-muted",
  inverse: "text-primary-foreground",
};

export function Text({ variant = "body", tone = "foreground", className, style, ...props }) {
  return (
    <RNText
      className={cn(TEXT_VARIANTS[variant], TONES[tone], className)}
      style={[TABULAR_VARIANTS.has(variant) && { fontVariant: ["tabular-nums"] }, style]}
      {...props}
    />
  );
}
