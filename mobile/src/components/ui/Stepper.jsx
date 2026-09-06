import { Pressable, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Minus, Plus } from "lucide-react-native";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

export function Stepper({ value, onChange, min = 1, max = 99 }) {
  const { color } = useTokens();

  const step = (delta) => {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next === value) return;
    Haptics.selectionAsync();
    onChange(next);
  };

  const Control = ({ icon: Icon, delta, label, disabled }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => step(delta)}
      // 44pt minimum touch target.
      className="h-11 w-11 items-center justify-center active:opacity-60"
    >
      <Icon size={18} color={disabled ? color["muted-foreground"] : color.foreground} />
    </Pressable>
  );

  return (
    <View className="flex-row items-center rounded-full border border-border">
      <Control icon={Minus} delta={-1} label="Decrease quantity" disabled={value <= min} />
      <Text variant="label" className="w-7 text-center" style={{ fontVariant: ["tabular-nums"] }}>
        {value}
      </Text>
      <Control icon={Plus} delta={1} label="Increase quantity" disabled={value >= max} />
    </View>
  );
}
