import { StatCard } from "@/components/ui/StatCard";
import { Clock, DollarSign, Users, Utensils } from "lucide-react";

export const SellerDashboard = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value="$12,450.00"
          trend="12.5%"
          isPositive={true}
          icon={DollarSign}
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
        />
        <StatCard
          title="Active Orders"
          value="24"
          trend="5.2%"
          isPositive={true}
          icon={Clock}
          colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        />
        <StatCard
          title="Total Customers"
          value="1,203"
          trend="8.1%"
          isPositive={true}
          icon={Users}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          title="Avg. Rating"
          value="4.8"
          trend="2.4%"
          isPositive={false}
          icon={Utensils}
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Revenue Analytics
            </h3>
            <select className="bg-gray-50 dark:bg-zinc-800 border-none rounded-lg text-sm px-3 py-2 outline-none cursor-pointer text-gray-600 dark:text-gray-300">
              <option>This Week</option>
              <option>This Month</option>
              <option>This Year</option>
            </select>
          </div>

          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 45, 75, 55, 85, 95, 70].map((h, i) => (
              <div
                key={i}
                className="w-full bg-gray-100 dark:bg-zinc-800 rounded-t-xl relative group"
              >
                <div
                  className="absolute bottom-0 left-0 right-0 bg-emerald-500 dark:bg-emerald-600 rounded-t-xl transition-all duration-500 group-hover:bg-emerald-400"
                  style={{ height: `${h}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs font-medium text-gray-400">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Popular Items
          </h3>
          <div className="space-y-6">
            {[
              {
                name: "Spicy Beef Ramen",
                count: "124 orders",
                price: "$14.50",
                img: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=100&q=80",
              },
              {
                name: "Classic Cheeseburger",
                count: "98 orders",
                price: "$12.99",
                img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&q=80",
              },
              {
                name: "Avocado Toast",
                count: "85 orders",
                price: "$9.50",
                img: "https://images.unsplash.com/photo-1588137372308-15f75323a4dd?w=100&q=80",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <img
                  src={item.img}
                  alt={item.name}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-zinc-800"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {item.name}
                  </h4>
                  <p className="text-xs text-gray-500">{item.count}</p>
                </div>
                <span className="font-bold text-emerald-600 text-sm">
                  {item.price}
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-8 py-3 text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-colors">
            View Menu Performance
          </button>
        </div>
      </div>
    </div>
  );
};
