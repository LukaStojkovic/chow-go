import Addresses from "../models/Addresses.js";
import { AppError } from "../utils/AppError.js";

export async function getDeliveryAddresses(req, res, next) {
  const userId = req.user._id;

  const userAddresses = await Addresses.find({ userId, isDeleted: false })
    .select(
      "_id userId label fullAddress buildingName location isDefault isDeleted notes",
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

export async function setDefaultAddress(req, res, next) {
  const { addressId } = req.params;
  const userId = req.user._id;

  const address = await Addresses.findOne({ _id: addressId, userId });

  if (!address) {
    return next(new AppError("Address not found", 404));
  }

  await Addresses.updateMany({ userId, isDefault: true }, { isDefault: false });

  address.isDefault = true;
  await address.save();

  return res.status(200).json({
    success: true,
    message: "Default address updated successfully",
  });
}

export async function deleteDeliveryAddress(req, res, next) {
  const { addressId } = req.params;
  const userId = req.user._id;

  const address = await Addresses.findOne({ _id: addressId, userId });

  if (!address) {
    return next(new AppError("Address not found", 404));
  }

  if (address.isDeleted) {
    return next(new AppError("Address already deleted", 404));
  }

  const remainingAddresses = await Addresses.countDocuments({
    userId,
    isDeleted: false,
    _id: { $ne: addressId },
  });

  if (remainingAddresses === 0) {
    return next(
      new AppError(
        "Cannot delete the last address. Add another address first.",
        400,
      ),
    );
  }

  address.isDeleted = true;
  await address.save();

  if (address.isDefault) {
    const nextDefault = await Addresses.findOne({
      userId,
      isDeleted: false,
      _id: { $ne: addressId },
    });

    if (nextDefault) {
      nextDefault.isDefault = true;
      await nextDefault.save();
    }
  }

  return res.status(200).json({
    success: true,
    message: "Address deleted successfully",
  });
}
