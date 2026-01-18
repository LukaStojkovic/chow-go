import Addresses from "../models/Addresses.js";
import { AppError } from "../utils/AppError.js";

export async function getDeliveryAddresses(req, res, next) {
  const userId = req.user._id;

  const userAddresses = await Addresses.find({ userId })
    .select(
      "_id userId label fullAddress buildingName location isDefault isDeleted notes"
    )
    .lean();

  if (!userAddresses?.length) {
    return next(new AppError("No saved delivery addresses found", 404));
  }

  return res.status(200).json({
    status: "success",
    data: userAddresses,
  });
}

export async function addNewDeliveryAddress(req, res, next) {
  const {
    address,
    apartment,
    buildingName,
    doorCode,
    entrance,
    floor,
    label,
    location,
    notes,
    type,
  } = req.body;

  const userId = req.user._id;

  if (!address || !location?.lat || !location?.lng) {
    return next(new AppError("Address and location required", 400));
  }

  const existingCount = await Addresses.countDocuments({
    userId,
    isDeleted: false,
  });

  const isFirst = existingCount === 0;

  if (isFirst) {
    await Addresses.updateMany({ userId }, { $set: { isDefault: false } });
  }

  const newAddress = await Addresses.create({
    userId,
    label,
    addressType: type,
    fullAddress: address,

    buildingName,
    apartment,
    floor,
    entrance,
    doorCode,
    notes,

    location: {
      type: "Point",
      coordinates: [location.lng, location.lat],
    },

    isDefault: isFirst,
  });

  return res.status(201).json({
    success: true,
    address: newAddress,
  });
}
