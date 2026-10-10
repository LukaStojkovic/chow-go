import { useId } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MenuLayoutDish } from "./MenuLayoutDish";
import { MAX_SECTION_NAME } from "./menuLayoutDraft";

export function MenuLayoutSection({
  section,
  sections,
  currency,
  isFirst,
  isLast,
  onRename,
  onDelete,
  onMoveSection,
  onMoveDish,
  onMoveDishTo,
}) {
  const { t } = useTranslation(["seller", "common"]);
  const hintId = useId();

  return (
    <section
      aria-label={section.name.trim() || t("menuLayout.section")}
      className="space-y-3 rounded-2xl bg-muted/50 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Input
          aria-label={t("menuLayout.sectionName")}
          value={section.name}
          maxLength={MAX_SECTION_NAME}
          onChange={(event) => onRename(section.key, event.target.value)}
          className="h-10 min-w-0 flex-1 font-semibold"
        />
        <span className="text-sm text-muted-foreground">
          {t("common:count.dishes", { count: section.items.length })}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("menuLayout.moveUp")}
          disabled={isFirst}
          onClick={() => onMoveSection(section.key, -1)}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("menuLayout.moveDown")}
          disabled={isLast}
          onClick={() => onMoveSection(section.key, 1)}
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("menuLayout.deleteSection")}
          title={t("menuLayout.deleteSectionHint")}
          aria-describedby={hintId}
          onClick={() => onDelete(section.key)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <span id={hintId} className="sr-only">
          {t("menuLayout.deleteSectionHint")}
        </span>
      </div>

      {section.items.length === 0 ? (
        <p className="py-3 text-sm text-muted-foreground">{t("menuLayout.emptySection")}</p>
      ) : (
        <ol className="space-y-2">
          {section.items.map((item, index) => (
            <MenuLayoutDish
              key={item._id}
              item={item}
              currency={currency}
              sectionKey={section.key}
              sections={sections}
              isFirst={index === 0}
              isLast={index === section.items.length - 1}
              onMove={(itemId, delta) => onMoveDish(section.key, itemId, delta)}
              onMoveTo={onMoveDishTo}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
