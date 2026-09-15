import { View } from "react-native";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/feedback/EmptyState";
import { reportError } from "@/lib/monitoring";

/**
 * Builds the `ErrorBoundary` export Expo Router looks for on a route or layout
 * file. A boundary on the route keeps a render throw inside that screen instead
 * of white-screening the app, and the user keeps the back gesture.
 */
export function makeRouteErrorBoundary(name, titleKey, descriptionKey) {
  return function RouteErrorBoundary({ error, retry }) {
    const { t } = useTranslation("common");
    reportError(error, { boundary: name });

    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <EmptyState
          title={t(titleKey ?? "error.boundaryTitle")}
          description={t(descriptionKey ?? "error.boundaryDescription")}
          actionLabel={t("actions.retry")}
          onAction={retry}
        />
      </View>
    );
  };
}
