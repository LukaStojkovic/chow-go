import { SectionLabel } from "./CourierOrderDetailSheet";

const EARN_FIELDS = [
  { key: "deliveryFee", label: "Delivery fee" },
  { key: "tip", label: "Tip" },
];

export function CourierOrderEarnings({ deliveryFee = 0, tip = 0 }) {
  const total = deliveryFee + tip;

  const cells = [
    ...EARN_FIELDS.map(({ key, label }) => ({
      label,
      value: `$${(key === "deliveryFee" ? deliveryFee : tip).toFixed(2)}`,
    })),
    { label: "Total", value: `$${total.toFixed(2)}`, highlight: true },
  ];

  return (
    <div className="px-5 py-4">
      <SectionLabel>Your earnings</SectionLabel>
      <div className="grid grid-cols-3 gap-2">
        {cells.map(({ label, value, highlight }) => (
          <div key={label} className="rounded-xl bg-muted/50 p-3 text-center">
            <p
              className={`text-base font-semibold ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}
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
