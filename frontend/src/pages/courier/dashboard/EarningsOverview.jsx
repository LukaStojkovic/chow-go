import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { generateNameInitials } from "@chowgo/shared/strings";
import { formatDateAgo } from "@chowgo/shared/dates";

export function EarningsOverview({ chartData = [], recentOrders = [] }) {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm "
      >
        <h3 className="mb-4 text-base font-semibold text-foreground ">
          Weekly earnings
        </h3>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(128,128,128,0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="earn"
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="del"
                orientation="right"
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v, name) =>
                  name === "earnings"
                    ? [`$${v.toFixed(2)}`, "Earnings"]
                    : [v, "Deliveries"]
                }
              />
              <Bar
                yAxisId="earn"
                dataKey="earnings"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="del"
                dataKey="deliveries"
                fill="#9FE1CB"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {recentOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl border border-border bg-card p-6 shadow-sm "
        >
          <h3 className="mb-4 text-base font-semibold text-foreground ">
            Recent deliveries
          </h3>
          <div className="divide-y divide-border ">
            {recentOrders.map((o) => (
              <div
                key={o._id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary ">
                  {generateNameInitials(o.restaurant?.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground ">
                    {o.restaurant?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.orderNumber?.split("-").slice(-1)[0].replace(/^0+/, "#")}{" "}
                    · {o.customer?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground ">
                    ${o.deliveryFee?.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateAgo(o.deliveredAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
