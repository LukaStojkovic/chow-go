import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function Favourites() {
  return (
    <Screen edges={["top"]} className="justify-center">
      <EmptyState title="Favourites" description="Coming in the next slice." />
    </Screen>
  );
}
