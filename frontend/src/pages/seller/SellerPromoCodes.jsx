import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, TicketPercent } from "lucide-react";

import { RESTAURANT_PROMO_TYPES } from "@chowgo/shared/promoCode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/StateViews";
import { PromoCodeFormDialog } from "@/components/promo/PromoCodeFormDialog";
import { PromoCodeTable, PromoStatsCard } from "@/components/promo/PromoCodeTable";
import { Pager } from "@/pages/admin/AdminParts";
import { useCurrency } from "@/hooks/useCurrency";
import {
  useCreateSellerPromo,
  useSellerPromoCodes,
  useSellerPromoStats,
  useSellerPromoStatus,
  useUpdateSellerPromo,
} from "@/hooks/Promo/usePromo";

export function SellerPromoCodes() {
  const { t } = useTranslation("promo");
  const currency = useCurrency();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [archiving, setArchiving] = useState(null);
  const [statsFor, setStatsFor] = useState(null);

  const list = useSellerPromoCodes({ page, limit: 20 });
  const create = useCreateSellerPromo();
  const update = useUpdateSellerPromo();
  const status = useSellerPromoStatus();
  const stats = useSellerPromoStats(statsFor?._id);

  const save = (payload) => {
    const done = { onSuccess: () => setEditing(null) };
    if (editing?._id) update.mutate({ id: editing._id, ...payload }, done);
    else create.mutate(payload, done);
  };

  const changeStatus = (promo, action) => {
    if (action === "archive") setArchiving(promo);
    else status.mutate({ id: promo._id, action });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-body-sm text-muted-foreground max-w-2xl">{t("manage.description")}</p>
        <Button onClick={() => setEditing({})}>
          <Plus className="size-4" aria-hidden="true" />
          {t("manage.create")}
        </Button>
      </header>

      <Card padded>
        {list.isError ? (
          <p className="text-body-sm text-destructive py-6">{t("manage.loadFailed")}</p>
        ) : (
          <PromoCodeTable
            items={list.data?.items}
            isLoading={list.isLoading}
            onEdit={setEditing}
            onStatus={changeStatus}
            onStats={setStatsFor}
            emptyState={
              <EmptyState
                icon={TicketPercent}
                title={t("manage.empty")}
                description={t("manage.emptyDescription")}
                action={<Button onClick={() => setEditing({})}>{t("manage.create")}</Button>}
              />
            }
          />
        )}
        <Pager pagination={list.data?.pagination} onPage={setPage} />
      </Card>

      {editing && (
        <PromoCodeFormDialog
          key={editing._id ?? "new"}
          open
          promo={editing}
          types={RESTAURANT_PROMO_TYPES}
          currency={currency}
          isSaving={create.isPending || update.isPending}
          onSubmit={save}
          onClose={() => setEditing(null)}
        />
      )}

      <AlertDialog open={Boolean(archiving)} onOpenChange={(open) => !open && setArchiving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("actions.archive")}</AlertDialogTitle>
            <AlertDialogDescription>{t("manage.archiveConfirm", { code: archiving?.code })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("manage.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                status.mutate({ id: archiving._id, action: "archive" });
                setArchiving(null);
              }}
            >
              {t("actions.archive")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={Boolean(statsFor)} onOpenChange={(open) => !open && setStatsFor(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="sr-only">{t("stats.title", { code: statsFor?.code })}</DialogTitle>
          </DialogHeader>
          <PromoStatsCard code={statsFor?.code} stats={stats.data?.stats} currency={currency} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SellerPromoCodes;
