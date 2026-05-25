import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

export function EarningsOverview({ chartData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Earnings Overview
        </h3>
        <select className="rounded-lg border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700 outline-none dark:border-gray-700 dark:bg-zinc-800 dark:text-gray-300">
          <option>This Week</option>
          <option>Last Week</option>
        </select>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="earnings"
              stroke="#10b981"
              fill="rgba(16, 185, 129, 0.1)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
