import { Pressable, View } from "react-native";
import { Check } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

/**
 * A single-choice row.
 *
 * Selection is carried by three things at once - a mint fill, a green outline
 * and a filled tick - because at checkout the cost of getting the wrong one is
 * a wrong order, and one signal is not enough to be certain at a glance.
 */
export function OptionRow({ label, description, selected, onPress, trailing }) {
  const { color } = useTokens();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-3 rounded-md border-2 p-3.5 active:opacity-80",
        selected ? "border-primary bg-primary-subtle" : "border-transparent bg-muted",
      )}
    >
      <View className="flex-1 gap-0.5">
        <Text variant="h3" numberOfLines={1}>
          {label}
        </Text>
        {description ? (
          <Text variant="body-sm" tone="muted" numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>

      {trailing}

      <View
        className={cn(
          "h-6 w-6 items-center justify-center rounded-full border-2",
          selected ? "border-primary bg-primary" : "border-border-strong",
        )}
      >
        {selected ? (
          <Check size={13} strokeWidth={3.5} color={color["primary-foreground"]} />
        ) : null}
      </View>
    </Pressable>
  );
}
