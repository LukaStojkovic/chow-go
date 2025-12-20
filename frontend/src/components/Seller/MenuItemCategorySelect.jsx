import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function MenuItemCategorySelect({ category, setCategory }) {
  return (
    <Select value={category} onValueChange={setCategory}>
      <SelectTrigger>
        <SelectValue placeholder="All Categories" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Categories</SelectItem>
        <SelectItem value="Pizza">Pizza</SelectItem>
        <SelectItem value="Burgers">Burgers</SelectItem>
        <SelectItem value="Salads">Salads</SelectItem>
        <SelectItem value="Pasta">Pasta</SelectItem>
        <SelectItem value="Drinks">Drinks</SelectItem>
        <SelectItem value="Desserts">Desserts</SelectItem>
        <SelectItem value="Appetizers">Appetizers</SelectItem>
        <SelectItem value="Mains">Mains</SelectItem>
      </SelectContent>
    </Select>
  );
}
