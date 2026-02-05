export function OrderItems({ order }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
      <h3 className="font-bold text-lg mb-4">Order Items</h3>

      <div className="space-y-4">
        {order.items.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0">
              {item.menuItem?.imageUrls?.[0] ? (
                <img
                  src={item.menuItem.imageUrls[0]}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-2xl">
                  🍕
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
            </div>
            <p className="font-semibold">
              ${(item.price * item.quantity).toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
          <span>${order.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
          <span>${order.deliveryFee.toFixed(2)}</span>
        </div>
        {order.tip > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tip</span>
            <span>${order.tip.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100 dark:border-zinc-800">
          <span>Total</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">Payment Method</span>
        <span className="font-semibold capitalize">{order.paymentMethod}</span>
      </div>
    </div>
  );
}
