import { formatPrice } from "@chowgo/shared/format";
import { sumMoney } from "@chowgo/shared/money";

import { SectionLabel } from "./CourierOrderDetailSheet";
import { useTranslation } from "react-i18next";

export function CourierOrderEarnings({ deliveryFee = 0, priorityFee = 0, tip = 0, currency }) {
  const { t } = useTranslation(["courier", "basket", "common"]);
  const total = sumMoney(deliveryFee, priorityFee, tip);

  const cells = [
    { label: t("basket:summary.deliveryFee"), value: deliveryFee },
    priorityFee > 0 && { label: t("basket:summary.priorityFee"), value: priorityFee },
    { label: t("basket:summary.tip"), value: tip },
    { label: t("basket:summary.total"), value: total, highlight: true },
  ].filter(Boolean);

  return (
    <div className="px-5 py-4">
      <SectionLabel>{t("orders.payout")}</SectionLabel>
      <div className={`grid gap-2 ${cells.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
        {cells.map(({ label, value, highlight }) => (
          <div key={label} className="rounded-xl bg-muted/50 p-3 text-center">
            <p
              className={`text-base font-semibold ${highlight ? "text-primary " : "text-foreground"}`}
            >
              {formatPrice(value, { currency })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
