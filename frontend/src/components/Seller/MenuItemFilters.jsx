import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["seller", "common"]);
  return (
    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        <div className="sm:col-span-2 lg:col-span-1">
          <Searchbar
            placeholder={t("menu.searchShort")}
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
            {t("menu.onlyAvailable")}
          </Label>
        </div>
      </div>
    </div>
  );
}
