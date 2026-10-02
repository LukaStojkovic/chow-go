import { useTranslation } from "react-i18next";
import { formatPrice } from "@chowgo/shared/format";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { priceFilterScale } from "@/lib/priceFilter";

export default function PriceRangeSlider({
  tempPriceRange,
  setTempPriceRange,
  currency,
}) {
  const { t } = useTranslation("seller");
  const { max, step } = priceFilterScale(currency);
  const [low, high] = tempPriceRange;

  return (
    <div className="space-y-2">
      <Label className="text-sm">
        {t("menu.priceFilter", {
          min: formatPrice(low, { currency }),
          max: high >= max ? `${formatPrice(max, { currency })}+` : formatPrice(high, { currency }),
        })}
      </Label>
      <Slider
        value={tempPriceRange}
        onValueChange={setTempPriceRange}
        min={0}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}
