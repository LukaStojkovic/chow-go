import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

export default function StockSwitch({ inStock, onChange, disabled, label, className }) {
  const { t } = useTranslation(["seller", "common"]);
  const [asking, setAsking] = useState(false);

  const handleChecked = (next) => {
    if (next) onChange({ available: true });
    else setAsking(true);
  };

  const choose = (until) => {
    setAsking(false);
    onChange({ available: false, until });
  };

  return (
    <Popover open={asking} onOpenChange={setAsking}>
      <PopoverAnchor asChild>
        <Switch
          checked={inStock}
          onCheckedChange={handleChecked}
          disabled={disabled}
          aria-label={label}
          className={className}
        />
      </PopoverAnchor>
      <PopoverContent align="end" className="w-64 p-2">
        <p className="px-2 pb-2 pt-1 text-sm font-semibold">{t("seller:stock.durationTitle")}</p>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => choose("endOfDay")}
            className="rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            autoFocus
          >
            <span className="block text-sm font-medium">{t("seller:stock.endOfDay")}</span>
            <span className="block text-xs text-muted-foreground">{t("seller:stock.endOfDayHint")}</span>
          </button>
          <button
            type="button"
            onClick={() => choose("indefinite")}
            className="rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
          >
            <span className="block text-sm font-medium">{t("seller:stock.indefinite")}</span>
            <span className="block text-xs text-muted-foreground">{t("seller:stock.indefiniteHint")}</span>
          </button>
          <button
            type="button"
            onClick={() => setAsking(false)}
            className="rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted"
          >
            {t("common:actions.cancel")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
