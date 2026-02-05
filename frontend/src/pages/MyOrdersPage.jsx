import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import BackNavbar from "@/components/Navbar/BackNavbar";
import Spinner from "@/components/Spinner";
import {
  Clock,
  Package,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { useGetCustomerOrders } from "@/hooks/Orders/useGetCustomerOrders";

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const statusParam =
    activeTab === "all"
      ? undefined
      : activeTab === "active"
        ? "pending,confirmed,preparing,ready,picked_up,in_transit"
        : activeTab;

  const { orders, pagination, isLoadingOrders } = useGetCustomerOrders({
    status: statusParam,
    page: currentPage,
    limit: 10,
  });

  const tabs = [
    { id: "all", label: "All Orders" },
    { id: "active", label: "Active" },
    { id: "delivered", label: "Delivered" },
    { id: "cancelled", label: "Cancelled" },
  ];

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <CheckCircle2 className="h-5 w-5" />;
      case "cancelled":
      case "rejected":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  if (isLoadingOrders && currentPage === 1) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24">
      <BackNavbar title="My Orders" />

      <main className="container mx-auto max-w-4xl px-4 py-6">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-2 shadow-sm border border-gray-100 dark:border-zinc-800 mb-6">
          <div className="grid grid-cols-4 gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`py-2 px-4 rounded-lg text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 text-center shadow-sm border border-gray-100 dark:border-zinc-800">
            <Package className="h-16 w-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No orders found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {activeTab === "all"
                ? "You haven't placed any orders yet"
                : `You don't have any ${activeTab} orders`}
            </p>
            <button
              onClick={() => navigate("/discovery")}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              Start Ordering
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order._id}
                onClick={() => navigate(`/orders/${order._id}`)}
                className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-zinc-800 hover:shadow-md transition cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={order.restaurant?.profilePicture}
                      alt={order.restaurant?.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-lg">
                        {order.restaurant?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${getStatusColor(
                      order.status,
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    {order.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <p className="text-sm text-gray-500">
                      +{order.items.length - 2} more items
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Order #{order.orderNumber}
                  </span>
                  <span className="text-lg font-bold">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))
              }
              disabled={!pagination.hasNext}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-zinc-800 transition"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyOrdersPage;
