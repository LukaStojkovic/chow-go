import { useState } from "react";
import { Modal, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";

const REASONS = ["Changed my mind", "Ordered by mistake", "Taking too long", "Something else"];

// The reason reaches the restaurant, so it is worth asking rather than sending
// a hardcoded string on the customer's behalf.
export function CancelOrderPrompt({ visible, isPending, onConfirm, onCancel }) {
  const [choice, setChoice] = useState(REASONS[0]);
  const [other, setOther] = useState("");

  const reason = choice === "Something else" ? other.trim() : choice;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="gap-4 rounded-t-lg bg-popover p-5 pb-8">
          <View className="gap-1">
            <Text variant="h2">Cancel this order?</Text>
            <Text variant="body-sm" tone="muted">
              Let the restaurant know why.
            </Text>
          </View>

          <View className="gap-2">
            {REASONS.map((option) => (
              <Button
                key={option}
                variant={choice === option ? "primary" : "outline"}
                size="sm"
                onPress={() => setChoice(option)}
              >
                {option}
              </Button>
            ))}
          </View>

          {choice === "Something else" ? (
            <Input
              value={other}
              onChangeText={setOther}
              placeholder="Tell them why"
              maxLength={200}
              autoFocus
            />
          ) : null}

          <View className="gap-2">
            <Button
              variant="destructive"
              loading={isPending}
              disabled={!reason}
              onPress={() => onConfirm(reason)}
            >
              Cancel order
            </Button>
            <Button variant="ghost" onPress={onCancel}>
              Keep it
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
