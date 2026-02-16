export const TopItemsSection = ({ items }) => {
  const maxQty = items?.[0]?.totalQuantity || 1;

  return (
    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800">
      <h3 className="text-lg font-bold mb-6 dark:text-white">
        Top Selling Items
      </h3>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium dark:text-white truncate">
                {item.name}
              </span>
              <span className="text-gray-500 ml-2 shrink-0">
                {item.totalQuantity} sold · ${item.totalRevenue.toFixed(0)}
              </span>
            </div>

            <div className="h-2 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{
                  width: `${(item.totalQuantity / maxQty) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
