import { Trans } from "react-i18next";
import { router } from "expo-router";

import { Text } from "@/components/ui/Text";

/**
 * "By continuing you agree to..." with both documents tappable. Nested Text
 * keeps the sentence wrapping as one paragraph in either language.
 */
export function LegalConsent({ i18nKey, className }) {
  const link = (kind) => (
    <Text
      variant="caption"
      className="text-primary underline"
      accessibilityRole="link"
      onPress={() => router.push(`/legal/${kind}`)}
    />
  );
  return (
    <Text variant="caption" tone="muted" className={className}>
      <Trans i18nKey={i18nKey} components={{ terms: link("terms"), privacy: link("privacy") }} />
    </Text>
  );
}
