import { ShoppingBag } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetActions } from "@/components/ui/Dialog";

/**
 * Confirms discarding a basket. Used by reorder, which knows about the clash
 * before it starts, unlike the add-item path where the backend rejects it.
 */
export function ReplaceBasketPrompt({ visible, currentRestaurantName, onConfirm, onCancel }) {
  const { t } = useTranslation(["basket", "common"]);
  return (
    <Sheet
      visible={visible}
      onClose={onCancel}
      icon={ShoppingBag}
      tone="warning"
      title={t("differentRestaurant.title")}
      description={t("differentRestaurant.reorderBody", {
        current: currentRestaurantName ?? t("differentRestaurant.anotherRestaurant"),
      })}
    >
      <SheetActions>
        <Button variant="destructive" size="lg" fullWidth onPress={onConfirm}>
          {t("differentRestaurant.emptyAndReorder")}
        </Button>
        <Button variant="ghost" size="lg" fullWidth onPress={onCancel}>
          {t("differentRestaurant.keep")}
        </Button>
      </SheetActions>
    </Sheet>
  );
}
