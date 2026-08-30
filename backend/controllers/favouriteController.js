import User from "../models/User.js";
import Restaurant from "../models/Restaurant.js";
import { AppError } from "../utils/AppError.js";

export const toggleFavourite = async (req, res, next) => {
  try {
    const { restaurantId } = req.body;
    
    if (!restaurantId) {
      throw new AppError("Restaurant ID is required", 400);
    }
    
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new AppError("Restaurant not found", 404);
    }
    
    const userId = req.user._id;
    const user = await User.findById(userId);
    
    const isFavourited = user.favouriteRestaurants.includes(restaurantId);
    
    let updatedUser;
    if (isFavourited) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $pull: { favouriteRestaurants: restaurantId } },
        { new: true }
      );
    } else {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { favouriteRestaurants: restaurantId } },
        { new: true }
      );
    }
    
    res.status(200).json({
      status: "success",
      data: {
        isFavourited: !isFavourited,
        favourites: updatedUser.favouriteRestaurants
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getFavourites = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).populate({
      path: "favouriteRestaurants",
      select: "name profilePicture cuisineType averageRating totalReviews"
    });
    
    res.status(200).json({
      status: "success",
      data: {
        favourites: user.favouriteRestaurants
      }
    });
  } catch (error) {
    next(error);
  }
};
