/**
 * Confirms discarding an existing basket.
 *
 * The backend allows one restaurant per cart, so ordering from a second one
 * means losing the first basket. That is not recoverable, so it is confirmed,
 * names what will be lost, and puts the destructive option second.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { Trans, useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {string} [props.currentRestaurantName]
 * @param {string} [props.nextRestaurantName]
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
export function ReplaceBasketDialog({
  open,
  currentRestaurantName,
  nextRestaurantName,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation(["basket", "common"]);
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("differentRestaurant.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {/* One sentence rather than four concatenated fragments: the two
                restaurant names sit in a different order in Serbian, and a
                sentence built from pieces can only follow one language's. */}
            <Trans
              t={t}
              i18nKey={
                nextRestaurantName
                  ? "differentRestaurant.bodyWithNext"
                  : "differentRestaurant.body"
              }
              values={{
                current: currentRestaurantName || t("differentRestaurant.anotherRestaurant"),
                next: nextRestaurantName,
              }}
              components={[<strong key="name" className="text-foreground" />]}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("differentRestaurant.keep")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {t("differentRestaurant.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
