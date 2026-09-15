import { useState } from "react";
import { Pressable, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Check, Languages } from "lucide-react-native";
import { LOCALES, localeDescriptor } from "@chowgo/shared/i18n";

import { cn } from "@/lib/cn";
import { setLocale } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Dialog";
import { ListRow } from "@/components/ui/ListRow";
import { Text } from "@/components/ui/Text";
import { useTokens } from "@/theme/useTokens";

/**
 * Language, as a settings row that opens a sheet.
 *
 * A segmented control was the wrong shape for this. It spreads every option
 * across a fixed-width track, so the labels shrink as languages are added and
 * a third one would not fit at all - and it hides the current value inside the
 * control instead of stating it. A row that names the current language and
 * opens a list is the pattern the rest of the settings screens already use,
 * and it grows.
 *
 * Each language is written in itself ("Srpski", not "Serbian"). Someone who
 * cannot read the current language still has to be able to find their own -
 * which is also why the flag is decoration beside the name rather than the
 * label: a flag is a country, not a language.
 */
export function LanguagePicker({ bare = false, className }) {
  const { t, i18n } = useTranslation(["common", "profile"]);
  const { color } = useTokens();
  const [open, setOpen] = useState(false);

  const active = i18n.resolvedLanguage || i18n.language;

  const choose = async (code) => {
    setOpen(false);
    if (code !== active) await setLocale(code);
  };

  const row = (
    <ListRow
      icon={Languages}
      title={t("common:language.label")}
      subtitle={t("profile:preferences.languageDescription")}
      value={localeDescriptor(active).label}
      onPress={() => setOpen(true)}
    />
  );

  return (
    <>
      {bare ? <View className={className}>{row}</View> : <Card className={className}>{row}</Card>}

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        icon={Languages}
        // `mint` rather than `primary`: this is a preference, not a warning or
        // a confirmation, so it gets the subtle fill the settings rows use.
        tone="mint"
        title={t("common:language.change")}
        description={t("profile:preferences.languageDescription")}
      >
        <View className="gap-1.5 pt-1">
          {LOCALES.map((locale) => {
            const isActive = locale.code === active;

            return (
              <Pressable
                key={locale.code}
                accessibilityRole="radio"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={locale.label}
                onPress={() => choose(locale.code)}
                className={cn(
                  "flex-row items-center gap-3 rounded-lg px-4 py-3.5 active:opacity-60",
                  isActive ? "bg-primary-subtle" : "bg-muted",
                )}
              >
                <Text variant="h3" className="shrink-0">
                  {locale.flag}
                </Text>
                <Text
                  variant="h3"
                  tone={isActive ? "primary" : "foreground"}
                  className="flex-1"
                  numberOfLines={1}
                >
                  {locale.label}
                </Text>
                {isActive ? <Check size={18} color={color.primary} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}
