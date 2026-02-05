import { Clock, CheckCircle2, Package, Bike, Home } from "lucide-react";

export function OrderStatusTimeline({ order }) {
  const statusSteps = [
    {
      key: "pending",
      label: "Order Placed",
      icon: Package,
      time: order.createdAt,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      icon: CheckCircle2,
      time: order.confirmedAt,
    },
    {
      key: "preparing",
      label: "Preparing",
      icon: Clock,
      time: order.preparingAt,
    },
    {
      key: "ready",
      label: "Ready",
      icon: Package,
      time: order.readyAt,
    },
    {
      key: "picked_up",
      label: "Picked Up",
      icon: Bike,
      time: order.pickedUpAt,
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: Home,
      time: order.deliveredAt,
    },
  ];

  const currentStepIndex = statusSteps.findIndex(
    (step) => step.key === order.status,
  );

  return (
    <div className="relative">
      {statusSteps.map((step, index) => {
        const isCompleted = index <= currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-start gap-4 mb-6 last:mb-0">
            <div className="relative">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                  isCompleted
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-gray-100 border-gray-300 text-gray-400 dark:bg-zinc-800 dark:border-zinc-700"
                } ${isCurrent ? "ring-4 ring-blue-600/20" : ""}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              {index < statusSteps.length - 1 && (
                <div
                  className={`absolute left-5 top-10 w-0.5 h-12 ${
                    isCompleted ? "bg-blue-600" : "bg-gray-300 dark:bg-zinc-700"
                  }`}
                />
              )}
            </div>
            <div className="flex-1 pt-2">
              <p
                className={`font-semibold ${
                  isCompleted
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {step.label}
              </p>
              {step.time && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(step.time).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
