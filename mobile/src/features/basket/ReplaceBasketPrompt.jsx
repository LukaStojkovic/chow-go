import { Modal, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

/**
 * Confirms discarding a basket. Used by reorder, which knows about the clash
 * before it starts, unlike the add-item path where the backend rejects it.
 */
export function ReplaceBasketPrompt({ visible, currentRestaurantName, onConfirm, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center bg-black/50 p-6">
        <View className="w-full gap-4 rounded-md bg-popover p-5">
          <View className="gap-1.5">
            <Text variant="h2">Start a new basket?</Text>
            <Text variant="body" tone="muted">
              Your basket has items from {currentRestaurantName ?? "another restaurant"}. Reordering
              will empty it.
            </Text>
          </View>
          <View className="gap-2">
            <Button variant="destructive" onPress={onConfirm}>
              Empty basket and reorder
            </Button>
            <Button variant="ghost" onPress={onCancel}>
              Keep my basket
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
