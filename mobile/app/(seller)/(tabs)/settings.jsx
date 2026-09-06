import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function SellerSettings() {
  return (
    <Screen edges={["top"]} className="justify-center">
      <EmptyState title="Settings" description="Coming in the next slice." />
    </Screen>
  );
}
