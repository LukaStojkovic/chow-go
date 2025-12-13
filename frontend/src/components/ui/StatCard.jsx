import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export const StatCard = ({
  title,
  value,
  trend,
  isPositive,
  icon: Icon,
  colorClass,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <h3 className="text-3xl font-bold mt-2 text-gray-900 dark:text-white tracking-tight">
          {value}
        </h3>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
    <div className="flex items-center gap-2 text-sm font-medium">
      <span
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
          isPositive
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
        }`}
      >
        {isPositive ? (
          <ArrowUpRight className="w-3.5 h-3.5" />
        ) : (
          <ArrowDownRight className="w-3.5 h-3.5" />
        )}
        {trend}
      </span>
      <span className="text-gray-400">vs last month</span>
    </div>
  </motion.div>
);
