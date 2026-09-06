import { router } from "expo-router";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Screen } from "@/components/ui/Screen";

// Reachable from a stale push deep link or a mistyped chowgo:// URL.
export default function NotFound() {
  return (
    <Screen className="justify-center">
      <EmptyState
        title="This page doesn't exist"
        description="The link may be out of date."
        actionLabel="Go home"
        onAction={() => router.replace("/")}
      />
    </Screen>
  );
}
