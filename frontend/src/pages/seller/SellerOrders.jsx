import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useMemo } from "react";
import { useGetRestaurantOrders } from "@/hooks/SellerOrders/useGetRestaurantOrders";
import { useConfirmOrder } from "@/hooks/SellerOrders/useConfirmOrder";
import { useRejectOrder } from "@/hooks/SellerOrders/useRejectOrder";
import { useCancelRestaurantOrder } from "@/hooks/SellerOrders/useCancelRestaurantOrder";
import { useUpdateOrderStatus } from "@/hooks/SellerOrders/useUpdateOrderStatus";
import { OrderStatsCard } from "@/components/Seller/Orders/OrderStatsCard";
import { OrdersTableHeader } from "@/components/Seller/Orders/OrdersTableHeader";
import { OrderTableRow } from "@/components/Seller/Orders/OrderTableRow";
import { OrdersTableSkeleton } from "@/components/skeletons/OrdersTableSkeleton";
import { EmptyOrdersState } from "@/components/Seller/Orders/EmptyOrdersState";
import { OrdersPagination } from "@/components/Seller/Orders/OrdersPagination";
import { ConfirmOrderDialog } from "@/components/Seller/Orders/ConfirmOrderDialog";
import { RejectOrderDialog } from "@/components/Seller/Orders/RejectOrderDialog";
import { CancelOrderDialog } from "@/components/Seller/Orders/CancelOrderDialog";
import { SellerLiveDeliveries } from "@/components/Seller/Orders/SellerLiveDeliveries";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Wifi, WifiOff } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocket } from "@/contexts/SocketContext";

export const SellerOrders = () => {
  const { t } = useTranslation(["seller", "common"]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    orderId: null,
  });
  const [rejectDialog, setRejectDialog] = useState({
    isOpen: false,
    orderId: null,
  });
  const [cancelDialog, setCancelDialog] = useState({
    isOpen: false,
    orderId: null,
  });

  const { authUser } = useAuthStore();

  const restaurantId = useMemo(() => {
    return authUser?.restaurant?.[0]?._id || null;
  }, [authUser]);

  const restaurantCoordinates =
    authUser?.restaurant?.[0]?.location?.coordinates ?? null;

  const { isConnected } = useSocket();

  const {
    orders,
    counts,
    pagination,
    isLoadingOrders,
    isFetchingOrders,
    refetch,
  } = useGetRestaurantOrders({
    status: statusFilter,
    search,
    page: currentPage,
    limit: 20,
  });

  const { orders: liveOrders } = useGetRestaurantOrders({
    status: "active",
    page: 1,
    limit: 20,
  });

  const { confirmOrder, isConfirming } = useConfirmOrder();
  const { rejectOrder, isRejecting } = useRejectOrder();
  const { cancelRestaurantOrder, isCancelling } = useCancelRestaurantOrder();
  const { updateOrderStatus, isUpdating } = useUpdateOrderStatus();

  const handleConfirmOrder = (orderId) => {
    setConfirmDialog({ isOpen: true, orderId });
  };

  const handleConfirmSubmit = (estimatedPreparationTime) => {
    confirmOrder(
      {
        orderId: confirmDialog.orderId,
        estimatedPreparationTime,
      },
      {
        onSuccess: () => {
          setConfirmDialog({ isOpen: false, orderId: null });
        },
      },
    );
  };

  const handleRejectOrder = (orderId) => {
    setRejectDialog({ isOpen: true, orderId });
  };

  const handleRejectSubmit = (reason) => {
    rejectOrder(
      {
        orderId: rejectDialog.orderId,
        reason,
      },
      {
        onSuccess: () => {
          setRejectDialog({ isOpen: false, orderId: null });
        },
      },
    );
  };

  const handleCancelOrder = (orderId) => {
    setCancelDialog({ isOpen: true, orderId });
  };

  const handleCancelSubmit = (reason) => {
    cancelRestaurantOrder(
      {
        orderId: cancelDialog.orderId,
        reason,
      },
      {
        onSuccess: () => {
          setCancelDialog({ isOpen: false, orderId: null });
        },
      },
    );
  };

  const handleMarkAsPreparing = (orderId) => {
    updateOrderStatus({ orderId, status: "preparing" });
  };

  const handleMarkAsReady = (orderId) => {
    updateOrderStatus({ orderId, status: "ready" });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (!restaurantId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">{t("noRestaurant.title")}</h2>
          <p className="text-muted-foreground">
            {t("noRestaurant.description")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("orders.title")}</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant={isConnected ? "success" : "destructive"}>
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    {t("common:state.live")}
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 mr-1" />
                    {t("common:state.offline")}
                  </>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              {isConnected ? t("orders.liveHint") : t("orders.offlineHint")}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <OrderStatsCard
            label={t("dashboard.stats.activeOrders")}
            value={counts.active}
            isLoading={isLoadingOrders}
          />
          <OrderStatsCard
            label={t("dashboard.stats.pending")}
            value={counts.pending}
            isLoading={isLoadingOrders}
          />
          <OrderStatsCard
            label={t("dashboard.stats.preparing")}
            value={counts.preparing}
            isLoading={isLoadingOrders}
          />
          <OrderStatsCard
            label={t("dashboard.stats.deliveredToday")}
            value={counts.delivered}
            isLoading={isLoadingOrders}
          />
        </div>

        <SellerLiveDeliveries
          orders={liveOrders}
          restaurantCoordinates={restaurantCoordinates}
        />

        <Card>
          <CardHeader>
            <OrdersTableHeader
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onRefresh={refetch}
              isRefreshing={isFetchingOrders}
            />
          </CardHeader>
          <CardContent>
            {isLoadingOrders && currentPage === 1 ? (
              <OrdersTableSkeleton rows={5} />
            ) : orders.length === 0 ? (
              <EmptyOrdersState statusFilter={statusFilter} />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("orders.table.id")}</TableHead>
                      <TableHead>{t("orders.table.customer")}</TableHead>
                      <TableHead>{t("orders.table.items")}</TableHead>
                      <TableHead>{t("orders.table.status")}</TableHead>
                      <TableHead>{t("orders.table.total")}</TableHead>
                      <TableHead className="text-right">{t("orders.table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <OrderTableRow
                        key={order._id}
                        order={order}
                        onConfirm={handleConfirmOrder}
                        onReject={handleRejectOrder}
                        onCancel={handleCancelOrder}
                        onMarkPreparing={handleMarkAsPreparing}
                        onMarkReady={handleMarkAsReady}
                        isConfirming={isConfirming}
                        isRejecting={isRejecting}
                        isCancelling={isCancelling}
                        isUpdating={isUpdating}
                      />
                    ))}
                  </TableBody>
                </Table>

                <OrdersPagination
                  pagination={pagination}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmOrderDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, orderId: null })}
        onConfirm={handleConfirmSubmit}
        isConfirming={isConfirming}
      />

      <RejectOrderDialog
        isOpen={rejectDialog.isOpen}
        onClose={() => setRejectDialog({ isOpen: false, orderId: null })}
        onReject={handleRejectSubmit}
        isRejecting={isRejecting}
      />

      <CancelOrderDialog
        isOpen={cancelDialog.isOpen}
        onClose={() => setCancelDialog({ isOpen: false, orderId: null })}
        onCancel={handleCancelSubmit}
        isCancelling={isCancelling}
      />
    </>
  );
};
