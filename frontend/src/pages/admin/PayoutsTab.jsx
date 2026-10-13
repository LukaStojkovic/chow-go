import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate, formatPrice } from "@chowgo/shared/format";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stack } from "@/components/layout/primitives";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAdminAction } from "@/hooks/Admin/useAdmin";
import { useAdminPayouts } from "@/hooks/Admin/useAdminPayouts";
import { formatKeyRange } from "@/lib/reportFormat";
import { markAdminPayoutPaid, voidAdminPayout } from "@/services/apiAdmin";
import { Pager } from "./AdminParts";

function PayoutTable({ columns, rows, isLoading, renderRow }) {
  const { t } = useTranslation("admin");
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{t(`payouts.columns.${column}`)}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && !isLoading ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-muted-foreground text-center py-8">
                {t("payouts.empty")}
              </TableCell>
            </TableRow>
          ) : (
            rows.map(renderRow)
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function MarkPaidDialog({ row, onClose }) {
  const { t } = useTranslation("admin");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const mark = useAdminAction(markAdminPayoutPaid);

  const submit = (event) => {
    event.preventDefault();
    mark.mutate(
      { restaurantId: row.restaurant.id, weekStart: row.weekStart, reference: reference.trim(), note: note.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form className="space-y-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t("payouts.markPaidTitle", { name: row.restaurant.name ?? row.restaurant.id })}</DialogTitle>
            <DialogDescription>
              {t("payouts.markPaidDescription", {
                week: formatKeyRange(row.weekStart, row.weekEnd),
                amount: formatPrice(row.net, { currency: row.currency }),
              })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="payout-reference">{t("payouts.reference")}</Label>
            <Input
              id="payout-reference"
              value={reference}
              maxLength={80}
              required
              placeholder={t("payouts.referencePlaceholder")}
              onChange={(event) => setReference(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="payout-note">{t("payouts.note")}</Label>
            <Textarea id="payout-note" value={note} maxLength={300} onChange={(event) => setNote(event.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("payouts.cancel")}
            </Button>
            <Button type="submit" disabled={!reference.trim()} isLoading={mark.isPending}>
              {t("payouts.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PayoutsTab({ ask }) {
  const { t } = useTranslation("admin");
  const [view, setView] = useState("due");
  const [page, setPage] = useState(1);
  const [marking, setMarking] = useState(null);
  const params = view === "paid" ? { status: "paid", page } : {};
  const query = useAdminPayouts(params);
  const voidPayout = useAdminAction(voidAdminPayout);
  const data = query.data ?? {};
  const pagination = data.pagination
    ? { page: data.pagination.page, pages: Math.max(1, Math.ceil(data.pagination.total / data.pagination.limit)) }
    : null;

  return (
    <Stack gap="sm">
      <p className="text-body-sm text-muted-foreground">{t("payouts.hint", { weeks: data.weeks ?? 12 })}</p>
      <div className="flex gap-2">
        {["due", "paid"].map((option) => (
          <Button
            key={option}
            size="sm"
            variant={view === option ? "primary" : "outline"}
            aria-pressed={view === option}
            onClick={() => {
              setView(option);
              setPage(1);
            }}
          >
            {t(`payouts.${option}`)}
          </Button>
        ))}
      </div>

      {query.isError ? (
        <p className="text-body-sm text-destructive py-6">{t("loadFailed")}</p>
      ) : view === "due" ? (
        <PayoutTable
          columns={["restaurant", "week", "orders", "net", "actions"]}
          rows={data.due ?? []}
          isLoading={query.isLoading || query.isPlaceholderData}
          renderRow={(row) => (
            <TableRow key={`${row.restaurant.id}:${row.weekStart}`}>
              <TableCell className="font-medium">{row.restaurant.name ?? row.restaurant.id}</TableCell>
              <TableCell className="whitespace-nowrap">{formatKeyRange(row.weekStart, row.weekEnd)}</TableCell>
              <TableCell className="tabular">{row.orders}</TableCell>
              <TableCell className="tabular font-semibold">{formatPrice(row.net, { currency: row.currency })}</TableCell>
              <TableCell>
                <Button size="sm" onClick={() => setMarking(row)}>
                  {t("payouts.markPaid")}
                </Button>
              </TableCell>
            </TableRow>
          )}
        />
      ) : (
        <>
          <PayoutTable
            columns={["restaurant", "week", "net", "reference", "paidAt", "actions"]}
            rows={data.payouts ?? []}
            isLoading={query.isLoading || query.isPlaceholderData}
            renderRow={(row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.restaurant?.name ?? row.restaurant?.id}</TableCell>
                <TableCell className="whitespace-nowrap">{formatKeyRange(row.weekStart, row.weekEnd)}</TableCell>
                <TableCell className="tabular font-semibold">{formatPrice(row.net, { currency: row.currency })}</TableCell>
                <TableCell>
                  <p>{row.reference}</p>
                  {row.note ? <p className="text-caption text-muted-foreground max-w-56">{row.note}</p> : null}
                </TableCell>
                <TableCell className="whitespace-nowrap">{formatDate(row.paidAt)}</TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      ask({
                        title: t("reason.title", { action: t("payouts.voidAction"), name: row.reference }),
                        required: true,
                        destructive: true,
                        run: (reason) => voidPayout.mutateAsync({ id: row.id, reason }),
                      })
                    }
                  >
                    {t("payouts.void")}
                  </Button>
                </TableCell>
              </TableRow>
            )}
          />
          <Pager pagination={pagination} onPage={setPage} />
        </>
      )}

      {marking ? <MarkPaidDialog key={`${marking.restaurant.id}:${marking.weekStart}`} row={marking} onClose={() => setMarking(null)} /> : null}
    </Stack>
  );
}
