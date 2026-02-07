import { useState } from "react";
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
            <Clock className="h-5 w-5 text-blue-600" />
            Confirm Order
          </DialogTitle>
          <DialogDescription>
            Set the estimated preparation time for this order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prep-time">Preparation Time (minutes)</Label>
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
              Typical preparation time is 20-45 minutes
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrepTime("15")}
            >
              15 min
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrepTime("30")}
            >
              30 min
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPrepTime("45")}
            >
              45 min
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isConfirming}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isConfirming || !prepTime}>
            {isConfirming ? "Confirming..." : "Confirm Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
