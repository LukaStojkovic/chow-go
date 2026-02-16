import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

import { ORDER_STATUS_COLORS } from "@/constants/colorConstants";
import { CustomTooltip } from "./CustomTooltip";

export const OrderBreakdownChart = ({ data }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800">
      <h3 className="text-lg font-bold mb-6 dark:text-white">
        Order Breakdown
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" barSize={14}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="_id"
            type="category"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={90}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} name="orders">
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={ORDER_STATUS_COLORS[entry._id] || "#CBD5E1"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
