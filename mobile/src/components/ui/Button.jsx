import { ActivityIndicator, Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/cn";
import { Text } from "./Text";

const VARIANTS = {
  primary: { view: "bg-primary active:bg-primary-hover", label: "text-primary-foreground" },
  secondary: { view: "bg-secondary active:opacity-80", label: "text-secondary-foreground" },
  outline: {
    view: "border border-border-strong bg-transparent active:bg-accent",
    label: "text-foreground",
  },
  ghost: { view: "bg-transparent active:bg-accent", label: "text-foreground" },
  destructive: { view: "bg-destructive active:opacity-90", label: "text-destructive-foreground" },
};

const SIZES = {
  sm: { view: "h-9 px-3 rounded-sm", text: "body-sm" },
  md: { view: "h-11 px-4 rounded-sm", text: "label" },
  lg: { view: "h-14 px-5 rounded-md", text: "body-lg" },
};

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  haptic = true,
  className,
  ...props
}) {
  const isInactive = disabled || loading;
  const styles = VARIANTS[variant];
  const sizing = SIZES[size];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: loading }}
      disabled={isInactive}
      onPress={(event) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(event);
      }}
      className={cn(
        "flex-row items-center justify-center gap-2",
        styles.view,
        sizing.view,
        isInactive && "opacity-50",
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <View className="flex-row items-center gap-2">
          {typeof children === "string" ? (
            <Text variant={sizing.text} className={styles.label}>
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </Pressable>
  );
}
