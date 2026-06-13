import User from "../models/User.js";
import * as courierOrderService from "./courierOrder.service.js";
import * as imageService from "./image.service.js";
import { AppError } from "../utils/AppError.js";

export async function getCourierProfile(courierUserId) {
  return courierOrderService.getCourierByUserId(courierUserId);
}

export async function updateCourierProfileOperation({
  courierUserId,
  fullName,
  profilePictureFile,
}) {
  const courier = await courierOrderService.getCourierByUserId(courierUserId);
  const user = await User.findById(courierUserId);

  if (!user) throw new AppError("User not found", 404);

  let hasUpdates = false;

  if (fullName !== undefined) {
    const trimmed = fullName.trim();
    if (!trimmed) throw new AppError("Name cannot be empty", 400);
    courier.fullName = trimmed;
    user.name = trimmed;
    hasUpdates = true;
  }

  if (profilePictureFile?.path) {
    if (courier.profilePicture) {
      await imageService.deleteCloudinaryImage(courier.profilePicture);
    }
    courier.profilePicture = profilePictureFile.path;
    user.profilePicture = profilePictureFile.path;
    hasUpdates = true;
  }

  if (!hasUpdates) {
    throw new AppError("No updates provided", 400);
  }

  await courier.save();
  await user.save();

  return courier;
}
