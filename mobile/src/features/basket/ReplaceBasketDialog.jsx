import { ShoppingBag } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetActions } from "@/components/ui/Dialog";
import { useCartStore } from "@/store/useCartStore";

// The backend refuses items from a second restaurant. That is a choice for the
// customer, so it is confirmed rather than reported as an error.
export function ReplaceBasketDialog() {
  const { pendingConflict, restaurant, resolveConflictByReplacing, dismissConflict } =
    useCartStore();

  return (
    <Sheet
      visible={Boolean(pendingConflict)}
      onClose={dismissConflict}
      icon={ShoppingBag}
      tone="warning"
      title="Start a new basket?"
      description={`Your basket has items from ${restaurant?.name ?? "another restaurant"}. Adding this dish will empty it.`}
    >
      <SheetActions>
        <Button variant="destructive" size="lg" fullWidth onPress={resolveConflictByReplacing}>
          Empty basket and add
        </Button>
        <Button variant="ghost" size="lg" fullWidth onPress={dismissConflict}>
          Keep my basket
        </Button>
      </SheetActions>
    </Sheet>
  );
}
