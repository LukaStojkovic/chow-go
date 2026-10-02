import { useTranslation } from "react-i18next";
import { Copy, TicketPercent } from "lucide-react";
import { toast } from "sonner";

import { formatDate, formatPrice } from "@chowgo/shared/format";
import { promoDiscountLabel } from "@chowgo/shared/promoCode";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { IconButton } from "@/components/common/IconButton";
import { useMyVouchers } from "@/hooks/Promo/usePromo";

export function VouchersCard() {
  const { t } = useTranslation("promo");
  const { data: vouchers = [], isLoading } = useMyVouchers();

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t("vouchers.copied"));
    } catch {
      toast.info(code);
    }
  };

  return (
    <Card padded className="space-y-3">
      <div>
        <h2 className="text-h2">{t("vouchers.title")}</h2>
        <p className="text-body-sm text-muted-foreground">{t("vouchers.description")}</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-14 w-full rounded-md" />
      ) : vouchers.length === 0 ? (
        <p className="text-body-sm text-muted-foreground">{t("vouchers.empty")}</p>
      ) : (
        <ul className="space-y-2">
          {vouchers.map((voucher) => (
            <li key={voucher.code} className="border-border flex items-center gap-3 rounded-md border p-3">
              <TicketPercent className="text-primary size-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-body-sm font-medium">{promoDiscountLabel(t, voucher, formatPrice)}</p>
                <p className="text-caption text-muted-foreground">
                  <code>{voucher.code}</code>
                  {voucher.endsAt && ` · ${t("conditions.endsAt", { date: formatDate(voucher.endsAt) })}`}
                </p>
              </div>
              <IconButton label={t("vouchers.copy")} variant="ghost" size="icon-sm" onClick={() => copy(voucher.code)}>
                <Copy className="size-4" aria-hidden="true" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
