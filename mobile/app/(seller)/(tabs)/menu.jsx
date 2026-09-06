import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function SellerMenu() {
  return (
    <Screen edges={["top"]} className="justify-center">
      <EmptyState title="Menu" description="Coming in the next slice." />
    </Screen>
  );
}
