import { ShoppingBag } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Sheet, SheetActions } from "@/components/ui/Dialog";
import { useCartStore } from "@/store/useCartStore";

// The backend refuses items from a second restaurant. That is a choice for the
// customer, so it is confirmed rather than reported as an error.
export function ReplaceBasketDialog() {
  const { t } = useTranslation(["basket", "common"]);
  const { pendingConflict, restaurant, resolveConflictByReplacing, dismissConflict } =
    useCartStore();

  return (
    <Sheet
      visible={Boolean(pendingConflict)}
      onClose={dismissConflict}
      icon={ShoppingBag}
      tone="warning"
      title={t("differentRestaurant.title")}
      description={t("differentRestaurant.addBody", {
        current: restaurant?.name ?? t("differentRestaurant.anotherRestaurant"),
      })}
    >
      <SheetActions>
        <Button variant="destructive" size="lg" fullWidth onPress={resolveConflictByReplacing}>
          {t("differentRestaurant.emptyAndAdd")}
        </Button>
        <Button variant="ghost" size="lg" fullWidth onPress={dismissConflict}>
          {t("differentRestaurant.keep")}
        </Button>
      </SheetActions>
    </Sheet>
  );
}
