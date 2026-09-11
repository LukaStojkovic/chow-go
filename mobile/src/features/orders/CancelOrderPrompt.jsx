import { useState } from "react";
import { View } from "react-native";
import { Ban } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet, SheetActions } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

const REASONS = ["Changed my mind", "Ordered by mistake", "Taking too long", "Something else"];

// The reason reaches the restaurant, so it is worth asking rather than sending
// a hardcoded string on the customer's behalf.
export function CancelOrderPrompt({ visible, isPending, onConfirm, onCancel }) {
  const [choice, setChoice] = useState(REASONS[0]);
  const [other, setOther] = useState("");

  const reason = choice === "Something else" ? other.trim() : choice;

  return (
    <Sheet
      visible={visible}
      onClose={onCancel}
      icon={Ban}
      tone="danger"
      title="Cancel this order?"
      description="Let the restaurant know why - it reaches their kitchen screen."
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
          Cancel order
        </Button>
        <Button variant="ghost" size="lg" fullWidth onPress={onCancel}>
          Keep it
        </Button>
      </SheetActions>
    </Sheet>
  );
}
