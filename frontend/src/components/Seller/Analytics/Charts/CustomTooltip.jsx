import { formatPrice } from "@chowgo/shared/format";
import { useCurrency } from "@/hooks/useCurrency";

export const CustomTooltip = ({ active, payload, label }) => {
  const currency = useCurrency();
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
        <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
            {p.name === "revenue" ? formatPrice(p.value, { currency }) : p.value} {p.name}
          </p>
        ))}
      </div>
    );
  }
  return null;
};
