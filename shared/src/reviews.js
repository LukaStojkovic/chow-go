/**
 * Review tags and limits. A customer picks a few tags with each star rating;
 * the backend keeps only known tags that fit the rating, and the restaurant
 * page summarises the most common ones. Labels live in the `review` catalog.
 */

export const REVIEW_LIMITS = { textLength: 500, replyLength: 500, maxTags: 5 };

export const REVIEW_TAGS = {
  restaurant: {
    positive: ["tasty", "generous_portions", "well_packed", "good_value", "arrived_hot"],
    negative: ["arrived_cold", "small_portions", "missing_items", "wrong_order", "poor_packaging"],
  },
  courier: {
    positive: ["fast", "friendly", "careful"],
    negative: ["late", "unfriendly", "food_damaged"],
  },
};

/** The tags offered for a rating: praise for 4-5 stars, problems for 1-3. */
export function tagsForRating(kind, rating) {
  const set = REVIEW_TAGS[kind];
  if (!set || !Number.isInteger(rating) || rating < 1 || rating > 5) return [];
  return rating >= 4 ? set.positive : set.negative;
}

/** Known tags that fit the rating, de-duplicated, in catalog order, at most five. */
export function normalizeReviewTags(kind, rating, input) {
  const allowed = tagsForRating(kind, rating);
  const picked = new Set(Array.isArray(input) ? input.map(String) : []);
  return allowed.filter((tag) => picked.has(tag)).slice(0, REVIEW_LIMITS.maxTags);
}

/** "Marko P." - how a reviewer is shown to everyone else. */
export function reviewerDisplayName(fullName) {
  const parts = String(fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}
