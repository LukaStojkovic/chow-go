import { View } from "react-native";
import { EmptyState } from "@/components/feedback/EmptyState";
import { reportError } from "@/lib/monitoring";

/**
 * Builds the `ErrorBoundary` export Expo Router looks for on a route or layout
 * file. A boundary on the route keeps a render throw inside that screen instead
 * of white-screening the app, and the user keeps the back gesture.
 */
export function makeRouteErrorBoundary(name, title, description) {
  return function RouteErrorBoundary({ error, retry }) {
    reportError(error, { boundary: name });
    return (
      <View className="flex-1 items-center justify-center bg-surface px-6">
        <EmptyState
          title={title}
          description={
            description ?? "Nothing has been charged. Try again, or go back and reopen it."
          }
          actionLabel="Try again"
          onAction={retry}
        />
      </View>
    );
  };
}
