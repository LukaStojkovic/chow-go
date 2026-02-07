import { XCircle } from "lucide-react";

export function OrderCancellationAlert({ status, reason }) {
  if (!["cancelled", "rejected"].includes(status)) return null;

  const isCancelled = status === "cancelled";

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-red-900 dark:text-red-100">
          {isCancelled ? "Order Cancelled" : "Order Rejected"}
        </p>
        <p className="text-sm text-red-700 dark:text-red-300">
          {reason || `This order was ${status}`}
        </p>
      </div>
    </div>
  );
}
