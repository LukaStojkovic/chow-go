import { CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

// Keys, not copy: module scope runs before a language is picked.
const PAYMENT_LABELS = {
  cash: "common:taxonomy.paymentMethod.cash.label",
  card: "common:taxonomy.paymentMethod.card.label",
};

export function CourierOrderPayment({ paymentMethod }) {
  const { t } = useTranslation(["courier", "basket", "common"]);
  return (
    <div className="px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CreditCard className="h-4 w-4" />
        {t("basket:checkout.payment.title")}
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
