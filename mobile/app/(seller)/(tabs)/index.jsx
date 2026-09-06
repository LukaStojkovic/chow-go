import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function SellerOverview() {
  return (
    <Screen edges={["top"]} className="justify-center">
      <EmptyState title="Overview" description="Coming in the next slice." />
    </Screen>
  );
}
