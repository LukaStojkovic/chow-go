import { api } from "@/api/client";

export async function getRestaurantReviews(restaurantId, params) {
  const { data } = await api.get(`/restaurants/${restaurantId}/reviews`, { params });
  return data.data;
}

export async function getSellerReviews(params) {
  const { data } = await api.get("/restaurant/reviews", { params });
  return data.data;
}

export async function saveReviewReply({ orderId, text }) {
  const { data } = await api.put(`/restaurant/reviews/${orderId}/reply`, { text });
  return data.data.review;
}

export async function deleteReviewReply(orderId) {
  const { data } = await api.delete(`/restaurant/reviews/${orderId}/reply`);
  return data.data.review;
}
