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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

export function ConfirmOrderDialog({
  isOpen,
  onClose,
  onConfirm,
  isConfirming,
}) {
  const { t } = useTranslation(["seller", "common"]);
  const [prepTime, setPrepTime] = useState("30");

  const handleConfirm = () => {
    const time = parseInt(prepTime);
    if (time && time > 0) {
      onConfirm(time);
      setPrepTime("30");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            {t("orders.confirmTitle")}
          </DialogTitle>
          <DialogDescription>{t("orders.confirmDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prep-time">{t("orders.prepTimeLabel")}</Label>
            <Input
              id="prep-time"
              type="number"
              min="5"
              max="120"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="30"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              {t("orders.prepTimeHint")}
            </p>
          </div>

          <div className="flex gap-2">
            {["15", "30", "45"].map((minutes) => (
              <Button
                key={minutes}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPrepTime(minutes)}
              >
                {t("common:units.minutes", { value: minutes })}
              </Button>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            {t("common:actions.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirming || !prepTime}>
            {isConfirming ? t("common:state.processing") : t("orders.confirmTitle")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
