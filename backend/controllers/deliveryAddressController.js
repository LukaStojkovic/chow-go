import Addresses from "../models/Addresses.js";
import { AppError } from "../utils/AppError.js";

export async function getDeliveryAddresses(req, res, next) {
  const userId = req.user._id;

  const userAddresses = await Addresses.find({ userId, isDeleted: false })
    .select(
      "_id userId label fullAddress buildingName location isDefault isDeleted notes",
    )
    .lean();

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

  try {
    const session = await Addresses.startSession();
    session.startTransaction();

    const existingCount = await Addresses.countDocuments(
      {
        userId,
        isDeleted: false,
      },
      { session },
    );

    const isFirst = existingCount === 0;

    if (isFirst) {
      await Addresses.updateMany(
        { userId },
        { $set: { isDefault: false } },
        { session },
      );
    }

    const newAddress = await Addresses.create(
      [
        {
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
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      address: newAddress[0],
    });
  } catch (error) {
    return next(error);
  }
}

export async function setDefaultAddress(req, res, next) {
  const { addressId } = req.params;
  const userId = req.user._id;

  const address = await Addresses.findOne({
    _id: addressId,
    userId,
    isDeleted: false,
  });

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

  try {
    const session = await Addresses.startSession();
    session.startTransaction();

    const address = await Addresses.findOne(
      { _id: addressId, userId, isDeleted: false },
      null,
      { session },
    );

    if (!address) {
      await session.abortTransaction();
      session.endSession();
      return next(new AppError("Address not found", 404));
    }

    const remainingAddresses = await Addresses.countDocuments(
      {
        userId,
        isDeleted: false,
        _id: { $ne: addressId },
      },
      { session },
    );

    if (remainingAddresses === 0) {
      await session.abortTransaction();
      session.endSession();
      return next(
        new AppError(
          "Cannot delete the last address. Add another address first.",
          400,
        ),
      );
    }

    address.isDeleted = true;
    await address.save({ session });

    if (address.isDefault) {
      const nextDefault = await Addresses.findOne(
        {
          userId,
          isDeleted: false,
          _id: { $ne: addressId },
        },
        null,
        { session },
      );

      if (nextDefault) {
        nextDefault.isDefault = true;
        await nextDefault.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
}
