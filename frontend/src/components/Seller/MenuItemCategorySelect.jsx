import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { categoryOptions } from "@chowgo/shared/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export default function MenuItemCategorySelect({ category, setCategory }) {
  const { t, i18n } = useTranslation(["seller", "common"]);

  // The shared taxonomy rather than a local list: this used to offer
  // "Appetizers" and "Mains", which match no `MenuItem.category` the discovery
  // rail can filter on, so a dish filed under either was unreachable from the
  // customer side.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = useMemo(() => categoryOptions(t), [i18n.language]);

  return (
    <Select value={category} onValueChange={setCategory}>
      <SelectTrigger>
        <SelectValue placeholder={t("seller:menu.filterAll")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("seller:menu.filterAll")}</SelectItem>
        {categories
          .filter((entry) => entry.id !== "all")
          .map((entry) => (
            <SelectItem key={entry.id} value={entry.value}>
              {entry.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
