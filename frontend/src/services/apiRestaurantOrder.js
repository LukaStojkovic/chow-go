import { axiosInstance } from "@/lib/axios";

export async function getRestaurantOrders({
  status,
  page = 1,
  limit = 20,
  search,
} = {}) {
  try {
    const { data } = await axiosInstance.get("/restaurant/orders", {
      params: { status, page, limit, search },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch restaurant orders:", error);
    throw error;
  }
}

export async function getRestaurantOrderById(orderId) {
  try {
    const { data } = await axiosInstance.get(`/restaurant/orders/${orderId}`);
    return data;
  } catch (error) {
    console.error("Failed to fetch order:", error);
    throw error;
  }
}

export async function confirmOrder(orderId, estimatedPreparationTime) {
  try {
    const res = await axiosInstance.patch(
      `/restaurant/orders/${orderId}/confirm`,
      {
        estimatedPreparationTime,
      },
    );
    return res.data;
  } catch (err) {
    console.error("Error confirming order:", err);
    throw err;
  }
}

export async function rejectOrder(orderId, reason) {
  try {
    const res = await axiosInstance.patch(
      `/restaurant/orders/${orderId}/reject`,
      {
        reason,
      },
    );
    return res.data;
  } catch (err) {
    console.error("Error rejecting order:", err);
    throw err;
  }
}

export async function cancelRestaurantOrder(orderId, reason) {
  try {
    const res = await axiosInstance.patch(
      `/restaurant/orders/${orderId}/cancel`,
      {
        reason,
      },
    );
    return res.data;
  } catch (err) {
    console.error("Error cancelling order:", err);
    throw err;
  }
}

export async function updateOrderStatus(orderId, status) {
  try {
    const res = await axiosInstance.patch(
      `/restaurant/orders/${orderId}/status`,
      {
        status,
      },
    );
    return res.data;
  } catch (err) {
    console.error("Error updating order status:", err);
    throw err;
  }
}
