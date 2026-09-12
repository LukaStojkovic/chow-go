import { axiosInstance } from "@/lib/axios";

export async function createOrder({ idempotencyKey, ...orderData }) {
  try {
    // The backend returns the original order for a repeated key rather than
    // creating a second one, so a double-tap cannot place two orders.
    const res = await axiosInstance.post("/orders/create", orderData, {
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    });
    return res.data;
  } catch (err) {
    console.error("Error creating order:", err);
    throw err;
  }
}

export async function getCustomerOrders({ status, page = 1, limit = 10 } = {}) {
  try {
    const { data } = await axiosInstance.get("/orders/my-orders", {
      params: { status, page, limit },
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch customer orders:", error);
    throw error;
  }
}

export async function getOrderById(orderId) {
  try {
    const { data } = await axiosInstance.get(`/orders/${orderId}`);
    return data;
  } catch (error) {
    console.error("Failed to fetch order:", error);
    throw error;
  }
}

export async function cancelOrder(orderId, reason) {
  try {
    const res = await axiosInstance.patch(`/orders/${orderId}/cancel`, {
      reason,
    });
    return res.data;
  } catch (err) {
    console.error("Error cancelling order:", err);
    throw err;
  }
}

export async function rateOrder(orderId, payload) {
  try {
    const res = await axiosInstance.patch(`/orders/${orderId}/rate`, payload);
    return res.data;
  } catch (err) {
    console.error("Error rating order:", err);
    throw err;
  }
}
