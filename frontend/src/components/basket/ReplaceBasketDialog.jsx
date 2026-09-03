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
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Start a new basket?</AlertDialogTitle>
          <AlertDialogDescription>
            Your basket has items from{" "}
            <strong className="text-foreground">
              {currentRestaurantName || "another restaurant"}
            </strong>
            . You can only order from one restaurant at a time, so those items will be
            removed
            {nextRestaurantName ? ` and replaced with your order from ${nextRestaurantName}` : ""}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep my basket</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            Empty basket and continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
