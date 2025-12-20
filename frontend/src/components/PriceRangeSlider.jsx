import React from "react";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";

export default function PriceRangeSlider({
  tempPriceRange,
  setTempPriceRange,
  setPriceRange,
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">
        Price: {tempPriceRange[0]} – {tempPriceRange[1]} $
      </Label>
      <Slider
        value={tempPriceRange}
        onValueChange={setTempPriceRange}
        onMouseUp={() => setPriceRange(tempPriceRange)}
        min={0}
        max={200}
        step={5}
        className="w-full"
      />
    </div>
  );
}
