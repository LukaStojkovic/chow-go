import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChefHat, Clock, Clock8, Truck } from "lucide-react";

const statusIcons = {
  "Active Orders": Clock,
  Pending: Clock8,
  Preparing: ChefHat,
  "Delivered Today": Truck,
};

export function OrderStatsCard({ label, value, isLoading }) {
  const Icon = statusIcons[label] || Clock;

  return (
    <Card>
      <CardContent className="p-6 pt-4">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-100/70 dark:bg-emerald-950/50 p-3">
              <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{value || 0}</div>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
