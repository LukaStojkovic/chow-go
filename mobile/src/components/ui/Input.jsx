import { forwardRef, useState } from "react";
import { TextInput, View } from "react-native";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";
import { Text } from "./Text";

export const Input = forwardRef(function Input(
  { label, error, hint, className, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const { color } = useTokens();

  return (
    <View className="gap-1.5">
      {label ? (
        <Text variant="label" tone={error ? "destructive" : "foreground"}>
          {label}
        </Text>
      ) : null}

      <TextInput
        ref={ref}
        placeholderTextColor={color["muted-foreground"]}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={cn(
          "h-12 rounded-sm border bg-card px-3 font-sans text-body text-foreground",
          error ? "border-destructive" : focused ? "border-ring" : "border-input",
          className,
        )}
        accessibilityLabel={label}
        {...props}
      />

      {error ? (
        <Text variant="caption" tone="destructive">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
