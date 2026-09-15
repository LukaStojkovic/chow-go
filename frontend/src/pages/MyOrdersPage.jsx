/**
 * Order history.
 *
 * Filtered by a real tablist rather than a row of buttons, so arrow keys move
 * between filters and the selected one is announced. The filter lives in the
 * URL, so a filtered view can be linked and Back returns to the previous
 * filter instead of leaving the page.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Package } from "lucide-react";

import { cn } from "@/lib/utils";
import { staggerContainer } from "@/lib/motion";
import { ACTIVE_STATUS_FILTER, toOrderViews } from "@chowgo/shared/adapters/order";
import { useGetCustomerOrders } from "@/hooks/Orders/useGetCustomerOrders";
import { useReorder } from "@/hooks/Orders/useReorder";

import { PageContainer, Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/common/StateViews";
import { OrderCard, OrderCardSkeleton } from "@/features/orders/OrderCard";
import { ReplaceBasketDialog } from "@/components/basket/ReplaceBasketDialog";

// Both tables are module scope, so they hold keys rather than copy - a
// resolved label here would be frozen in whichever language loaded first.
const TABS = [
  { id: "all", labelKey: "history.tabs.all", status: undefined },
  { id: "active", labelKey: "history.tabs.active", status: ACTIVE_STATUS_FILTER },
  { id: "delivered", labelKey: "history.tabs.delivered", status: "delivered" },
  { id: "cancelled", labelKey: "history.tabs.cancelled", status: "cancelled,rejected" },
];

export default function MyOrdersPage() {
  const { t } = useTranslation(["order", "basket", "common"]);
  const [searchParams, setSearchParams] = useSearchParams();

  const rawTab = searchParams.get("filter") ?? "all";
  const activeTab = TABS.some((tab) => tab.id === rawTab) ? rawTab : "all";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const status = TABS.find((tab) => tab.id === activeTab)?.status;
  const { orders: rawOrders, pagination, isLoadingOrders, error, refetch } =
    useGetCustomerOrders({ status, page, limit: 10 });

  const { reorder, reorderingId, conflict, confirmReplace, cancelReplace } = useReorder();

  const orders = useMemo(() => toOrderViews(rawOrders), [rawOrders]);

  const setTab = (tabId) => setSearchParams(tabId === "all" ? {} : { filter: tabId });
  const setPage = (nextPage) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  return (
    <>
      <PageContainer width="reading" className="py-6">
        <Stack gap="lg">
          <div
            role="tablist"
            aria-label={t("history.filterLabel")}
            className="border-border scrollbar-hide flex gap-1 overflow-x-auto rounded-md border p-1"
          >
            {TABS.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setTab(tab.id)}
                  onKeyDown={(event) => {
                    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                    event.preventDefault();
                    const index = TABS.findIndex((t) => t.id === activeTab);
                    const delta = event.key === "ArrowRight" ? 1 : -1;
                    setTab(TABS[(index + delta + TABS.length) % TABS.length].id);
                  }}
                  className={cn(
                    "h-9 flex-1 rounded-sm px-3 text-label whitespace-nowrap",
                    "transition-colors duration-(--duration-micro) ease-(--ease-standard)",
                    "outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>

          {error ? (
            <ErrorState
              title={t("list.error.title")}
              description={t("history.error.description")}
              onRetry={refetch}
            />
          ) : isLoadingOrders ? (
            <ul className="space-y-3" aria-busy="true">
              <span className="sr-only" role="status">
                {t("history.loading")}
              </span>
              {[0, 1, 2].map((i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </ul>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title={t(`history.empty.${activeTab}.title`)}
              description={t(`history.empty.${activeTab}.description`)}
              action={
                <Button asChild>
                  <Link to="/discovery">{t("basket:empty.action")}</Link>
                </Button>
              }
              secondaryAction={
                activeTab !== "all" ? (
                  <Button variant="ghost" onClick={() => setTab("all")}>
                    {t("history.showAll")}
                  </Button>
                ) : null
              }
            />
          ) : (
            <>
              <motion.ul
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="space-y-3"
              >
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    isReordering={reorderingId === order.id}
                    onReorder={() =>
                      reorder(rawOrders.find((candidate) => candidate._id === order.id))
                    }
                  />
                ))}
              </motion.ul>

              {pagination?.totalPages > 1 && (
                <nav
                  aria-label={t("history.pagesLabel")}
                  className="flex items-center justify-center gap-3"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage(page - 1)}
                  >
                    {t("common:a11y.previous")}
                  </Button>
                  <span aria-live="polite" className="text-body-sm text-muted-foreground tabular">
                    {t("history.pageOf", {
                      current: pagination.currentPage,
                      total: pagination.totalPages,
                    })}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage(page + 1)}
                  >
                    {t("common:a11y.next")}
                  </Button>
                </nav>
              )}
            </>
          )}
        </Stack>
      </PageContainer>

      <ReplaceBasketDialog
        open={Boolean(conflict)}
        currentRestaurantName={conflict?.currentRestaurantName}
        nextRestaurantName={conflict?.order?.restaurant?.name}
        onConfirm={confirmReplace}
        onCancel={cancelReplace}
      />
    </>
  );
}
