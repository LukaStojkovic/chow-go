import { Modal, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useCartStore } from "@/store/useCartStore";

// The backend refuses items from a second restaurant. That is a choice for the
// customer, so it is confirmed rather than reported as an error.
export function ReplaceBasketDialog() {
  const { pendingConflict, restaurant, resolveConflictByReplacing, dismissConflict } =
    useCartStore();

  return (
    <Modal
      visible={Boolean(pendingConflict)}
      transparent
      animationType="fade"
      onRequestClose={dismissConflict}
    >
      <View className="flex-1 items-center justify-center bg-black/50 p-6">
        <View className="w-full gap-4 rounded-md bg-popover p-5">
          <View className="gap-1.5">
            <Text variant="h2">Start a new basket?</Text>
            <Text variant="body" tone="muted">
              Your basket has items from {restaurant?.name ?? "another restaurant"}. Adding this
              dish will empty it.
            </Text>
          </View>
          <View className="gap-2">
            <Button variant="destructive" onPress={resolveConflictByReplacing}>
              Empty basket and add
            </Button>
            <Button variant="ghost" onPress={dismissConflict}>
              Keep my basket
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
