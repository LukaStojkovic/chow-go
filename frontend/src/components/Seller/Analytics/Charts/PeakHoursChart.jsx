import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { CustomTooltip } from "./CustomTooltip";

export const PeakHoursChart = ({ data }) => {
  const filteredHours = data?.filter((_, i) => i >= 6 && i <= 23);

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800">
      <h3 className="text-lg font-bold mb-6 dark:text-white">Peak Hours</h3>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={filteredHours} barSize={14}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="hour"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={2}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="orders"
            fill="#10B981"
            radius={[6, 6, 0, 0]}
            name="orders"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
