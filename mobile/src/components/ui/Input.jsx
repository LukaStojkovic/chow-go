import { forwardRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Search } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";
import { Text } from "./Text";

/**
 * Form field. Fills with the muted blue-grey at rest and lifts to white with a
 * 2px green ring on focus - the focus state is a change of surface, not just a
 * change of border colour, so it is obvious at a glance which field is live.
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    hint,
    icon: Icon,
    right,
    className,
    containerClassName,
    onFocus,
    onBlur,
    ...props
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const { color } = useTokens();
  // A multiline field grows with its content, so it cannot take the fixed
  // control height and has to align its content to the top.
  const multiline = Boolean(props.multiline);

  return (
    <View className={cn("gap-2", containerClassName)}>
      {label ? (
        <Text variant="label-sm" tone={error ? "destructive" : "muted"}>
          {label}
        </Text>
      ) : null}

      <View
        className={cn(
          "flex-row gap-2.5 rounded-md border-2 px-4",
          multiline ? "min-h-[112px] items-start py-3.5" : "h-14 items-center",
          error
            ? "border-destructive bg-destructive-subtle"
            : focused
              ? "border-ring bg-card"
              : "border-transparent bg-muted",
        )}
      >
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
          className={cn("flex-1 font-sans text-body-lg text-foreground", className)}
          accessibilityLabel={label}
          style={multiline ? { textAlignVertical: "top" } : undefined}
          {...props}
        />

        {right}
      </View>

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

/**
 * The global search bar. A full pill on a white surface, distinct from the
 * squircle form field so the two never read as the same control.
 */
export const SearchInput = forwardRef(function SearchInput(
  { icon: Icon = Search, right, className, onFocus, onBlur, ...props },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const { color, elevation, scheme } = useTokens();

  return (
    <View
      style={elevation.subtle[scheme]}
      className={cn(
        "h-14 flex-row items-center gap-3 rounded-full border-2 bg-card px-5",
        focused ? "border-ring" : "border-transparent",
        className,
      )}
    >
      {Icon ? <Icon size={20} color={focused ? color.primary : color["muted-foreground"]} /> : null}
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
        className="flex-1 font-sans text-body-lg text-foreground"
        returnKeyType="search"
        {...props}
      />
      {right}
    </View>
  );
});

// A read-only field that opens something else - a date picker, a sheet, a map.
export function FieldButton({ label, value, placeholder, icon: Icon, onPress, error }) {
  const { color } = useTokens();

  return (
    <View className="gap-2">
      {label ? (
        <Text variant="label-sm" tone={error ? "destructive" : "muted"}>
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        className={cn(
          "h-14 flex-row items-center gap-2.5 rounded-md border-2 border-transparent bg-muted px-4 active:opacity-70",
          error && "border-destructive bg-destructive-subtle",
        )}
      >
        {Icon ? <Icon size={18} color={color["muted-foreground"]} /> : null}
        <Text
          variant="body-lg"
          tone={value ? "foreground" : "muted"}
          numberOfLines={1}
          className="flex-1"
        >
          {value || placeholder}
        </Text>
      </Pressable>
      {error ? (
        <Text variant="caption" tone="destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
