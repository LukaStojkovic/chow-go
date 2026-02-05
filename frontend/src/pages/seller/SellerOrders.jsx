import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSellerOrderSocket } from "@/components/Seller/hooks/useSellerOrderSocket";

export const SellerOrders = () => {
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

  const { isConnected } = useSellerOrderSocket(restaurantId);

  const { orders, counts, pagination, isLoadingOrders, refetch } =
    useGetRestaurantOrders({
      status: statusFilter,
      search,
      page: currentPage,
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
          <h2 className="text-xl font-bold mb-2">No Restaurant Found</h2>
          <p className="text-muted-foreground">
            Please create a restaurant first to manage orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders</h1>
          <Badge variant={isConnected ? "success" : "destructive"}>
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <OrderStatsCard
            label="Active Orders"
            value={counts.active}
            isLoading={isLoadingOrders}
          />
          <OrderStatsCard
            label="Pending"
            value={counts.pending}
            isLoading={isLoadingOrders}
          />
          <OrderStatsCard
            label="Preparing"
            value={counts.preparing}
            isLoading={isLoadingOrders}
          />
          <OrderStatsCard
            label="Delivered Today"
            value={counts.delivered}
            isLoading={isLoadingOrders}
          />
        </div>

        <Card>
          <CardHeader>
            <OrdersTableHeader
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              onRefresh={refetch}
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
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
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
