import { useTranslation } from "react-i18next";
import { soldOutState } from "@chowgo/shared/stock";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import StockSwitch from "./StockSwitch";
import { soldOutLabel } from "./soldOutLabel";

export default function OptionStockSheet({ menuItem, open, onOpenChange, onChange, pending }) {
  const { t, i18n } = useTranslation(["seller", "common"]);
  const now = new Date();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>{t("seller:stock.optionsTitle", { name: menuItem.name })}</SheetTitle>
          <SheetDescription>{t("seller:stock.optionsDescription")}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          {(menuItem.optionGroups ?? []).map((group) => (
            <section key={group._id ?? group.name} aria-label={group.name}>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{group.name}</h3>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {(group.options ?? []).map((option) => {
                  const state = soldOutState(option, now);
                  return (
                    <li
                      key={option._id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className={state ? "opacity-60" : undefined}>
                        <p className="text-sm font-medium">{option.name}</p>
                        {state && (
                          <p className="text-xs text-destructive">
                            {t("seller:stock.soldOut")} · {soldOutLabel(state, t, i18n.language, now)}
                          </p>
                        )}
                      </div>
                      <StockSwitch
                        inStock={!state}
                        disabled={pending}
                        label={t("seller:stock.switchLabel", { name: option.name })}
                        onChange={(input) => onChange({ ...input, optionId: option._id })}
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
