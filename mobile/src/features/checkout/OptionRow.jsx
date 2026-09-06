import { Pressable, View } from "react-native";
import { Check } from "lucide-react-native";
import { cn } from "@/lib/cn";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

export function OptionRow({ label, description, selected, onPress, trailing }) {
  const { color } = useTokens();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={cn(
        "flex-row items-center gap-3 rounded-sm border p-3.5",
        selected ? "border-primary bg-primary-subtle" : "border-border bg-card",
      )}
    >
      <View className="flex-1 gap-0.5">
        <Text variant="label">{label}</Text>
        {description ? (
          <Text variant="caption" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      {trailing}
      {selected ? <Check size={18} color={color.primary} /> : null}
    </Pressable>
  );
}
