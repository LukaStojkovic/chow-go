import { Controller } from "react-hook-form";
import { Upload, X } from "lucide-react";

export function ImageUploadField({
  control,
  imagePreview,
  onImageChange,
  onRemove,
  error,
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Profile Image</label>
      <div className="flex items-center gap-4">
        {imagePreview ? (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-green-500"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center">
            <Upload className="w-6 h-6 text-gray-400" />
          </div>
        )}
        <Controller
          control={control}
          name="profileImage"
          render={({ field }) => (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files[0] && onImageChange(e.target.files[0])
                }
                className="hidden"
              />
              <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition">
                Choose Image
              </span>
            </label>
          )}
        />
      </div>
      {error && <p className="text-red-500 text-xs">{error.message}</p>}
    </div>
  );
}
