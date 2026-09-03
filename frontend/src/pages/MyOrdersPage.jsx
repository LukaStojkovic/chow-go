/**
 * Order history.
 *
 * Filtered by a real tablist rather than a row of buttons, so arrow keys move
 * between filters and the selected one is announced. The filter lives in the
 * URL, so a filtered view can be linked and Back returns to the previous
 * filter instead of leaving the page.
 */

import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Package } from "lucide-react";

import { cn } from "@/lib/utils";
import { staggerContainer } from "@/lib/motion";
import { ACTIVE_STATUS_FILTER, toOrderViews } from "@/lib/adapters/order";
import { useGetCustomerOrders } from "@/hooks/Orders/useGetCustomerOrders";
import { useReorder } from "@/hooks/Orders/useReorder";

import { PageContainer, Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/common/StateViews";
import { OrderCard, OrderCardSkeleton } from "@/features/orders/OrderCard";
import { ReplaceBasketDialog } from "@/components/basket/ReplaceBasketDialog";

const TABS = [
  { id: "all", label: "All", status: undefined },
  { id: "active", label: "Active", status: ACTIVE_STATUS_FILTER },
  { id: "delivered", label: "Delivered", status: "delivered" },
  { id: "cancelled", label: "Cancelled", status: "cancelled,rejected" },
];

const EMPTY_COPY = {
  all: {
    title: "No orders yet",
    description: "Once you place your first order it will live here, ready to reorder.",
  },
  active: {
    title: "Nothing in progress",
    description: "You have no orders being prepared or on their way right now.",
  },
  delivered: {
    title: "No delivered orders yet",
    description: "Orders show up here once they have arrived.",
  },
  cancelled: {
    title: "No cancelled orders",
    description: "Nothing here - which is exactly how it should be.",
  },
};

export default function MyOrdersPage() {
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
            aria-label="Filter orders"
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
                  {tab.label}
                </button>
              );
            })}
          </div>

          {error ? (
            <ErrorState
              title="We could not load your orders"
              description="This is a connection problem, not a problem with your orders."
              onRetry={refetch}
            />
          ) : isLoadingOrders ? (
            <ul className="space-y-3" aria-busy="true">
              <span className="sr-only" role="status">
                Loading your orders
              </span>
              {[0, 1, 2].map((i) => (
                <OrderCardSkeleton key={i} />
              ))}
            </ul>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title={EMPTY_COPY[activeTab].title}
              description={EMPTY_COPY[activeTab].description}
              action={
                <Button asChild>
                  <Link to="/discovery">Browse restaurants</Link>
                </Button>
              }
              secondaryAction={
                activeTab !== "all" ? (
                  <Button variant="ghost" onClick={() => setTab("all")}>
                    Show all orders
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
                  aria-label="Order history pages"
                  className="flex items-center justify-center gap-3"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrev}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span aria-live="polite" className="text-body-sm text-muted-foreground tabular">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNext}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
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
