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
        <div className="rounded-2xl border border-border bg-card p-6 ">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground ">
            <Wallet className="h-5 w-5" /> <span>Available Balance</span>
          </div>
          <p className="text-4xl font-extrabold text-foreground ">
            $142.50
          </p>
          <button className="mt-4 w-full rounded-md bg-primary py-2.5 font-semibold text-primary-foreground transition hover:bg-primary-hover">
            Cash Out Now
          </button>
        </div>

        <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-6 ">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground ">
              <TrendingUp className="h-5 w-5" /> <span>This Week</span>
            </div>
            <span className="text-xl font-bold text-foreground ">
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

      <div className="rounded-2xl border border-border bg-card overflow-hidden ">
        <div className="border-b border-border p-5 ">
          <h3 className="font-bold text-foreground ">
            Recent Transactions
          </h3>
        </div>
        <div className="divide-y divide-border ">
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
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${tx.type === "earn" ? "bg-primary-subtle text-primary " : "bg-muted text-muted-foreground "}`}
                >
                  {tx.type === "earn" ? (
                    <Wallet className="h-5 w-5" />
                  ) : (
                    <ArrowDownToLine className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground ">
                    {tx.title}
                  </p>
                  <p className="text-sm text-muted-foreground ">
                    {tx.date}
                  </p>
                </div>
              </div>
              <span
                className={`font-bold ${tx.type === "earn" ? "text-primary " : "text-foreground "}`}
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
