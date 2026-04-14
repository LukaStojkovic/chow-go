import React from "react";
import { Wallet, TrendingUp, ArrowDownToLine } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function CourierEarnings() {
  const chartData = [
    { day: "Mon", earnings: 45 },
    { day: "Tue", earnings: 60 },
    { day: "Wed", earnings: 55 },
    { day: "Thu", earnings: 80 },
    { day: "Fri", earnings: 110 },
    { day: "Sat", earnings: 135 },
    { day: "Sun", earnings: 84 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-2 flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Wallet className="h-5 w-5" /> <span>Available Balance</span>
          </div>
          <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
            $142.50
          </p>
          <button className="mt-4 w-full rounded-xl bg-gray-900 py-2.5 font-semibold text-white transition hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
            Cash Out Now
          </button>
        </div>

        <div className="sm:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <TrendingUp className="h-5 w-5" /> <span>This Week</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              $569.00
            </span>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="earnings" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-gray-200 p-5 dark:border-zinc-800">
          <h3 className="font-bold text-gray-900 dark:text-white">
            Recent Transactions
          </h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          {[
            {
              title: "Delivery Earnings",
              date: "Today, 2:30 PM",
              amount: "+$8.50",
              type: "earn",
            },
            {
              title: "Delivery Earnings",
              date: "Today, 1:15 PM",
              amount: "+$6.00",
              type: "earn",
            },
            {
              title: "Bank Withdrawal",
              date: "Yesterday",
              amount: "-$120.00",
              type: "withdraw",
            },
          ].map((tx, i) => (
            <div key={i} className="flex items-center justify-between p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.type === "earn" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400"}`}
                >
                  {tx.type === "earn" ? (
                    <Wallet className="h-5 w-5" />
                  ) : (
                    <ArrowDownToLine className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {tx.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {tx.date}
                  </p>
                </div>
              </div>
              <span
                className={`font-bold ${tx.type === "earn" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}
              >
                {tx.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
