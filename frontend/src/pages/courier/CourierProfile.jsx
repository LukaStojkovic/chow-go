import React, { useEffect, useRef, useState } from "react";
import {
  Bike,
  Camera,
  Edit2,
  Loader2,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  Star,
  Truck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useCourierOverview } from "@/hooks/Courier/useCourierOverview";
import useUpdateCourierProfile from "@/hooks/Courier/useUpdateCourierProfile";

const VEHICLE_LABELS = {
  bike: "Bicycle",
  scooter: "Scooter",
  motorcycle: "Motorcycle",
  car: "Car",
};

const VERIFICATION_CONFIG = {
  verified: {
    label: "Verified",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  pending: {
    label: "Pending verification",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  },
  rejected: {
    label: "Verification rejected",
    className: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  },
};

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="font-medium capitalize text-gray-900 dark:text-white">
        {value || "—"}
      </p>
    </div>
  );
}

export function CourierProfile() {
  const { authUser } = useAuthStore();
  const courier = authUser?.courier;
  const { data: analytics, isLoading: isLoadingAnalytics } =
    useCourierOverview();
  const { updateProfile, isUpdating } = useUpdateCourierProfile();

  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(courier?.fullName ?? "");
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    setFullName(courier?.fullName ?? authUser?.name ?? "");
  }, [courier?.fullName, authUser?.name]);

  if (!courier) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
        Courier profile not found
      </div>
    );
  }

  const displayImage =
    previewImage ||
    courier.profilePicture ||
    authUser?.profilePicture ||
    "/defaultProfilePicture.png";

  const verification =
    VERIFICATION_CONFIG[courier.verificationStatus] ??
    VERIFICATION_CONFIG.pending;

  const avgRating = analytics?.allTime?.averageRating ?? courier.averageRating;
  const totalRatings =
    analytics?.allTime?.totalRatings ?? courier.totalRatings ?? 0;

  function handleImageSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Max file size is 10MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPG, PNG, WEBP allowed");
      return;
    }

    setPreviewImage(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("profilePicture", file);
    if (fullName.trim()) formData.append("fullName", fullName.trim());
    updateProfile(formData);
  }

  function handleSaveName() {
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", trimmed);
    updateProfile(formData, {
      onSuccess: () => setIsEditing(false),
    });
  }

  function handleCancelEdit() {
    setFullName(courier.fullName ?? authUser?.name ?? "");
    setIsEditing(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-gray-50 dark:border-zinc-800">
              <img
                src={displayImage}
                alt={courier.fullName}
                className="h-full w-full object-cover"
              />
              {isUpdating && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUpdating}
              className="absolute bottom-0 right-0 rounded-full bg-emerald-600 p-2.5 text-white shadow-lg transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            {isEditing ? (
              <div className="space-y-3">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-lg font-bold text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white sm:max-w-sm"
                  placeholder="Your full name"
                />
                <div className="flex justify-center gap-2 sm:justify-start">
                  <button
                    type="button"
                    onClick={handleSaveName}
                    disabled={isUpdating}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {courier.fullName}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit name
                </button>
              </>
            )}

            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              {!isLoadingAnalytics && avgRating > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {avgRating.toFixed(1)} ({totalRatings})
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${verification.className}`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                {verification.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Total deliveries
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {courier.totalDeliveries ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Successful
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {courier.successfulDeliveries ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Earnings</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            ${(courier.totalEarnings ?? 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4 dark:border-zinc-800">
            <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              Contact
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Email
                </p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {courier.email}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Phone
                </p>
                <a
                  href={`tel:${courier.phoneNumber}`}
                  className="font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  {courier.phoneNumber}
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4 dark:border-zinc-800">
            <Bike className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">
              Vehicle details
            </h3>
          </div>
          <div className="space-y-4">
            <DetailRow
              label="Vehicle type"
              value={VEHICLE_LABELS[courier.vehicleType] ?? courier.vehicleType}
            />
            {courier.vehicleModel && (
              <DetailRow label="Model" value={courier.vehicleModel} />
            )}
            {courier.vehicleNumber && (
              <DetailRow label="Plate / ID" value={courier.vehicleNumber} />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-4 dark:border-zinc-800">
          <Truck className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          <h3 className="font-bold text-gray-900 dark:text-white">Account</h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow
            label="Member since"
            value={new Date(courier.createdAt).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          />
          <DetailRow
            label="Availability"
            value={courier.isAvailable ? "On duty" : "Off duty"}
          />
        </div>
      </div>
    </div>
  );
}
