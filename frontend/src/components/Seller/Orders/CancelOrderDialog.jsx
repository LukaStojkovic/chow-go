import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

export function CancelOrderDialog({ isOpen, onClose, onCancel, isCancelling }) {
  const { t } = useTranslation(["seller", "common"]);
  const [reason, setReason] = useState("");

  const commonReasons = ["kitchenBusy", "ingredients", "equipment", "staff"];

  const handleCancel = () => {
    if (reason.trim()) {
      onCancel(reason.trim());
      setReason("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            {t("orders.actions.cancel")}
          </DialogTitle>
          <DialogDescription>
            {t("orders.cancelDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">{t("orders.rejectReasonLabel")}</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("orders.reasonPlaceholder")}
              rows={3}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t("orders.quickSelect")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {commonReasons.map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReason(t(`orders.cancelReasons.${r}`))}
                >
                  {t(`orders.cancelReasons.${r}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCancelling}>
            {t("orders.keepOrder")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling || !reason.trim()}
          >
            {isCancelling ? t("order:cancel.cancelling") : t("orders.actions.cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
