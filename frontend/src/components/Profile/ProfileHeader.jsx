import React, { useRef, useState } from "react";
import { Camera, Edit2, Phone, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export default function ProfileHeader({
  authUser,
  name,
  setName,
  phone,
  setPhone,
}) {
  const fileInputRef = useRef(null);
  const { apiUpdateProfile, isUpdatingProfile } = useAuthStore();

  const [previewImage, setPreviewImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];

    if (!file) return toast.error("No file selected");
    if (file.size > 10 * 1024 * 1024)
      return toast.error("Max file size is 10MB");

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return toast.error("Only JPG, PNG, WEBP allowed");

    setPreviewImage(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("profilePicture", file);
    console.log(formData);
    apiUpdateProfile(formData);
  };

  const handleSaveChanges = () => {
    if (!name.trim()) {
      return toast.error("Name cannot be empty");
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    if (phone.trim()) formData.append("phone", phone.trim());

    apiUpdateProfile(formData);
    setIsEditing(false);
  };

  const displayImage =
    previewImage || authUser?.profilePicture || "/defaultProfilePicture.png";

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 dark:border-zinc-800 flex flex-col items-center text-center">
      <div className="relative mb-4">
        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-gray-50 dark:border-zinc-800">
          <img
            src={displayImage}
            alt="Profile"
            className="w-full h-full object-cover"
          />

          {isUpdatingProfile && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUpdatingProfile}
          className="absolute bottom-1 right-1 bg-blue-600 text-white p-2.5 rounded-full"
        >
          <Camera size={18} />
        </button>
      </div>

      {isEditing ? (
        <div className="w-full space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-center font-bold bg-gray-100 dark:bg-zinc-800 rounded-lg py-2"
          />

          <div className="relative">
            <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg"
            />
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveChanges}
              disabled={isUpdatingProfile}
              className={`
      flex-1 py-2 rounded-xl font-medium transition-all
      bg-blue-600 text-white shadow-sm
      hover:bg-blue-700 active:scale-[0.97]
      disabled:opacity-60 disabled:cursor-not-allowed
    `}
            >
              {isUpdatingProfile ? (
                <Loader2 size={15} className="animate-spin mx-auto" />
              ) : (
                "Save"
              )}
            </button>

            <button
              onClick={() => setIsEditing(false)}
              className="
      px-4 py-2 rounded-xl font-medium transition-all
      bg-gray-200 hover:bg-gray-300 text-gray-700
      dark:bg-zinc-700 dark:text-gray-200 dark:hover:bg-zinc-600
      active:scale-[0.97]
    "
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="font-bold">{name}</h2>
          <p className="text-gray-400">{phone}</p>
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500 text-sm flex items-center gap-1"
          >
            <Edit2 size={14} /> Edit details
          </button>
        </>
      )}
    </div>
  );
}
