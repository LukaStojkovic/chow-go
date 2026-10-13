import { useTranslation } from "react-i18next";
import { Download, Info, Wallet } from "lucide-react";
import { formatDate, formatPrice } from "@chowgo/shared/format";
import { normalizeCurrency } from "@chowgo/shared/currency";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/common/StateViews";
import { SellerMenuSkeleton } from "@/components/skeletons/SellerSkeletons";
import { useDownloadPayoutCsv, useSellerPayouts } from "@/hooks/SellerReports/useSellerReports";
import { useCurrency } from "@/hooks/useCurrency";
import { formatDateKey, formatKeyRange } from "@/lib/reportFormat";

const STATUS_TONE = { open: "info", due: "warning", paid: "success", nothing: "muted" };

function SummaryCard({ label, value, detail }) {
  return (
    <Card padded>
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="text-h2 tabular">{value}</p>
      {detail ? <p className="text-caption text-muted-foreground mt-0.5">{detail}</p> : null}
    </Card>
  );
}

export function SellerPayouts() {
  const { t } = useTranslation("seller");
  const fallbackCurrency = useCurrency();
  const query = useSellerPayouts();
  const download = useDownloadPayoutCsv();

  if (query.isLoading) return <SellerMenuSkeleton />;
  if (query.isError) {
    return <ErrorState title={t("payouts.loadFailed")} onRetry={() => query.refetch()} isRetrying={query.isFetching} />;
  }

  const pages = query.data?.pages ?? [];
  const first = pages[0] ?? {};
  const currency = normalizeCurrency(first.currency ?? fallbackCurrency);
  const summary = first.summary ?? {};
  const weeks = pages.flatMap((page) => page.weeks ?? []);
  const money = (amount, code = currency) => formatPrice(amount ?? 0, { currency: code });
  const lastPaid = summary.lastPaid;

  return (
    <div className="space-y-6">
      <p className="text-body-sm text-muted-foreground max-w-3xl flex gap-2">
        <Info className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
        {t("payouts.explainer")}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <SummaryCard
          label={t("payouts.summary.due")}
          value={money(summary.dueTotal)}
          detail={t("payouts.summary.weeks", { count: summary.dueWeeks ?? 0 })}
        />
        <SummaryCard label={t("payouts.summary.weeksDue")} value={summary.dueWeeks ?? 0} />
        <SummaryCard
          label={t("payouts.summary.openWeek")}
          value={money(summary.openWeek)}
          detail={t("payouts.summary.openWeekHint")}
        />
        <SummaryCard
          label={t("payouts.summary.lastPaid")}
          value={lastPaid ? money(lastPaid.amount) : t("payouts.summary.none")}
          detail={
            lastPaid
              ? t("payouts.summary.lastPaidDetail", { date: formatDate(lastPaid.paidAt), reference: lastPaid.reference })
              : null
          }
        />
      </div>

      <Card padded>
        {weeks.length === 0 ? (
          <EmptyState icon={Wallet} title={t("payouts.empty")} description={t("payouts.emptyHint")} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("payouts.columns.week")}</TableHead>
                  <TableHead className="text-right">{t("payouts.columns.orders")}</TableHead>
                  <TableHead className="text-right">{t("payouts.columns.gross")}</TableHead>
                  <TableHead className="text-right">{t("payouts.columns.discounts")}</TableHead>
                  <TableHead className="text-right">{t("payouts.columns.net")}</TableHead>
                  <TableHead>{t("payouts.columns.status")}</TableHead>
                  <TableHead>{t("payouts.columns.payment")}</TableHead>
                  <TableHead className="sr-only">{t("payouts.columns.csv")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeks.map((week) => (
                  <TableRow key={week.weekStart} data-testid={`payout-week-${week.weekStart}`}>
                    <TableCell className="whitespace-nowrap font-medium">
                      {formatKeyRange(week.weekStart, week.weekEnd)}
                    </TableCell>
                    <TableCell className="text-right tabular">{week.orders}</TableCell>
                    <TableCell className="text-right tabular">{money(week.gross, week.currency)}</TableCell>
                    <TableCell className="text-right tabular">{money(week.discounts, week.currency)}</TableCell>
                    <TableCell className="text-right tabular font-semibold">{money(week.net, week.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_TONE[week.status] ?? "muted"}>{t(`payouts.status.${week.status}`)}</Badge>
                    </TableCell>
                    <TableCell className="text-caption text-muted-foreground">
                      {week.payout ? (
                        <>
                          <p>{t("payouts.paidOn", { date: formatDate(week.payout.paidAt) })}</p>
                          {week.payout.reference ? <p>{t("payouts.reference", { reference: week.payout.reference })}</p> : null}
                          {week.adjusted ? (
                            <p className="text-warning">
                              {t("payouts.adjusted", { amount: money(week.payout.amount, week.currency) })}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {week.orders > 0 ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={t("payouts.download", { date: formatDateKey(week.weekStart) })}
                          disabled={download.isPending && download.variables === week.weekStart}
                          onClick={() => download.mutate(week.weekStart)}
                        >
                          <Download className="size-4" aria-hidden="true" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {query.hasNextPage ? (
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => query.fetchNextPage()} isLoading={query.isFetchingNextPage}>
              {t("payouts.loadOlder")}
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}

export default SellerPayouts;
