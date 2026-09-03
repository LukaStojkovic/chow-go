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
        <label className="text-sm font-medium text-muted-foreground ">
          {label}
        </label>
        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
              isDragOver
                ? "border-primary bg-primary-subtle "
                : "border-border hover:border-primary "
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload
              className={`w-8 h-8 mx-auto mb-2 ${
                isDragOver
                  ? "text-primary"
                  : "text-muted-foreground "
              }`}
            />
            <p
              className={`text-sm ${
                isDragOver
                  ? "text-primary "
                  : "text-muted-foreground "
              }`}
            >
              {isDragOver
                ? "Drop images here"
                : "Drag & drop images or click to select"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
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
            <p className="text-destructive text-xs">
              {error.message}
            </p>
          )}
          {previews.length > 0 && (
            <div className="max-h-60 overflow-y-auto border border-border rounded-lg p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-border "
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
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
      <label className="text-sm font-medium text-muted-foreground ">
        Profile Image {required && <span className="text-destructive">*</span>}
      </label>
      <div className="flex items-center gap-4">
        {previews[0] ? (
          <div className="relative">
            <img
              src={previews[0]}
              alt="Preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-primary "
            />
            <button
              type="button"
              onClick={() => removeImage(0)}
              className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive "
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center">
            <Upload className="w-6 h-6 text-muted-foreground " />
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
              <span className="px-4 py-2 bg-primary-subtle text-primary rounded-lg hover:bg-primary-subtle transition">
                Choose Image
              </span>
            </label>
          )}
        />
      </div>
      {error && (
        <p className="text-destructive text-xs">
          {error.message}
        </p>
      )}
    </div>
  );
}
