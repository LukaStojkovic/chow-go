import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";
import { getLegalDocument } from "@chowgo/shared/legal";
import { formatDate } from "@chowgo/shared/format";

import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";

// Same text as the website's /terms and /privacy, from @chowgo/shared/legal.
export default function LegalScreen() {
  const { kind } = useLocalSearchParams();
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage || i18n.language;
  const doc = useMemo(
    () => getLegalDocument(kind === "privacy" ? "privacy" : "terms", locale),
    [kind, locale],
  );

  return (
    <Screen edges={["top", "bottom"]}>
      <ScreenHeader title={doc.title} onBack={() => router.back()} />
      <ScrollView contentContainerClassName="gap-5 px-5 pb-12">
        <Text variant="caption" tone="muted">
          {t("legal.updated", { date: formatDate(doc.updated) })}
        </Text>
        {doc.intro.map((paragraph) => (
          <Text key={paragraph} variant="body">
            {paragraph}
          </Text>
        ))}
        {doc.sections.map((section) => (
          <View key={section.heading} className="gap-2">
            <Text variant="h3">{section.heading}</Text>
            {section.blocks.map((block, index) =>
              Array.isArray(block) ? (
                <View key={index} className="gap-1.5">
                  {block.map((item) => (
                    <View key={item} className="flex-row gap-2">
                      <Text variant="body" tone="muted">
                        {"•"}
                      </Text>
                      <Text variant="body" className="flex-1">
                        {item}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text key={index} variant="body">
                  {block}
                </Text>
              ),
            )}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
