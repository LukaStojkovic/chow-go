import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { XCircle } from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet, SheetActions } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";

// Keys, not copy - see CancelOrderPrompt for why the reason resolves late.
const REASONS = ["tooBusy", "outOfStock", "closingSoon", "other"];

export function RejectOrderPrompt({ visible, isPending, onConfirm, onCancel }) {
  const { t } = useTranslation(["courier", "order", "seller", "restaurant", "basket", "profile", "common"]);
  const [choice, setChoice] = useState(REASONS[0]);
  const [other, setOther] = useState("");

  const reason = choice === "other" ? other.trim() : t(`seller:orders.rejectReasons.${choice}`);

  return (
    <Sheet
      visible={visible}
      onClose={onCancel}
      icon={XCircle}
      tone="danger"
      title={t("seller:orders.rejectTitle")}
      description={t("seller:orders.rejectShortHint")}
    >
      <View className="flex-row flex-wrap justify-center gap-2">
        {REASONS.map((option) => (
          <Chip
            key={option}
            label={t(`seller:orders.rejectReasons.${option}`)}
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
          placeholder={t("seller:orders.reasonPlaceholder")}
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
          {t("seller:orders.actions.reject")}
        </Button>
        <Button variant="ghost" size="lg" fullWidth onPress={onCancel}>
          {t("common:actions.goBack")}
        </Button>
      </SheetActions>
    </Sheet>
  );
}
