import { useParams, useNavigate } from "react-router-dom";
import BackNavbar from "@/components/Navbar/BackNavbar";
import Spinner from "@/components/Spinner";
import { AlertCircle } from "lucide-react";
import { useGetOrderById } from "@/hooks/Orders/useGetOrderById";
import { useCancelOrder } from "@/hooks/Orders/useCancelOrder";
import { OrderStatusBadge } from "@/components/OrderTracking/OrderStatusBadge";
import { OrderStatusTimeline } from "@/components/OrderTracking/OrderStatusTimeline";
import { OrderCancellationAlert } from "@/components/OrderTracking/OrderCancellationAlert";
import { RestaurantInfo } from "@/components/OrderTracking/RestaurantInfo";
import { DeliveryAddressInfo } from "@/components/OrderTracking/DeliveryAddressInfo";
import { CourierInfo } from "@/components/OrderTracking/CourierInfo";
import { OrderItems } from "@/components/OrderTracking/OrderItems";
import { DeliveryInstructions } from "@/components/OrderTracking/DeliveryInstructions";

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, isLoadingOrder } = useGetOrderById(orderId);
  const { cancelOrder, isCancelling } = useCancelOrder();

  const handleCancelOrder = () => {
    cancelOrder({ orderId, reason: "Cancelled by customer" });
  };

  const canCancel =
    order &&
    !["picked_up", "in_transit", "delivered", "cancelled", "rejected"].includes(
      order.status,
    );

  if (isLoadingOrder) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-6">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order not found</h2>
        <button
          onClick={() => navigate("/orders")}
          className="text-blue-600 font-medium hover:underline"
        >
          View all orders
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24">
      <BackNavbar title="Order Tracking" />

      <main className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">
                Order #{order.orderNumber}
              </h1>
              <p className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          <OrderCancellationAlert
            status={order.status}
            reason={order.cancellationReason || order.rejectionReason}
          />

          {!["cancelled", "rejected"].includes(order.status) && (
            <div className="mt-6">
              <OrderStatusTimeline order={order} />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <RestaurantInfo restaurant={order.restaurant} />
          <DeliveryAddressInfo address={order.deliveryAddressSnapshot} />
        </div>

        <CourierInfo courier={order.courier} />

        <OrderItems order={order} />

        <DeliveryInstructions notes={order.customerNotes} />

        {canCancel && (
          <button
            onClick={handleCancelOrder}
            disabled={isCancelling}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCancelling ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
      </main>
    </div>
  );
};

export default OrderTrackingPage;
