import { Text as RNText } from "react-native";
import { cn } from "@/lib/cn";
import { TABULAR_VARIANTS, TEXT_VARIANTS } from "@/theme/typography";

export function Text({ variant = "body", tone = "foreground", className, style, ...props }) {
  const tones = {
    foreground: "text-foreground",
    muted: "text-muted-foreground",
    primary: "text-primary",
    destructive: "text-destructive",
    success: "text-success",
    warning: "text-warning",
    info: "text-info",
    scrim: "text-scrim-foreground",
    inverse: "text-primary-foreground",
  };

  return (
    <RNText
      className={cn(TEXT_VARIANTS[variant], tones[tone], className)}
      style={[TABULAR_VARIANTS.has(variant) && { fontVariant: ["tabular-nums"] }, style]}
      {...props}
    />
  );
}
