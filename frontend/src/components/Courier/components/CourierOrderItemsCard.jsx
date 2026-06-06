import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SectionLabel } from "./CourierOrderDetailSheet";

export function CourierOrderItems({ items = [], total }) {
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="px-5 py-4">
      <SectionLabel>Items · {totalItems} total</SectionLabel>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <Badge
                variant="secondary"
                className="shrink-0 font-medium text-xs rounded-md px-1.5"
              >
                ×{item.quantity}
              </Badge>
              <span className="truncate text-sm text-foreground">
                {item.name}
              </span>
            </div>
            <span className="ml-3 shrink-0 text-sm text-muted-foreground">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}

        <Separator className="my-1" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            Order total
          </span>
          <span className="text-sm font-semibold text-foreground">
            ${total?.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
