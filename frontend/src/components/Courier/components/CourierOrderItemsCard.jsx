import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { Separator } from "@/components/ui/separator";
import { SectionLabel } from "./CourierOrderDetailSheet";

import { formatPrice } from "@chowgo/shared/format";
import { lineTotal } from "@chowgo/shared/money";
import { optionsSummary } from "@chowgo/shared/menuOptions";
export function CourierOrderItems({ items = [], total, currency }) {
  const { t } = useTranslation(["courier", "basket", "common"]);
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="px-5 py-4">
      <SectionLabel>{t("delivery.itemsTotal", { count: totalItems })}</SectionLabel>
      <div className="space-y-2.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-start justify-between">
            <div className="flex items-start gap-2 min-w-0">
              <Badge
                variant="secondary"
                className="shrink-0 font-medium text-xs rounded-md px-1.5"
              >
                ×{item.quantity}
              </Badge>
              <div className="min-w-0">
                <p className="truncate text-sm text-foreground">{item.name}</p>
                {optionsSummary(item.options) && (
                  <p className="text-xs text-muted-foreground">{optionsSummary(item.options)}</p>
                )}
              </div>
            </div>
            <span className="ml-3 shrink-0 text-sm text-muted-foreground">
              {formatPrice(lineTotal(item.price, item.quantity), { currency })}
            </span>
          </div>
        ))}

        <Separator className="my-1" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {t("basket:summary.total")}
          </span>
          <span className="text-sm font-semibold text-foreground">
            {formatPrice(total, { currency })}
          </span>
        </div>
      </div>
    </div>
  );
}
