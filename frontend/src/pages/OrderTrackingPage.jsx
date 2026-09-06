/**
 * Live order tracking.
 *
 * Refetches on socket events for this order, so the timeline moves without a
 * reload. The status heading is an `aria-live` region inside the timeline, and
 * the map is supplementary - every piece of information it conveys is also
 * available as text above it.
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  CircleAlert,
  LifeBuoy,
  MapPin,
  Package,
  Phone,
  RotateCcw,
  Store,
} from "lucide-react";

import { formatOrderDate } from "@chowgo/shared/format";
import { toOrderView } from "@chowgo/shared/adapters/order";
import { useGetOrderById } from "@/hooks/Orders/useGetOrderById";
import { useCancelOrder } from "@/hooks/Orders/useCancelOrder";
import { useReorder } from "@/hooks/Orders/useReorder";
import { useSocket } from "@/contexts/SocketContext";

import { ContentShell, PageContainer, Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/common/StateViews";
import { Avatar } from "@/components/common/SmartImage";
import { OrderStatusBadge } from "@/components/common/StatusBadges";
import { RatingDisplay } from "@/components/common/Meta";
import { BasketLine } from "@/components/basket/BasketLine";
import { FeeBreakdown } from "@/components/basket/FeeBreakdown";
import { ReplaceBasketDialog } from "@/components/basket/ReplaceBasketDialog";
import { OrderStatusTimeline } from "@/features/orders/OrderStatusTimeline";
import { OrderRating } from "@/features/orders/OrderRating";
import { OrderTrackingLiveMap } from "@/components/OrderTracking/OrderTrackingLiveMap";

/** A labelled block of order metadata. */
function InfoCard({ icon: Icon, title, children, action }) {
  return (
    <Card padded className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-h3 flex items-center gap-2">
          <Icon className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </Card>
  );
}

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const { order: raw, isLoadingOrder, error, refetch } = useGetOrderById(orderId);
  const { cancelOrder, isCancelling } = useCancelOrder();
  const { reorder, isReordering, conflict, confirmReplace, cancelReplace } = useReorder();
  const { socket, isConnected } = useSocket();
  const [showSupport, setShowSupport] = useState(false);

  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleUpdate = (data) => {
      const updatedId = data.order?._id || data.orderId;
      if (updatedId === orderId) refetch();
    };

    socket.on("order:updated", handleUpdate);
    socket.on("order:status_changed", handleUpdate);
    socket.on("order:cancelled", handleUpdate);

    return () => {
      socket.off("order:updated", handleUpdate);
      socket.off("order:status_changed", handleUpdate);
      socket.off("order:cancelled", handleUpdate);
    };
  }, [socket, isConnected, orderId, refetch]);

  if (isLoadingOrder) {
    return (
      <PageContainer width="reading" className="py-6">
        <span className="sr-only" role="status">
          Loading your order
        </span>
        <ContentShell
          main={
            <Stack gap="lg">
              <Skeleton className="h-64 w-full rounded-md" />
              <Skeleton className="h-48 w-full rounded-md" />
            </Stack>
          }
          aside={<Skeleton className="h-72 w-full rounded-md" />}
        />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer width="reading" className="py-10">
        <ErrorState
          title="We could not load this order"
          description="The connection dropped on the way. Your order is not affected."
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const order = toOrderView(raw);

  if (!order) {
    return (
      <PageContainer width="reading" className="py-10">
        <EmptyState
          icon={Package}
          title="Order not found"
          description="This order does not exist, or it belongs to a different account."
          action={
            <Button asChild>
              <Link to="/orders">View your orders</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const isCancelled = order.lifecycle === "cancelled";

  return (
    <>
      <PageContainer width="reading" className="py-6">
        <ContentShell
          main={
            <Stack gap="lg">
              <Card padded className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="text-h1 tabular">Order #{order.number}</h1>
                    <p className="text-body-sm text-muted-foreground mt-0.5">
                      Placed {formatOrderDate(order.placedAt)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} size="lg" />
                </div>

                {isCancelled ? (
                  <div
                    role="status"
                    className="border-destructive/30 bg-destructive-subtle flex items-start gap-2.5 rounded-md border p-3"
                  >
                    <CircleAlert
                      className="text-destructive mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-label text-foreground">{order.statusLabel}</p>
                      <p className="text-body-sm text-muted-foreground mt-0.5">
                        {order.cancellationReason ||
                          "No reason was given. If you were charged, it will be refunded."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <OrderStatusTimeline order={order} />
                )}
              </Card>

              {!isCancelled && <OrderTrackingLiveMap orderId={orderId} order={raw} />}

              {order.courier && (
                <InfoCard
                  icon={Package}
                  title="Your courier"
                  action={
                    order.courier.phone ? (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`tel:${order.courier.phone}`}>
                          <Phone aria-hidden="true" />
                          Call
                        </a>
                      </Button>
                    ) : null
                  }
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={order.courier.avatar} name={order.courier.name} />
                    <div className="min-w-0 flex-1">
                      <p className="text-label truncate">{order.courier.name}</p>
                      <div className="flex items-center gap-2">
                        {order.courier.rating && (
                          <RatingDisplay rating={order.courier.rating} showCount={false} />
                        )}
                        {order.courier.vehicle && (
                          <span className="text-body-sm text-muted-foreground capitalize">
                            {order.courier.vehicle}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </InfoCard>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={Store}
                  title="Restaurant"
                  action={
                    order.restaurant?.id ? (
                      <Button variant="link" size="sm" asChild>
                        <Link to={`/restaurant/${order.restaurant.id}`}>View menu</Link>
                      </Button>
                    ) : null
                  }
                >
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={order.restaurant?.logo}
                      name={order.restaurant?.name || "Restaurant"}
                    />
                    <div className="min-w-0">
                      <p className="text-label truncate">
                        {order.restaurant?.name || "Restaurant"}
                      </p>
                      {order.restaurant?.address && (
                        <p className="text-body-sm text-muted-foreground truncate">
                          {order.restaurant.address.oneLine}
                        </p>
                      )}
                    </div>
                  </div>
                </InfoCard>

                <InfoCard icon={MapPin} title="Delivering to">
                  <p className="text-body-sm text-muted-foreground">
                    {order.deliveryAddress || "No address recorded"}
                  </p>
                  {order.deliveryNotes && (
                    <p className="text-caption text-muted-foreground italic">
                      {order.deliveryNotes}
                    </p>
                  )}
                </InfoCard>
              </div>

              {order.notes && (
                <InfoCard icon={LifeBuoy} title="Your instructions">
                  <p className="text-body-sm text-muted-foreground">{order.notes}</p>
                </InfoCard>
              )}

              {order.status === "delivered" && <OrderRating order={order} />}
            </Stack>
          }
          aside={
            <Stack gap="lg">
              <Card className="overflow-hidden">
                <div className="border-border border-b p-4">
                  <h2 className="text-h3">
                    {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
                  </h2>
                </div>
                <div className="max-h-80 overflow-y-auto px-4">
                  <ul className="divide-border divide-y">
                    {order.items.map((line) => (
                      <BasketLine key={line.id} line={line} mode="summary" />
                    ))}
                  </ul>
                </div>
                <div className="border-border border-t p-4">
                  <FeeBreakdown pricing={order.pricing} totalLabel="Total" />
                  <p className="text-caption text-muted-foreground mt-2">
                    Paying by {order.paymentMethodLabel.toLowerCase()}
                  </p>
                </div>
              </Card>

              <Stack gap="sm">
                {order.canReorder && (
                  <Button
                    variant="outline"
                    block
                    isLoading={isReordering}
                    loadingLabel="Adding to basket"
                    onClick={() => reorder(raw)}
                  >
                    <RotateCcw aria-hidden="true" />
                    Order again
                  </Button>
                )}

                <Button variant="ghost" block onClick={() => setShowSupport(true)}>
                  <LifeBuoy aria-hidden="true" />
                  Get help with this order
                </Button>

                {order.canCancel && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" block className="text-destructive hover:bg-destructive-subtle">
                        Cancel order
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                        <AlertDialogDescription>
                          The restaurant will be told to stop preparing it. This cannot be
                          undone - you would need to place a new order.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep my order</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={isCancelling}
                          onClick={() =>
                            cancelOrder({ orderId, reason: "Cancelled by customer" })
                          }
                          className={cn(buttonVariants({ variant: "destructive" }))}
                        >
                          {isCancelling ? "Cancelling..." : "Yes, cancel it"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </Stack>
            </Stack>
          }
        />
      </PageContainer>

      {/* Support is a real dialog rather than a dead "Contact us" link: there
          is no ticketing endpoint, so it gives people the two channels that
          actually exist. */}
      <AlertDialog open={showSupport} onOpenChange={setShowSupport}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Help with order #{order.number}</AlertDialogTitle>
            <AlertDialogDescription>
              Something wrong with this order? The restaurant can usually sort it out
              fastest while the order is still being prepared.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            {order.restaurant?.phone && (
              <Button variant="outline" block asChild>
                <a href={`tel:${order.restaurant.phone}`}>
                  <Phone aria-hidden="true" />
                  Call {order.restaurant.name}
                </a>
              </Button>
            )}
            {order.courier?.phone && (
              <Button variant="outline" block asChild>
                <a href={`tel:${order.courier.phone}`}>
                  <Phone aria-hidden="true" />
                  Call {order.courier.name}
                </a>
              </Button>
            )}
            <Button variant="outline" block asChild>
              <a href={`mailto:support@chowandgo.example?subject=Order%20%23${order.number}`}>
                Email support
              </a>
            </Button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReplaceBasketDialog
        open={Boolean(conflict)}
        currentRestaurantName={conflict?.currentRestaurantName}
        nextRestaurantName={order.restaurant?.name}
        onConfirm={confirmReplace}
        onCancel={cancelReplace}
      />
    </>
  );
}
