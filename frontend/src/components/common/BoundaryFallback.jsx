import { useTranslation } from "react-i18next";

import { ErrorState } from "./StateViews";

/**
 * The visible half of `ErrorBoundary`.
 *
 * In its own file for two reasons. A class cannot call `useTranslation`, and a
 * boundary that only re-renders when it catches would otherwise be stuck in
 * whichever language was active at the moment of the error. And fast refresh
 * needs a module to export components only - pairing this with the boundary
 * class broke it for every screen underneath.
 *
 * @param {Object} props
 * @param {string} [props.titleKey] Namespaced key; defaults to the generic heading.
 * @param {string} [props.descriptionKey]
 * @param {() => void} props.onRetry
 */
export function BoundaryFallback({ titleKey, descriptionKey, onRetry }) {
  const { t } = useTranslation("common");

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <ErrorState
        title={t(titleKey ?? "error.boundaryTitle")}
        description={t(descriptionKey ?? "error.boundaryDescription")}
        onRetry={onRetry}
      />
    </div>
  );
}
