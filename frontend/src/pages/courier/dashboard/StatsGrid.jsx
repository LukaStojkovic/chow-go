import React from "react";
import { motion } from "framer-motion";

export function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
            <stat.icon className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {stat.value}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {stat.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
