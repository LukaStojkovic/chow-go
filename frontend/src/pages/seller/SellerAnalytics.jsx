import { AlertCircle } from "lucide-react";

export const SellerAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl flex items-center gap-3 text-orange-800 dark:text-orange-400">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">
          Your restaurant is trending! Views are up 25% this week compared to
          local average.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-zinc-800">
          <h3 className="text-lg font-bold mb-6 dark:text-white">Peak Hours</h3>
          <div className="h-64 flex items-end gap-2">
            {[20, 35, 60, 80, 100, 70, 45, 30].map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-emerald-100 dark:bg-emerald-900/20 rounded-t-lg relative"
              >
                <div
                  className="absolute bottom-0 w-full bg-emerald-500 rounded-t-lg"
                  style={{ height: `${h}%` }}
                ></div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">12 PM - 8 PM</p>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-gray-100 dark:border-zinc-800">
          <h3 className="text-lg font-bold mb-6 dark:text-white">
            Customer Satisfaction
          </h3>
          <div className="flex items-center justify-center py-8">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#E5E7EB"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeDasharray="100, 100"
                  className="animate-spin-slow origin-center"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  98%
                </span>
                <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                  Positive
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
