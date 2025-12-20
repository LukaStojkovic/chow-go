import React from "react";
import Searchbar from "../Searchbar";
import MenuItemCategorySelect from "./MenuItemCategorySelect";
import PriceRangeSlider from "../PriceRangeSlider";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";

export default function MenuItemFilters({
  searchInput,
  setSearchInput,
  category,
  setCategory,
  tempPriceRange,
  setTempPriceRange,
  setPriceRange,
  availableOnly,
  setAvailableOnly,
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        <div className="sm:col-span-2 lg:col-span-1">
          <Searchbar
            placeholder="Search Menu Item..."
            searchInput={searchInput}
            setSearchInput={setSearchInput}
          />
        </div>

        <div className="lg:col-span-1">
          <MenuItemCategorySelect
            category={category}
            setCategory={setCategory}
          />
        </div>

        <div className="lg:col-span-1">
          <PriceRangeSlider
            tempPriceRange={tempPriceRange}
            setTempPriceRange={setTempPriceRange}
            setPriceRange={setPriceRange}
          />
        </div>

        <div className="flex items-center space-x-3 lg:col-span-1 lg:justify-end">
          <Switch checked={availableOnly} onCheckedChange={setAvailableOnly} />
          <Label className="text-sm font-medium cursor-pointer whitespace-nowrap">
            Only Available Items
          </Label>
        </div>
      </div>
    </div>
  );
}
