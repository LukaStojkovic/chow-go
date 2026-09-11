import { ShoppingBag } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetActions } from "@/components/ui/Dialog";

/**
 * Confirms discarding a basket. Used by reorder, which knows about the clash
 * before it starts, unlike the add-item path where the backend rejects it.
 */
export function ReplaceBasketPrompt({ visible, currentRestaurantName, onConfirm, onCancel }) {
  return (
    <Sheet
      visible={visible}
      onClose={onCancel}
      icon={ShoppingBag}
      tone="warning"
      title="Start a new basket?"
      description={`Your basket has items from ${currentRestaurantName ?? "another restaurant"}. Reordering will empty it.`}
    >
      <SheetActions>
        <Button variant="destructive" size="lg" fullWidth onPress={onConfirm}>
          Empty basket and reorder
        </Button>
        <Button variant="ghost" size="lg" fullWidth onPress={onCancel}>
          Keep my basket
        </Button>
      </SheetActions>
    </Sheet>
  );
}
