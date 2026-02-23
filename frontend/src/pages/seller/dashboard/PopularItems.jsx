import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

export const PopularItems = ({ items }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-100 dark:border-zinc-800 p-8 shadow-sm flex flex-col">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        Popular Items
      </h3>

      <div className="flex-1 space-y-6 mb-6">
        {items && items.length > 0 ? (
          items.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <img
                src={item.image}
                alt={item.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 dark:ring-zinc-800"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&q=80";
                }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {item.name}
                </h4>
                <p className="text-xs text-gray-500">
                  {item.totalOrders} orders
                </p>
              </div>
              <div className="text-right">
                <span className="font-bold text-emerald-600 text-sm block">
                  ${item.price?.toFixed(2) || "0.00"}
                </span>
                <span className="text-xs text-gray-500">
                  ${item.totalRevenue?.toFixed(0) || "0"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No popular items yet
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Your best sellers will appear here
            </p>
          </div>
        )}
      </div>

      <Link
        to="/seller/menu"
        className="block w-full text-center py-3 text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
      >
        View Menu Items
      </Link>
    </div>
  );
};
