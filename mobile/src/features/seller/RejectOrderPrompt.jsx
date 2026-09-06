import { useState } from "react";
import { Modal, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";

const REASONS = ["Too busy right now", "Item out of stock", "Closing soon", "Something else"];

export function RejectOrderPrompt({ visible, isPending, onConfirm, onCancel }) {
  const [choice, setChoice] = useState(REASONS[0]);
  const [other, setOther] = useState("");

  const reason = choice === "Something else" ? other.trim() : choice;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 justify-end bg-black/50">
        <View className="gap-4 rounded-t-lg bg-popover p-5 pb-8">
          <View className="gap-1">
            <Text variant="h2">Reject this order?</Text>
            <Text variant="body-sm" tone="muted">
              The customer sees this reason, so be specific.
            </Text>
          </View>

          <View className="gap-2">
            {REASONS.map((option) => (
              <Button
                key={option}
                size="sm"
                variant={choice === option ? "primary" : "outline"}
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
              Reject order
            </Button>
            <Button variant="ghost" onPress={onCancel}>
              Go back
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}
