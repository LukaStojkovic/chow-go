import { useTranslation } from "react-i18next";

import { formatDate, formatPrice } from "@chowgo/shared/format";
import { promoDiscountLabel } from "@chowgo/shared/promoCode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_TONE = { active: "success", paused: "warning", archived: "muted" };

function validity(t, promo) {
  if (promo.startsAt && promo.endsAt) {
    return t("validity.range", { from: formatDate(promo.startsAt), to: formatDate(promo.endsAt) });
  }
  if (promo.endsAt) return t("validity.until", { date: formatDate(promo.endsAt) });
  if (promo.startsAt) return t("validity.from", { date: formatDate(promo.startsAt) });
  return t("validity.always");
}

function owner(t, promo) {
  if (promo.assignedTo) return `${t("scope.personal")} · ${promo.assignedTo.email ?? ""}`;
  if (promo.scope === "restaurant") return promo.restaurant?.name ?? t("scope.restaurant");
  return t("scope.platform");
}

export function PromoCodeTable({ items = [], isLoading, showOwner = false, onEdit, onStatus, onStats, emptyState }) {
  const { t } = useTranslation("promo");
  const columns = ["code", ...(showOwner ? ["owner"] : []), "discount", "uses", "validity", "status", "actions"];

  if (!isLoading && items.length === 0 && emptyState) return emptyState;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{t(`columns.${column}`)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((promo) => (
            <TableRow key={promo._id}>
              <TableCell>
                <code className="text-body-sm font-semibold">{promo.code}</code>
                {promo.label && <p className="text-caption text-muted-foreground">{promo.label}</p>}
              </TableCell>
              {showOwner && <TableCell className="text-body-sm">{owner(t, promo)}</TableCell>}
              <TableCell className="text-body-sm">
                {promoDiscountLabel(t, promo, formatPrice)}
                {promo.minSubtotal > 0 && (
                  <p className="text-caption text-muted-foreground">
                    {t("conditions.minSubtotal", { amount: formatPrice(promo.minSubtotal, { currency: promo.currency }) })}
                  </p>
                )}
                {promo.firstOrderOnly && <p className="text-caption text-muted-foreground">{t("conditions.firstOrderOnly")}</p>}
              </TableCell>
              <TableCell className="tabular text-body-sm">
                {promo.maxRedemptions
                  ? t("uses.limited", { used: promo.redemptionCount, max: promo.maxRedemptions })
                  : t("uses.unlimited", { used: promo.redemptionCount })}
              </TableCell>
              <TableCell className="text-body-sm whitespace-nowrap">{validity(t, promo)}</TableCell>
              <TableCell>
                <Badge variant={STATUS_TONE[promo.status]}>{t(`status.${promo.status}`)}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {onStats && (
                    <Button size="sm" variant="ghost" onClick={() => onStats(promo)}>
                      {t("actions.stats")}
                    </Button>
                  )}
                  {promo.status !== "archived" && onEdit && (
                    <Button size="sm" variant="ghost" onClick={() => onEdit(promo)}>
                      {t("actions.edit")}
                    </Button>
                  )}
                  {promo.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => onStatus(promo, "pause")}>
                      {t("actions.pause")}
                    </Button>
                  )}
                  {promo.status === "paused" && (
                    <Button size="sm" variant="outline" onClick={() => onStatus(promo, "resume")}>
                      {t("actions.resume")}
                    </Button>
                  )}
                  {promo.status !== "archived" && (
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onStatus(promo, "archive")}>
                      {t("actions.archive")}
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PromoStatsCard({ code, stats, currency }) {
  const { t } = useTranslation("promo");
  const rows = [
    ["orders", stats?.orders ?? 0],
    ["delivered", stats?.delivered ?? 0],
    ["discountGiven", formatPrice(stats?.discountGiven ?? 0, { currency })],
    ["revenue", formatPrice(stats?.revenue ?? 0, { currency })],
  ];
  return (
    <div className="space-y-3">
      <p className="text-label">{t("stats.title", { code })}</p>
      <dl className="grid grid-cols-2 gap-3">
        {rows.map(([key, value]) => (
          <div key={key} className="bg-muted rounded-md p-3">
            <dt className="text-caption text-muted-foreground">{t(`stats.${key}`)}</dt>
            <dd className="text-h3 tabular">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
