import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { CustomTooltip } from "./CustomTooltip";
import { Tooltip as UiTooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export const RevenueLineChart = ({ data }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800">
      <h3 className="text-lg font-bold mb-6 dark:text-white flex items-center">
        Revenue This Week
        <UiTooltip>
          <TooltipTrigger>
            <Info className="w-4 h-4 ml-2 text-muted-foreground cursor-pointer" />
          </TooltipTrigger>
          <TooltipContent>Daily revenue totals over the past 7 days.</TooltipContent>
        </UiTooltip>
      </h3>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#6366F1"
            strokeWidth={2.5}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="revenue"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
