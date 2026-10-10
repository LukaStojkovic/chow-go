import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatPrice } from "@chowgo/shared/format";
import { cloudinaryUrl } from "@chowgo/shared/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UNSECTIONED } from "./menuLayoutDraft";

export function MenuLayoutDish({
  item,
  currency,
  sectionKey,
  sections,
  isFirst,
  isLast,
  onMove,
  onMoveTo,
}) {
  const { t } = useTranslation(["seller", "common"]);
  const id = useId();
  const nameId = `${id}-name`;
  const reorderable = sectionKey !== UNSECTIONED;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3">
      <img
        src={cloudinaryUrl(item.imageUrls?.[0], { width: 112 }) || "/placeholder-menu.jpg"}
        alt=""
        className="h-14 w-14 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <p id={nameId} className="truncate font-medium">
          {item.name}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{formatPrice(item.price, { currency })}</span>
          {item.available === false && <Badge variant="secondary">{t("menu.unavailable")}</Badge>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span id={`${id}-moveTo`} className="sr-only">
          {t("menuLayout.moveTo")}
        </span>
        <select
          aria-labelledby={`${id}-moveTo ${nameId}`}
          value={sectionKey}
          onChange={(event) => onMoveTo(item._id, event.target.value)}
          className="h-9 max-w-44 rounded-md border border-input bg-transparent px-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
        >
          {sections.map((section) => (
            <option key={section.key} value={section.key}>
              {section.name.trim() || t("menuLayout.section")}
            </option>
          ))}
          <option value={UNSECTIONED}>{t("menuLayout.unsectioned")}</option>
        </select>

        {reorderable && (
          <>
            <span id={`${id}-up`} className="sr-only">
              {t("menuLayout.moveUp")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-labelledby={`${id}-up ${nameId}`}
              disabled={isFirst}
              onClick={() => onMove(item._id, -1)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <span id={`${id}-down`} className="sr-only">
              {t("menuLayout.moveDown")}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-labelledby={`${id}-down ${nameId}`}
              disabled={isLast}
              onClick={() => onMove(item._id, 1)}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
