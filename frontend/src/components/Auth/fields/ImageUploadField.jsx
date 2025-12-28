import { Controller } from "react-hook-form";
import { Upload, X } from "lucide-react";
import { useState, useRef } from "react";

export function ImageUploadField({
  control,
  imagePreview,
  onImageChange,
  onRemove,
  error,
  multiple = false,
  maxImages = 10,
  label = "Images",
  required = false,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previews, setPreviews] = useState(
    multiple ? [] : imagePreview ? [imagePreview] : []
  );
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    if (multiple) {
      if (previews.length + fileArray.length > maxImages) {
        return;
      }
      const newPreviews = fileArray.map((file) => URL.createObjectURL(file));
      setPreviews((prev) => [...prev, ...newPreviews]);
      onImageChange([
        ...(control._formValues.restaurantImages || []),
        ...fileArray,
      ]);
    } else {
      if (fileArray[0]) {
        const preview = URL.createObjectURL(fileArray[0]);
        setPreviews([preview]);
        onImageChange(fileArray[0]);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const removeImage = (index) => {
    if (multiple) {
      const newPreviews = previews.filter((_, i) => i !== index);
      setPreviews(newPreviews);
      const currentFiles = control._formValues.restaurantImages || [];
      const newFiles = currentFiles.filter((_, i) => i !== index);
      onImageChange(newFiles);
    } else {
      setPreviews([]);
      onRemove();
    }
  };

  if (multiple) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragOver
                ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload
              className={`w-8 h-8 mx-auto mb-2 ${
                isDragOver
                  ? "text-emerald-500"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            />
            <p
              className={`text-sm ${
                isDragOver
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {isDragOver
                ? "Drop images here"
                : "Drag & drop images or click to select"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Maximum {maxImages} images
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          {error && (
            <p className="text-red-500 dark:text-red-400 text-xs">
              {error.message}
            </p>
          )}
          {previews.length > 0 && (
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Profile Image {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex items-center gap-4">
        {previews[0] ? (
          <div className="relative">
            <img
              src={previews[0]}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-green-500 dark:border-green-400"
            />
            <button
              type="button"
              onClick={() => removeImage(0)}
              className="absolute -top-1 -right-1 bg-red-500 dark:bg-red-600 text-white rounded-full p-1 hover:bg-red-600 dark:hover:bg-red-700"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-dashed border-gray-400 dark:border-gray-600 flex items-center justify-center">
            <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
        )}
        <Controller
          control={control}
          name="profilePicture"
          render={({ field }) => (
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  e.target.files[0] && handleFiles([e.target.files[0]])
                }
                className="hidden"
              />
              <span className="px-4 py-2 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition">
                Choose Image
              </span>
            </label>
          )}
        />
      </div>
      {error && (
        <p className="text-red-500 dark:text-red-400 text-xs">
          {error.message}
        </p>
      )}
    </div>
  );
}
