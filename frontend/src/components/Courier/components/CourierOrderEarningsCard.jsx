import { formatPrice } from "@chowgo/shared/format";

import { SectionLabel } from "./CourierOrderDetailSheet";
import { useTranslation } from "react-i18next";

// Keys, not copy: module scope runs before a language is chosen. The amounts
// also go through `formatPrice`, so the currency reads the way the rest of the
// app writes it rather than being hard-coded to a dollar sign.
const EARN_FIELDS = [
  { key: "deliveryFee", labelKey: "basket:summary.deliveryFee" },
  { key: "tip", labelKey: "basket:summary.tip" },
];

export function CourierOrderEarnings({ deliveryFee = 0, tip = 0 }) {
  const { t } = useTranslation(["courier", "basket", "common"]);
  const total = deliveryFee + tip;

  const cells = [
    ...EARN_FIELDS.map(({ key, labelKey }) => ({
      label: t(labelKey),
      value: formatPrice(key === "deliveryFee" ? deliveryFee : tip),
    })),
    { label: t("basket:summary.total"), value: formatPrice(total), highlight: true },
  ];

  return (
    <div className="px-5 py-4">
      <SectionLabel>{t("orders.payout")}</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        {cells.map(({ label, value, highlight }) => (
          <div key={label} className="rounded-xl bg-muted/50 p-3 text-center">
            <p
              className={`text-base font-semibold ${highlight ? "text-primary " : "text-foreground"}`}
            >
              {value}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
