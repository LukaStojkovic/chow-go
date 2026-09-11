import { router } from "expo-router";
import { Compass } from "lucide-react-native";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Screen } from "@/components/ui/Screen";

// Reachable from a stale push deep link or a mistyped chowgo:// URL.
export default function NotFound() {
  return (
    <Screen className="justify-center">
      <EmptyState
        icon={Compass}
        title="This page doesn't exist"
        description="The link may be out of date, or the order it pointed at is gone."
        actionLabel="Go home"
        onAction={() => router.replace("/")}
      />
    </Screen>
  );
}
