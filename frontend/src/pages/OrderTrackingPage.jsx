import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

import BackNavbar from "@/components/Navbar/BackNavbar";
import Spinner from "@/components/Spinner";
import {
  Clock,
  MapPin,
  Phone,
  CheckCircle2,
  Package,
  Bike,
  Home,
  AlertCircle,
  XCircle,
} from "lucide-react";

import { useGetOrderById } from "@/hooks/Orders/useGetOrderById";
import { useCancelOrder } from "@/hooks/Orders/useCancelOrder";

const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, isLoadingOrder, refetch } = useGetOrderById(orderId);
  const { cancelOrder, isCancelling } = useCancelOrder();

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleCancelOrder = () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      cancelOrder(
        { orderId, reason: "Cancelled by customer" },
        {
          onSuccess: () => {
            refetch();
          },
        },
      );
    }
  };

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

  const statusSteps = [
    {
      key: "pending",
      label: "Order Placed",
      icon: Package,
      time: order.createdAt,
    },
    {
      key: "confirmed",
      label: "Confirmed",
      icon: CheckCircle2,
      time: order.confirmedAt,
    },
    {
      key: "preparing",
      label: "Preparing",
      icon: Clock,
      time: order.preparingAt,
    },
    {
      key: "ready",
      label: "Ready",
      icon: Package,
      time: order.readyAt,
    },
    {
      key: "picked_up",
      label: "Picked Up",
      icon: Bike,
      time: order.pickedUpAt,
    },
    {
      key: "delivered",
      label: "Delivered",
      icon: Home,
      time: order.deliveredAt,
    },
  ];

  const currentStepIndex = statusSteps.findIndex(
    (step) => step.key === order.status,
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "confirmed":
      case "preparing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "ready":
      case "picked_up":
      case "in_transit":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const canCancel = ![
    "picked_up",
    "in_transit",
    "delivered",
    "cancelled",
    "rejected",
  ].includes(order.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24">
      <BackNavbar title="Order Tracking" />

      <main className="container mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Order Status Header */}
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
            <span
              className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                order.status,
              )}`}
            >
              {order.status.replace("_", " ").toUpperCase()}
            </span>
          </div>

          {order.status === "cancelled" && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">
                  Order Cancelled
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {order.cancellationReason || "This order was cancelled"}
                </p>
              </div>
            </div>
          )}

          {order.status === "rejected" && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">
                  Order Rejected
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {order.rejectionReason ||
                    "This order was rejected by the restaurant"}
                </p>
              </div>
            </div>
          )}

          {/* Order Timeline */}
          {!["cancelled", "rejected"].includes(order.status) && (
            <div className="mt-6">
              <div className="relative">
                {statusSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.key}
                      className="flex items-start gap-4 mb-6 last:mb-0"
                    >
                      <div className="relative">
                        <div
                          className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                            isCompleted
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-gray-100 border-gray-300 text-gray-400 dark:bg-zinc-800 dark:border-zinc-700"
                          } ${isCurrent ? "ring-4 ring-blue-600/20" : ""}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {index < statusSteps.length - 1 && (
                          <div
                            className={`absolute left-5 top-10 w-0.5 h-12 ${
                              isCompleted
                                ? "bg-blue-600"
                                : "bg-gray-300 dark:bg-zinc-700"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pt-2">
                        <p
                          className={`font-semibold ${
                            isCompleted
                              ? "text-gray-900 dark:text-gray-100"
                              : "text-gray-400 dark:text-gray-600"
                          }`}
                        >
                          {step.label}
                        </p>
                        {step.time && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(step.time).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Restaurant & Delivery Info */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Restaurant Info */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h3 className="font-bold text-lg mb-4">Restaurant</h3>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={order.restaurant.profilePicture}
                alt={order.restaurant.name}
                className="h-14 w-14 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold">{order.restaurant.name}</p>
                <p className="text-sm text-gray-500">
                  {order.restaurant.address?.street}
                </p>
              </div>
            </div>
            <a
              href={`tel:${order.restaurant.phone}`}
              className="flex items-center gap-2 text-blue-600 hover:underline"
            >
              <Phone className="h-4 w-4" />
              <span className="text-sm">{order.restaurant.phone}</span>
            </a>
          </div>

          {/* Delivery Address */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h3 className="font-bold text-lg mb-4">Delivery Address</h3>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
              <div>
                <p className="font-semibold mb-1">
                  {order.deliveryAddressSnapshot.label}
                </p>
                <p className="text-sm text-gray-500">
                  {order.deliveryAddressSnapshot.fullAddress}
                </p>
                {order.deliveryAddressSnapshot.notes && (
                  <p className="text-sm text-gray-400 mt-2">
                    Note: {order.deliveryAddressSnapshot.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Courier Info (if assigned) */}
        {order.courier && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
            <h3 className="font-bold text-lg mb-4">Delivery Partner</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Bike className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold">{order.courier.fullName}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {order.courier.vehicleType}
                  </p>
                </div>
              </div>
              <a
                href={`tel:${order.courier.phoneNumber}`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Phone className="h-4 w-4" />
                <span className="text-sm font-medium">Call</span>
              </a>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800">
          <h3 className="font-bold text-lg mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800 shrink-0">
                  {item.menuItem?.imageUrls?.[0] ? (
                    <img
                      src={item.menuItem.imageUrls[0]}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-2xl">
                      🍕
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Delivery Fee
              </span>
              <span>${order.deliveryFee.toFixed(2)}</span>
            </div>
            {order.tip > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Tip</span>
                <span>${order.tip.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100 dark:border-zinc-800">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Payment Method
            </span>
            <span className="font-semibold capitalize">
              {order.paymentMethod}
            </span>
          </div>
        </div>

        {order.customerNotes && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-100 dark:border-blue-800">
            <h3 className="font-bold mb-2">Delivery Instructions</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {order.customerNotes}
            </p>
          </div>
        )}

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
