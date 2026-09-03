export const TopItemsSection = ({ items }) => {
  const maxQty = items?.[0]?.totalQuantity || 1;

  return (
    <div className="bg-card p-6 rounded-3xl border border-border ">
      <h3 className="text-lg font-bold mb-6 ">
        Top Selling Items
      </h3>

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="font-medium truncate">
                {item.name}
              </span>
              <span className="text-muted-foreground ml-2 shrink-0">
                {item.totalQuantity} sold · ${item.totalRevenue.toFixed(0)}
              </span>
            </div>

            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
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
