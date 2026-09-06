import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function SellerAnalytics() {
  return (
    <Screen edges={["top"]} className="justify-center">
      <EmptyState title="Analytics" description="Coming in the next slice." />
    </Screen>
  );
}
