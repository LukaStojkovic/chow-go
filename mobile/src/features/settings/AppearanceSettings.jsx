import { View } from "react-native";
import { Accessibility, Moon, Smartphone, Sparkles, Sun } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Chip";
import { Text } from "@/components/ui/Text";
import { useMotionStore } from "@/store/useMotionStore";
import { useThemeStore } from "@/store/useThemeStore";

/**
 * Appearance and motion, shared by the customer and courier profiles.
 *
 * Both stores keep their values as lowercase enums - "light", "system",
 * "reduced" - and those were being rendered straight into the control. A raw
 * enum is not a label, so each option now carries its own icon and its own
 * written name.
 *
 * The icons stand alone in the control and the *current* value is spelled out
 * in the row heading opposite the title. That keeps the control compact without
 * making the user decode a glyph to find out what their setting is.
 *
 * `Smartphone` means "match the device" in both rows, so the idea only has to
 * be learned once.
 */
const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "Match device", icon: Smartphone },
];

const MOTION_OPTIONS = [
  { value: "full", label: "Full", icon: Sparkles },
  { value: "reduced", label: "Reduced", icon: Accessibility },
  { value: "system", label: "Match device", icon: Smartphone },
];

function PreferenceRow({ title, hint, options, value, onChange }) {
  const current = options.find((option) => option.value === value);

  return (
    <View className="gap-2.5">
      <View className="flex-row items-baseline justify-between gap-3">
        <View className="flex-1">
          <Text variant="h3" numberOfLines={1}>
            {title}
          </Text>
          {hint ? (
            <Text variant="body-sm" tone="muted" numberOfLines={1}>
              {hint}
            </Text>
          ) : null}
        </View>
        <Text variant="label" tone="primary" numberOfLines={1} className="shrink-0">
          {current?.label ?? ""}
        </Text>
      </View>

      <Segmented options={options} value={value} onChange={onChange} tone="surface" iconOnly />
    </View>
  );
}

export function AppearanceSettings() {
  const theme = useThemeStore();
  const motion = useMotionStore();

  return (
    <Card className="gap-5">
      <PreferenceRow
        title="Appearance"
        hint="Light, dark, or whatever your phone is set to"
        options={THEME_OPTIONS}
        value={theme.preference}
        onChange={theme.setPreference}
      />
      <PreferenceRow
        title="Motion"
        hint="Reduce animation across the app"
        options={MOTION_OPTIONS}
        value={motion.preference}
        onChange={motion.setPreference}
      />
    </Card>
  );
}
