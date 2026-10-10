import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Spinner from "@/components/Spinner";
import { useCurrency } from "@/hooks/useCurrency";
import { apiErrorMessage } from "@/lib/apiError";
import { useMenuLayout, useSaveMenuLayout } from "@/components/Seller/hooks/useMenuLayout";
import { MenuLayoutSection } from "@/components/Seller/MenuLayout/MenuLayoutSection";
import { MenuLayoutDish } from "@/components/Seller/MenuLayout/MenuLayoutDish";
import {
  MAX_SECTION_NAME,
  MAX_SECTIONS,
  UNSECTIONED,
  addSection,
  deleteSection,
  draftError,
  isSameLayout,
  moveDish,
  moveDishTo,
  moveSection,
  renameSection,
  sectionNameError,
  toDraft,
  toPayload,
} from "@/components/Seller/MenuLayout/menuLayoutDraft";

export const SellerMenuLayout = () => {
  const { t } = useTranslation(["seller", "errors", "common"]);
  const currency = useCurrency();
  const { data, isLoading, isError, refetch } = useMenuLayout();
  const { saveMenuLayout, isSaving } = useSaveMenuLayout();

  const [source, setSource] = useState(data);
  const [draft, setDraft] = useState(() => toDraft(data));
  const [newName, setNewName] = useState("");
  const [saveError, setSaveError] = useState(null);

  const saved = toDraft(source);
  const isDirty = !isSameLayout(draft, saved);
  if (data !== source) {
    setSource(data);
    if (!isDirty) setDraft(toDraft(data));
  }

  const update = (next) => {
    setDraft(next);
    setSaveError(null);
  };

  const validationError = draftError(draft, t);
  const newNameError = sectionNameError(draft.sections, newName, t);
  const canAdd =
    newName.trim().length > 0 && !newNameError && draft.sections.length < MAX_SECTIONS;

  const handleAdd = (event) => {
    event.preventDefault();
    if (!canAdd) return;
    update(addSection(draft, newName));
    setNewName("");
  };

  const handleSave = () => {
    if (validationError) return;
    saveMenuLayout(toPayload(draft), {
      onSuccess: (layout) => {
        setDraft(toDraft(layout));
        setSaveError(null);
      },
      onError: (error) =>
        setSaveError(apiErrorMessage(error, { fallbackKey: "seller:menuLayout.saveFailed" })),
    });
  };

  const handleDiscard = () => {
    update(toDraft(source));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p className="text-muted-foreground">{t("errors:request.generic")}</p>
        <Button variant="outline" onClick={() => refetch()}>
          {t("common:actions.retry")}
        </Button>
      </div>
    );
  }

  const error = saveError || validationError;

  return (
    <div className="space-y-8 pb-28">
      <div className="space-y-2">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/seller/menu">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t("common:actions.back")}
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">{t("menuLayout.title")}</h2>
        <p className="text-muted-foreground">{t("menuLayout.hint")}</p>
      </div>

      <form onSubmit={handleAdd} className="space-y-2">
        <Label htmlFor="new-section-name">{t("menuLayout.sectionName")}</Label>
        <div className="flex flex-wrap gap-2">
          <Input
            id="new-section-name"
            value={newName}
            maxLength={MAX_SECTION_NAME}
            placeholder={t("menuLayout.sectionNamePlaceholder")}
            onChange={(event) => setNewName(event.target.value)}
            className="h-11 min-w-0 flex-1"
          />
          <Button type="submit" size="lg" disabled={!canAdd}>
            <Plus className="mr-1 h-4 w-4" />
            {t("menuLayout.addSection")}
          </Button>
        </div>
        {newNameError && <p className="text-sm text-destructive">{newNameError}</p>}
        {draft.sections.length >= MAX_SECTIONS && (
          <p className="text-sm text-muted-foreground">
            {t("errors:menuLayout.tooManySections", { max: MAX_SECTIONS })}
          </p>
        )}
      </form>

      <div className="space-y-4">
        {draft.sections.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
            {t("menuLayout.empty")}
          </p>
        )}
        {draft.sections.map((section, index) => (
          <MenuLayoutSection
            key={section.key}
            section={section}
            sections={draft.sections}
            currency={currency}
            isFirst={index === 0}
            isLast={index === draft.sections.length - 1}
            onRename={(key, name) => update(renameSection(draft, key, name))}
            onDelete={(key) => update(deleteSection(draft, key))}
            onMoveSection={(key, delta) => update(moveSection(draft, key, delta))}
            onMoveDish={(key, itemId, delta) => update(moveDish(draft, key, itemId, delta))}
            onMoveDishTo={(itemId, target) => update(moveDishTo(draft, itemId, target))}
          />
        ))}
      </div>

      <section aria-label={t("menuLayout.unsectioned")} className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold">{t("menuLayout.unsectioned")}</h3>
          <p className="text-sm text-muted-foreground">{t("menuLayout.unsectionedHint")}</p>
        </div>
        {draft.unsectioned.length > 0 && (
          <ul className="space-y-2">
            {draft.unsectioned.map((item) => (
              <MenuLayoutDish
                key={item._id}
                item={item}
                currency={currency}
                sectionKey={UNSECTIONED}
                sections={draft.sections}
                onMoveTo={(itemId, target) => update(moveDishTo(draft, itemId, target))}
              />
            ))}
          </ul>
        )}
      </section>

      <div className="sticky bottom-0 z-10 -mx-2 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
        <div className="min-w-0 flex-1 text-sm">
          <p role="status" className="font-medium">
            {isDirty ? t("menuLayout.unsaved") : ""}
          </p>
          {error && (
            <p role="alert" className="text-destructive">
              {error}
            </p>
          )}
        </div>
        <Button type="button" variant="outline" disabled={!isDirty || isSaving} onClick={handleDiscard}>
          {t("menuLayout.discard")}
        </Button>
        <Button
          type="button"
          disabled={!isDirty || isSaving || Boolean(validationError)}
          onClick={handleSave}
        >
          {isSaving ? <Spinner size="sm" /> : t("menuLayout.save")}
        </Button>
      </div>
    </div>
  );
};
