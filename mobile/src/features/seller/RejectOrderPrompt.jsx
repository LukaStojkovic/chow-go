import { useState } from "react";
import { View } from "react-native";
import { XCircle } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet, SheetActions } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

const REASONS = ["Too busy right now", "Item out of stock", "Closing soon", "Something else"];

export function RejectOrderPrompt({ visible, isPending, onConfirm, onCancel }) {
  const [choice, setChoice] = useState(REASONS[0]);
  const [other, setOther] = useState("");

  const reason = choice === "Something else" ? other.trim() : choice;

  return (
    <Sheet
      visible={visible}
      onClose={onCancel}
      icon={XCircle}
      tone="danger"
      title="Reject this order?"
      description="The customer sees this reason on their tracking screen, so be specific."
    >
      <View className="flex-row flex-wrap justify-center gap-2">
        {REASONS.map((option) => (
          <Chip
            key={option}
            label={option}
            active={choice === option}
            showCheck
            onPress={() => setChoice(option)}
          />
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

      <SheetActions>
        <Button
          variant="destructive"
          size="lg"
          fullWidth
          loading={isPending}
          disabled={!reason}
          onPress={() => onConfirm(reason)}
        >
          Reject order
        </Button>
        <Button variant="ghost" size="lg" fullWidth onPress={onCancel}>
          Go back
        </Button>
      </SheetActions>
    </Sheet>
  );
}
