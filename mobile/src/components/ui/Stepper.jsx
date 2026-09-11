import { Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Minus, Plus, Trash2 } from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { cn } from "@/lib/cn";
import { useTokens } from "@/theme/useTokens";

/**
 * Quantity control. A mint pill rather than an outlined one - the design uses
 * the soft green wash for every modifier, which keeps arithmetic from looking
 * like a form field.
 *
 * At the minimum the decrement turns into a bin, so removing a line is one tap
 * from where you already are instead of a swipe you have to discover.
 */
export function Stepper({ value, onChange, min = 1, max = 99, onRemove, size = "md" }) {
  const { color } = useTokens();
  const compact = size === "sm";
  const control = compact ? "h-9 w-9" : "h-11 w-11";
  const atMin = value <= min;
  const removable = atMin && Boolean(onRemove);

  const step = (delta) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next === value) return;
    Haptics.selectionAsync();
    onChange(next);
  };

  const Control = ({ icon: Icon, onPress, label, disabled, tone }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={cn("items-center justify-center rounded-full active:opacity-60", control)}
    >
      <Icon
        size={compact ? 15 : 17}
        strokeWidth={2.5}
        color={
          disabled
            ? color["muted-foreground"]
            : tone === "danger"
              ? color.destructive
              : color.primary
        }
      />
    </Pressable>
  );

  return (
    <View className="flex-row items-center rounded-full bg-primary-subtle p-0.5">
      <Control
        icon={removable ? Trash2 : Minus}
        onPress={() => {
          if (removable) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onRemove();
            return;
          }
          step(-1);
        }}
        label={removable ? "Remove item" : "Decrease quantity"}
        disabled={atMin && !onRemove}
        tone={removable ? "danger" : "primary"}
      />
      <Text
        variant="label"
        tone="primary"
        className={cn("text-center", compact ? "w-5" : "w-6")}
        style={{ fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
      <Control
        icon={Plus}
        onPress={() => step(1)}
        label="Increase quantity"
        disabled={value >= max}
      />
    </View>
  );
}
