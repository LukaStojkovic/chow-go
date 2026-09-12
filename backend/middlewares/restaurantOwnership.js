import { validateRestaurantOwnership } from "../services/menuItem.service.js";

// Upload middleware streams bytes to Cloudinary before the handler runs, so an
// ownership check inside the handler bills the upload and only then returns
// 403. This runs the same check first, reusing the service's implementation so
// there is one definition of "owns this restaurant".
export async function requireRestaurantOwnership(req, _res, next) {
  req.restaurant = await validateRestaurantOwnership(req.params.restaurantId, req.user._id);
  next();
}
