import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function Orders() {
  return (
    <Screen edges={["top"]} className="justify-center">
      <EmptyState title="Orders" description="Coming in the next slice." />
    </Screen>
  );
}
