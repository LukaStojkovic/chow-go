import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Accessibility, Moon, Smartphone, Sparkles, Sun } from "lucide-react-native";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Chip";
import { Divider } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { LanguagePicker } from "./LanguagePicker";
import { useMotionStore } from "@/store/useMotionStore";
import { useThemeStore } from "@/store/useThemeStore";

/**
 * Appearance, motion and language, shared by the customer and courier profiles.
 *
 * The theme and motion stores keep their values as lowercase enums - "light",
 * "system", "reduced" - and those were being rendered straight into the
 * control. A raw enum is not a label, so each option carries its own icon and
 * its own written name.
 *
 * The icons stand alone in the control and the *current* value is spelled out
 * in the row heading opposite the title. That keeps the control compact without
 * making the user decode a glyph to find out what their setting is.
 *
 * `Smartphone` means "match the device" in both rows, so the idea only has to
 * be learned once.
 *
 * Language is not a segmented control. Its options are words rather than
 * glyphs, and a fixed-width track would shrink them as languages are added -
 * so it is a row that names the current language and opens a list. See
 * `LanguagePicker`.
 */
const THEME_VALUES = [
  { value: "light", labelKey: "preferences.themeLight", icon: Sun },
  { value: "dark", labelKey: "preferences.themeDark", icon: Moon },
  { value: "system", labelKey: "preferences.themeSystem", icon: Smartphone },
];

const MOTION_VALUES = [
  { value: "full", labelKey: "preferences.motionFull", icon: Sparkles },
  { value: "reduced", labelKey: "preferences.motionReduced", icon: Accessibility },
  { value: "system", labelKey: "preferences.themeSystem", icon: Smartphone },
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
  const { t } = useTranslation(["profile", "common"]);
  const theme = useThemeStore();
  const motion = useMotionStore();

  const resolve = (entries) =>
    entries.map((entry) => ({ ...entry, label: t(`profile:${entry.labelKey}`) }));

  return (
    <Card className="gap-5">
      <PreferenceRow
        title={t("profile:preferences.theme")}
        hint={t("profile:preferences.themeHint")}
        options={resolve(THEME_VALUES)}
        value={theme.preference}
        onChange={theme.setPreference}
      />
      <PreferenceRow
        title={t("profile:preferences.motion")}
        hint={t("profile:preferences.motionHint")}
        options={resolve(MOTION_VALUES)}
        value={motion.preference}
        onChange={motion.setPreference}
      />
      <Divider />

      <LanguagePicker bare className="-my-2" />
    </Card>
  );
}
