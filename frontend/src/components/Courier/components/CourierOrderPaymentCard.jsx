import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PAYMENT_LABELS = {
  cash: "Cash on delivery",
  card: "Card",
};

export function CourierOrderPayment({ paymentMethod }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CreditCard className="h-4 w-4" />
        Payment
      </div>
      <Badge
        variant={paymentMethod === "cash" ? "outline" : "secondary"}
        className="capitalize font-medium"
      >
        {PAYMENT_LABELS[paymentMethod] ?? paymentMethod}
      </Badge>
    </div>
  );
}
