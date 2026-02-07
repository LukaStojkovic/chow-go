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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { XCircle } from "lucide-react";

export function RejectOrderDialog({ isOpen, onClose, onReject, isRejecting }) {
  const [reason, setReason] = useState("");

  const commonReasons = [
    "Out of ingredients",
    "Too busy right now",
    "Closed for the day",
    "Item unavailable",
  ];

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
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Reject Order
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for rejecting this order. The customer will
            be notified.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for rejection</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              rows={3}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              Quick select:
            </Label>
            <div className="flex flex-wrap gap-2">
              {commonReasons.map((r) => (
                <Button
                  key={r}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReason(r)}
                >
                  {r}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRejecting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isRejecting || !reason.trim()}
          >
            {isRejecting ? "Rejecting..." : "Reject Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
