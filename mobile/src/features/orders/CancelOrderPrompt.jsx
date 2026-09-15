import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { Ban } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet, SheetActions } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

// Keys, not copy: the list is built before a language exists. The reason the
// customer picks is sent to the restaurant as free text, so it is resolved at
// the moment of sending - in the language the customer chose it in.
const REASONS = ["changedMind", "byMistake", "tooLong", "other"];

// The reason reaches the restaurant, so it is worth asking rather than sending
// a hardcoded string on the customer's behalf.
export function CancelOrderPrompt({ visible, isPending, onConfirm, onCancel }) {
  const { t } = useTranslation(["courier", "order", "seller", "restaurant", "basket", "profile", "common"]);
  const [choice, setChoice] = useState(REASONS[0]);
  const [other, setOther] = useState("");

  const reason = choice === "other" ? other.trim() : t(`order:cancel.reasons.${choice}`);

  return (
    <Sheet
      visible={visible}
      onClose={onCancel}
      icon={Ban}
      tone="danger"
      title={t("order:cancel.title")}
      description={t("order:cancel.reasonHint")}
    >
      <View className="flex-row flex-wrap justify-center gap-2">
        {REASONS.map((option) => (
          <Chip
            key={option}
            label={t(`order:cancel.reasons.${option}`)}
            active={choice === option}
            showCheck
            onPress={() => setChoice(option)}
          />
        ))}
      </View>

      {choice === "other" ? (
        <Input
          value={other}
          onChangeText={setOther}
          placeholder={t("order:cancel.reasonPlaceholder")}
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
          {t("order:actions.cancel")}
        </Button>
        <Button variant="ghost" size="lg" fullWidth onPress={onCancel}>
          {t("order:cancel.dismiss")}
        </Button>
      </SheetActions>
    </Sheet>
  );
}
