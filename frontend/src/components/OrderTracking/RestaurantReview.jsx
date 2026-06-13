import { useState } from "react";
import { Star } from "lucide-react";
import Spinner from "@/components/Spinner";
import { useRateOrder } from "@/hooks/Orders/useRateOrder";

function StarRating({ value, onChange, readOnly = false, size = "md" }) {
  const [hover, setHover] = useState(0);
  const iconClass = size === "lg" ? "h-8 w-8" : "h-6 w-6";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value);
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={`transition-transform ${
              readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"
            }`}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={iconClass}
              fill={filled ? "#F59E0B" : "none"}
              stroke={filled ? "#F59E0B" : "#D1D5DB"}
            />
          </button>
        );
      })}
    </div>
  );
}

export function RestaurantReview({ orderId, restaurant, customerRating }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const { rateOrder, isRating } = useRateOrder(orderId);

  const hasRated = Boolean(customerRating?.restaurantRating);

  function handleSubmit(e) {
    e.preventDefault();
    if (rating < 1) return;
    rateOrder({ restaurantRating: rating, restaurantReview: review });
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center gap-4">
        <img
          src={restaurant.profilePicture}
          alt={restaurant.name}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div>
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">
            {hasRated ? "Your review" : "Rate your experience"}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {restaurant.name}
          </p>
        </div>
      </div>

      {hasRated ? (
        <div className="space-y-3">
          <StarRating value={customerRating.restaurantRating} readOnly size="lg" />
          {customerRating.restaurantReview && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {customerRating.restaurantReview}
            </p>
          )}
          <p className="text-xs text-gray-400">
            Thank you for your feedback!
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              How was the food?
            </p>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>

          <div>
            <label
              htmlFor="restaurant-review"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Leave a comment (optional)
            </label>
            <textarea
              id="restaurant-review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Tell others about your experience..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {review.length}/500
            </p>
          </div>

          <button
            type="submit"
            disabled={rating < 1 || isRating}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRating ? <Spinner /> : "Submit review"}
          </button>
        </form>
      )}
    </div>
  );
}
