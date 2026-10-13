import { axiosInstance } from "@/lib/axios";

export async function getRestaurantReviews(restaurantId, params) {
  const res = await axiosInstance.get(`/restaurants/${restaurantId}/reviews`, { params });
  return res.data.data;
}

export async function getSellerReviews(params) {
  const res = await axiosInstance.get("/restaurant/reviews", { params });
  return res.data.data;
}

export async function saveReviewReply({ orderId, text }) {
  const res = await axiosInstance.put(`/restaurant/reviews/${orderId}/reply`, { text });
  return res.data.data.review;
}

export async function deleteReviewReply(orderId) {
  const res = await axiosInstance.delete(`/restaurant/reviews/${orderId}/reply`);
  return res.data.data.review;
}
