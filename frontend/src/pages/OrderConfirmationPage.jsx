/**
 * Order confirmation.
 *
 * A calm receipt, not a celebration. One quiet check mark, the number the
 * customer would quote to support, the total they will pay, what arrives and
 * where - then the three things they might reasonably want to do next.
 */

import { motion } from "framer-motion";
import { Link, Navigate, useParams } from "react-router-dom";
import { Check, LifeBuoy, MapPin, Navigation } from "lucide-react";

import { transitions } from "@/lib/motion";
import { formatOrderDate } from "@/lib/format";
import { toOrderView } from "@/lib/adapters/order";
import { useGetOrderById } from "@/hooks/Orders/useGetOrderById";

import { PageContainer, Stack } from "@/components/layout/primitives";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/StateViews";
import { Avatar } from "@/components/common/SmartImage";
import { BasketLine } from "@/components/basket/BasketLine";
import { FeeBreakdown } from "@/components/basket/FeeBreakdown";

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { order: raw, isLoadingOrder, error, refetch } = useGetOrderById(orderId);

  if (isLoadingOrder) {
    return (
      <PageContainer width="narrow" withBottomNav={false} className="py-8">
        <span className="sr-only" role="status">
          Loading your order
        </span>
        <Stack gap="xl">
          <Skeleton className="mx-auto size-12 rounded-full" />
          <Skeleton className="mx-auto h-7 w-56" />
          <Skeleton className="h-64 w-full rounded-md" />
        </Stack>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer width="narrow" withBottomNav={false} className="py-10">
        <ErrorState
          title="We could not load your order"
          description="Your order was placed - this page just could not fetch it. It is in your order history."
          onRetry={refetch}
        />
      </PageContainer>
    );
  }

  const order = toOrderView(raw);
  if (!order) return <Navigate to="/orders" replace />;

  return (
    <PageContainer width="narrow" withBottomNav={false} className="py-8">
      <Stack gap="xl">
        <div className="flex flex-col items-center text-center">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={transitions.standard}
            className="bg-success-subtle mb-3 flex size-12 items-center justify-center rounded-full"
          >
            <Check className="text-success size-6" aria-hidden="true" />
          </motion.span>

          <h1 className="text-h1">Your order is on its way to the restaurant</h1>
          <p className="text-body text-muted-foreground mt-1.5 max-w-sm">
            {order.restaurant?.name ?? "The restaurant"} will confirm it in the next few
            minutes. We will keep you posted.
          </p>
        </div>

        <Card padded className="space-y-4">
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-caption text-muted-foreground">Order number</dt>
              <dd className="text-h3 tabular mt-0.5">#{order.number}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Placed</dt>
              <dd className="text-body mt-0.5">{formatOrderDate(order.placedAt)}</dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Estimated arrival</dt>
              <dd className="text-body mt-0.5">
                {order.restaurant?.deliveryEstimate ?? "30-45 min"}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-muted-foreground">Paying by</dt>
              <dd className="text-body mt-0.5">{order.paymentMethodLabel}</dd>
            </div>
          </dl>

          {order.deliveryAddress && (
            <div className="border-border border-t pt-3">
              <p className="text-caption text-muted-foreground">Delivering to</p>
              <p className="text-body mt-0.5 flex items-start gap-2">
                <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{order.deliveryAddress}</span>
              </p>
            </div>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-border flex items-center gap-3 border-b p-4">
            <Avatar
              src={order.restaurant?.logo}
              name={order.restaurant?.name || "Restaurant"}
            />
            <h2 className="text-h3 min-w-0 flex-1 truncate">
              {order.restaurant?.name || "Your order"}
            </h2>
          </div>

          <div className="px-4">
            <ul className="divide-border divide-y">
              {order.items.map((line) => (
                <BasketLine key={line.id} line={line} mode="summary" />
              ))}
            </ul>
          </div>

          <div className="border-border border-t p-4">
            <FeeBreakdown pricing={order.pricing} totalLabel="Total to pay" />
          </div>
        </Card>

        <Stack gap="sm">
          <Button size="lg" block asChild>
            <Link to={`/orders/${order.id}`}>
              <Navigation aria-hidden="true" />
              Track this order
            </Link>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" asChild>
              <Link to="/discovery">Keep browsing</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/orders">
                <LifeBuoy aria-hidden="true" />
                All orders
              </Link>
            </Button>
          </div>
        </Stack>
      </Stack>
    </PageContainer>
  );
}
