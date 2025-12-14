import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { useState } from "react";

export const AddMenuItemForm = ({ onClose }) => {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleImageUpload = (files) => {
    const validFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setImages((prev) => [...prev, ...previews]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.target.files);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  function handleSubmit(e) {
    e.preventDefault();
    console.log("CLIKC");
  }

  return (
    <form
      className="space-y-10 max-h-[75vh] overflow-y-auto overflow-x-hidden scrollbar-hide"
      onSubmit={handleSubmit}
    >
      <div className="space-y-7">
        <div>
          <Label htmlFor="name" className="text-base font-medium">
            Dish Name
          </Label>
          <Input
            id="name"
            placeholder="e.g. Margherita Pizza"
            className="mt-2 h-12"
          />
        </div>

        <div>
          <Label htmlFor="category" className="text-base font-medium">
            Category
          </Label>
          <Select>
            <SelectTrigger className="mt-2 h-12">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent position="popper" side="bottom" align="start">
              <SelectItem value="pizza">Pizza</SelectItem>
              <SelectItem value="burger">Burger</SelectItem>
              <SelectItem value="salad">Salad</SelectItem>
              <SelectItem value="japanese">Japanese</SelectItem>
              <SelectItem value="dessert">Dessert</SelectItem>
              <SelectItem value="drinks">Drinks</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="price" className="text-base font-medium">
            Price
          </Label>
          <Input
            id="price"
            type="number"
            placeholder="14.99$"
            className="mt-2 h-12"
          />
        </div>

        <div className="flex items-center space-x-4 pt-2">
          <Switch id="available" />
          <Label
            htmlFor="available"
            className="cursor-pointer text-base font-medium"
          >
            Available for sale
          </Label>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="description" className="text-base font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Describe your dish in detail... ingredients, preparation method, allergens, etc."
          rows={10}
          className="mt-2 resize-none text-base wrap-break-words"
          style={{ wordBreak: "break-word" }}
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">
          Images (up to 6 recommended)
        </Label>

        <div>
          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200",
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
              onChange={handleFileInput}
            />
          </label>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {images.map((src, index) => (
              <div key={index} className="relative group aspect-square">
                <img
                  src={src}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-border shadow-md"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-8 border-t border-border">
        <Button variant="outline" size="lg" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 px-8"
        >
          Add Menu Item
        </Button>
      </div>
    </form>
  );
};
