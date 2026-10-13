import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import { Info } from "lucide-react";
import { formatPrice } from "@chowgo/shared/format";

import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatBucket } from "@/lib/reportFormat";

const HINT_KEY = {
  day: "reports.chart.hintDay",
  week: "reports.chart.hintWeek",
  month: "reports.chart.hintMonth",
};

function SeriesTooltip({ active, payload, label, currency }) {
  const { t } = useTranslation("seller");
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-bold text-primary">
        {t("reports.chart.revenue")}: {formatPrice(row.revenue, { currency })}
      </p>
      <p className="text-sm font-bold">
        {t("reports.chart.orders")}: {row.orders}
      </p>
    </div>
  );
}

export const RevenueLineChart = ({ series = [], granularity = "day", currency }) => {
  const { t } = useTranslation("seller");
  const data = series.map((point) => ({ ...point, label: formatBucket(point.key, granularity) }));

  return (
    <div className="bg-card p-6 rounded-3xl border border-border ">
      <h3 className="text-lg font-bold mb-6 flex items-center">
        {t("reports.chart.title")}
        <UiTooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 ml-2 text-muted-foreground cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent>{t(HINT_KEY[granularity] ?? HINT_KEY.day)}</TooltipContent>
        </UiTooltip>
      </h3>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={12} />
          <YAxis yAxisId="revenue" hide />
          <YAxis yAxisId="orders" orientation="right" hide allowDecimals={false} />
          <Tooltip content={<SeriesTooltip currency={currency} />} />
          <Bar yAxisId="orders" dataKey="orders" fill="#CBD5E1" radius={[4, 4, 0, 0]} maxBarSize={18} />
          <Line
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#6366F1"
            strokeWidth={2.5}
            dot={data.length <= 31 ? { r: 3 } : false}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
