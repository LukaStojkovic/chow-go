import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function Search() {
  return (
    <Screen edges={["top"]} className="justify-center">
      <EmptyState title="Search" description="Coming in the next slice." />
    </Screen>
  );
}
