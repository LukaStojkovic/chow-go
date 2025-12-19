import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { useEffect, useState } from "react";

export const MenuItemImageUploader = ({
  images,
  setValue,
  previews,
  setPreviews,
  errors,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  const handleUpload = (files) => {
    const validFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (images.length + validFiles.length > 6) return;
    setValue("images", [...images, ...validFiles], { shouldValidate: true });
    setPreviews((prev) => [
      ...prev,
      ...validFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeImage = (index) => {
    setValue(
      "images",
      images.filter((_, i) => i !== index),
      { shouldValidate: true }
    );
    URL.revokeObjectURL(previews[index]);
    setPreviews(previews.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <Label>Images (up to 6 recommended)</Label>

      <label
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleUpload(e.dataTransfer.files);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        className={cn(
          "flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-xl cursor-pointer transition-all",
          isDragging
            ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/20"
            : "border-border bg-card/50 hover:border-emerald-500"
        )}
      >
        <div className="flex flex-col items-center justify-center pt-8 pb-10">
          <Upload
            className={cn(
              "w-16 h-16 mb-5",
              isDragging ? "text-emerald-600" : "text-muted-foreground"
            )}
          />
          <p
            className={cn(
              "text-base font-medium",
              isDragging ? "text-emerald-600" : "text-muted-foreground"
            )}
          >
            {isDragging
              ? "Drop images here"
              : "Click to upload or drag and drop"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            PNG, JPG up to 10MB • Multiple images supported
          </p>
        </div>
        <input
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            e.target.files?.length && handleUpload(e.target.files)
          }
        />
      </label>

      {errors.images && (
        <p className="text-sm text-destructive">{errors.images.message}</p>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {previews.map((src, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={src}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border shadow-md"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label={`Remove image ${index + 1}`}
                className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
