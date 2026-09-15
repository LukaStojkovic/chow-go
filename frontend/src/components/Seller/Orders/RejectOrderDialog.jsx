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
import { XCircle } from "lucide-react";

export function RejectOrderDialog({ isOpen, onClose, onReject, isRejecting }) {
  const { t } = useTranslation(["seller", "common"]);
  const [reason, setReason] = useState("");

  const commonReasons = ["outOfIngredients", "tooBusy", "closed", "itemUnavailable"];

  const handleReject = () => {
    if (reason.trim()) {
      onReject(reason.trim());
      setReason("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <XCircle className="h-5 w-5" />
            {t("orders.actions.reject")}
          </DialogTitle>
          <DialogDescription>
            {t("orders.rejectDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">{t("orders.rejectReasonLabel")}</Label>
            <Textarea
              id="reason"
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
                  onClick={() => setReason(t(`orders.rejectReasons.${r}`))}
                >
                  {t(`orders.rejectReasons.${r}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRejecting}>
            {t("common:actions.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isRejecting || !reason.trim()}
          >
            {isRejecting ? t("common:state.processing") : t("orders.actions.reject")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
