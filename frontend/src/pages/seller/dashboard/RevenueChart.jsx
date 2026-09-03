import { TrendingUp } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover text-popover-foreground border border-border px-3 py-2 rounded-md shadow-overlay text-xs">
        <p className="font-semibold">${payload[0].value.toFixed(2)}</p>
        <p className="text-muted-foreground">{payload[0].payload.orders} orders</p>
      </div>
    );
  }
  return null;
};

const getDayLabel = (dateStr) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const date = new Date(dateStr);
  return days[date.getDay()];
};

export const RevenueChart = ({ chartData }) => {
  const chartDataWithLabels = chartData.map((day) => ({
    ...day,
    dayLabel: getDayLabel(day.date),
  }));

  const hasAnyRevenue = chartDataWithLabels.some((d) => d.revenue > 0);
  const totalRevenue = chartDataWithLabels.reduce(
    (sum, d) => sum + (d.revenue || 0),
    0,
  );
  const maxRevenue = Math.max(
    ...chartDataWithLabels.map((d) => d.revenue || 0),
  );

  return (
    <div className="lg:col-span-2 bg-card rounded-3xl border border-border p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-foreground ">
          Revenue Analytics
        </h3>
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground ">
            Last 7 Days
          </span>
        </div>
      </div>

      {hasAnyRevenue ? (
        <>
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={chartDataWithLabels}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#374151"
                opacity={0.1}
              />
              <XAxis
                dataKey="dayLabel"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "#374151", opacity: 0.2 }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={{ stroke: "#374151", opacity: 0.2 }}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#colorRevenue)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground ">
              Peak: ${maxRevenue.toFixed(2)}
            </span>
            <span className="text-muted-foreground ">
              Total: ${totalRevenue.toFixed(2)}
            </span>
          </div>
        </>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground ">
              No revenue data yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Start receiving orders to see analytics
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
