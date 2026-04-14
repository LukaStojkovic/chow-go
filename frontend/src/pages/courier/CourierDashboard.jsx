import React from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  Clock,
  CheckCircle,
  TrendingUp,
  Package,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function CourierDashboard() {
  const { isOnline } = useOutletContext();

  const hasActiveOrder = true;
  const stats = [
    { label: "Today's Earnings", value: "$84.50", icon: TrendingUp },
    { label: "Deliveries", value: "12", icon: Package },
    { label: "Acceptance Rate", value: "94%", icon: CheckCircle },
    { label: "Avg Time", value: "24 min", icon: Clock },
  ];

  const chartData = [
    { day: "Mon", earnings: 45 },
    { day: "Tue", earnings: 60 },
    { day: "Wed", earnings: 55 },
    { day: "Thu", earnings: 80 },
    { day: "Fri", earnings: 110 },
    { day: "Sat", earnings: 135 },
    { day: "Sun", earnings: 84.5 },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            You are currently offline. Go online to start receiving delivery
            requests.
          </p>
        </motion.div>
      )}

      {isOnline && hasActiveOrder && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-900/5 dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="bg-emerald-50 px-6 py-4 dark:bg-emerald-900/20">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
                </span>
                ACTIVE DELIVERY
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                Est. Payout: $8.50
              </span>
            </div>
          </div>

          <div className="p-6">
            <div className="relative pl-6">
              <div className="absolute bottom-2 left-[11px] top-2 w-2px bg-gray-200 dark:bg-gray-700"></div>

              <div className="relative mb-6">
                <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-emerald-500 bg-white dark:bg-gray-900"></div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Burger Joint
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  123 Main St • 0.5 miles away
                </p>
              </div>

              <div className="relative">
                <MapPin className="absolute -left-7 top-0.5 h-5 w-5 text-red-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  John Doe
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Apt 4B, 456 Elm St • 2.1 miles total
                </p>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 font-semibold text-gray-900 transition hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
                View Details
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 shadow-lg shadow-emerald-500/20">
                <Navigation className="h-5 w-5" />
                Navigate
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
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
    </div>
  );
}
