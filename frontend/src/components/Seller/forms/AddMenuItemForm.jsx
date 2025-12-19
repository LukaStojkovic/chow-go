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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { menuItemSchema } from "../schemas/menuItemSchema";
import { useCreateMenuItem } from "../hooks/useCreateMenuItem";
import { useAuthStore } from "@/store/useAuthStore";
import Spinner from "@/components/Spinner";
import { MenuItemImageUploader } from "./MenuItemImageUploader";

const CATEGORIES = [
  { value: "pizza", label: "Pizza" },
  { value: "burger", label: "Burger" },
  { value: "salad", label: "Salad" },
  { value: "japanese", label: "Japanese" },
  { value: "dessert", label: "Dessert" },
  { value: "drinks", label: "Drinks" },
  { value: "other", label: "Other" },
];

export const AddMenuItemForm = ({ onClose }) => {
  const [previews, setPreviews] = useState([]);
  const { createMenuItem, isCreating } = useCreateMenuItem();
  const { authUser } = useAuthStore();
  const restaurantId = authUser.restaurant._id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      category: "",
      price: "",
      available: true,
      description: "",
      images: [],
    },
  });

  const images = watch("images") || [];

  const onSubmit = (data) => {
    if (restaurantId) {
      createMenuItem(
        { restaurantId, menuItemData: data },
        { onSuccess: onClose }
      );
    }
  };

  return (
    <form
      className="space-y-10 max-h-[75vh] overflow-y-auto scrollbar-hide"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="space-y-7">
        <div>
          <Label htmlFor="name">Dish Name</Label>
          <Input
            id="name"
            placeholder="e.g. Margherita Pizza"
            className="mt-2 h-12"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="category">Category</Label>
          <Select onValueChange={(value) => setValue("category", value)}>
            <SelectTrigger className="mt-2 h-12">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-sm text-destructive mt-1">
              {errors.category.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            placeholder="14.99"
            className="mt-2 h-12"
            {...register("price")}
          />
          {errors.price && (
            <p className="text-sm text-destructive mt-1">
              {errors.price.message}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-4 pt-2">
          <Switch
            id="available"
            checked={watch("available")}
            onCheckedChange={(checked) => setValue("available", checked)}
          />
          <Label htmlFor="available" className="cursor-pointer">
            Available for sale
          </Label>
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your dish in detail..."
          rows={10}
          className="mt-2 resize-none"
          {...register("description")}
        />
      </div>

      <MenuItemImageUploader
        {...{ images, setValue, previews, setPreviews, errors }}
      />

      <div className="flex justify-end gap-4 pt-8 border-t">
        <Button type="button" variant="outline" size="lg" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={isCreating}
          className="bg-emerald-600 hover:bg-emerald-700 px-8"
        >
          {isCreating ? <Spinner size="sm" /> : "Add Menu Item"}
        </Button>
      </div>
    </form>
  );
};
