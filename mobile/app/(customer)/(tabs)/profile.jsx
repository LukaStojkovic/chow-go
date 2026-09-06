import { Screen } from "@/components/ui/Screen";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function Profile() {
  return (
    <Screen edges={["top"]} className="justify-center">
      <EmptyState title="Profile" description="Coming in the next slice." />
    </Screen>
  );
}
