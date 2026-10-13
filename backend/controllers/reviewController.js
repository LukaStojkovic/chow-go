import * as reviewService from "../services/review.service.js";

export async function listRestaurantReviews(req, res) {
  const data = await reviewService.listRestaurantReviews(req.params.restaurantId, req.query);
  res.status(200).json({ status: "success", data });
}

export async function listOwnReviews(req, res) {
  const data = await reviewService.listOwnReviews(req.user._id, req.query);
  res.status(200).json({ status: "success", data });
}

export async function replyToReview(req, res) {
  const review = await reviewService.replyToReview(req.user._id, req.params.orderId, req.body?.text);
  res.status(200).json({ status: "success", data: { review } });
}

export async function deleteReply(req, res) {
  const review = await reviewService.deleteReply(req.user._id, req.params.orderId);
  res.status(200).json({ status: "success", data: { review } });
}
