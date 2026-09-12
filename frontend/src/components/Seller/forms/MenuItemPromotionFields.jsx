/**
 * The promotion block inside the add / edit menu item forms.
 *
 * A dish is put on sale here and nowhere else, so this is the one place that
 * has to make the consequence obvious: the preview line answers "what will the
 * customer actually pay?" before the form is ever submitted, which is the
 * question a percentage field on its own never answers.
 *
 * Rendered as a real `<fieldset>` with a `<legend>`, so a screen reader
 * announces "Promotion" as the group every one of these controls belongs to.
 *
 * The preview sentence is a `<Trans>` rather than four concatenated fragments:
 * Serbian puts the amounts in a different order from English, and a sentence
 * assembled from pieces can only ever be built in one language's word order.
 */

import { Trans, useTranslation } from "react-i18next";
import { CalendarClock } from "lucide-react";

import { formatPrice } from "@chowgo/shared/format";
import { PROMOTION_LIMITS, previewPromotion, promotionTypes } from "@chowgo/shared/promotion";
import { translateFieldError } from "@chowgo/shared/i18n/fieldErrors";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

/**
 * @param {Object} props
 * @param {import("react-hook-form").UseFormRegister} props.register
 * @param {import("react-hook-form").UseFormWatch} props.watch
 * @param {import("react-hook-form").UseFormSetValue} props.setValue
 * @param {Object} props.errors react-hook-form's `formState.errors`.
 */
export function MenuItemPromotionFields({ register, watch, setValue, errors }) {
  const { t } = useTranslation(["seller", "common"]);
  const promotion = watch("promotion") || {};
  const isActive = Boolean(promotion.isActive);
  const type = promotion.type || "percentage";
  const price = parseFloat(watch("price"));

  const preview = previewPromotion(price, { type, value: promotion.value });
  const fieldErrors = errors?.promotion || {};

  const isPercentage = type === "percentage";
  const typeOptions = promotionTypes(t);

  return (
    <fieldset className="border-border space-y-5 rounded-md border p-4">
      <legend className="text-label text-foreground px-1">
        {t("seller:promotion.legend")}
      </legend>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Label htmlFor="promotion-active" className="cursor-pointer">
            {t("seller:promotion.enableLabel")}
          </Label>
          <p className="text-body-sm text-muted-foreground mt-1">
            {t("seller:promotion.enableHint")}
          </p>
        </div>
        <Switch
          id="promotion-active"
          checked={isActive}
          onCheckedChange={(checked) =>
            setValue("promotion.isActive", checked, { shouldValidate: true })
          }
        />
      </div>

      {isActive && (
        <div className="border-border space-y-5 border-t pt-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="promotion-type">{t("seller:promotion.typeLabel")}</Label>
              <Select
                value={type}
                onValueChange={(value) =>
                  setValue("promotion.type", value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="promotion-type" className="mt-2 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {typeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="promotion-value">
                {isPercentage
                  ? t("seller:promotion.percentOff")
                  : t("seller:promotion.amountOff")}
              </Label>
              <Input
                id="promotion-value"
                type="number"
                inputMode="decimal"
                step={isPercentage ? "1" : "0.01"}
                min="0"
                max={isPercentage ? String(PROMOTION_LIMITS.maxPercentOff) : undefined}
                placeholder={isPercentage ? "25" : "2.00"}
                className="mt-2 h-12"
                aria-describedby="promotion-preview"
                aria-invalid={fieldErrors.value ? "true" : undefined}
                {...register("promotion.value")}
              />
              {fieldErrors.value && (
                <p className="text-body-sm text-destructive mt-1">
                  {translateFieldError(fieldErrors.value, t)}
                </p>
              )}
            </div>
          </div>

          {/* Announced politely: the number changes on every keystroke, and an
              assertive region would interrupt the typing that caused it. */}
          <p
            id="promotion-preview"
            aria-live="polite"
            className="text-body-sm text-muted-foreground"
          >
            {preview.isValid ? (
              <Trans
                t={t}
                i18nKey="seller:promotion.preview"
                values={{
                  discounted: formatPrice(preview.discounted),
                  original: formatPrice(price),
                  percent: preview.percentOff,
                  saving: formatPrice(preview.saving),
                }}
                components={[
                  <span key="new" className="text-primary tabular font-semibold" />,
                  <span key="old" className="tabular line-through" />,
                  <span key="saving" className="tabular" />,
                ]}
              />
            ) : isPercentage ? (
              t("seller:promotion.previewHintPercent", {
                min: formatPrice(PROMOTION_LIMITS.minPrice),
                max: PROMOTION_LIMITS.maxPercentOff,
              })
            ) : (
              t("seller:promotion.previewHint", {
                min: formatPrice(PROMOTION_LIMITS.minPrice),
              })
            )}
          </p>

          <div>
            <Label htmlFor="promotion-label">{t("seller:promotion.badgeLabel")}</Label>
            <Input
              id="promotion-label"
              placeholder={t("seller:promotion.badgePlaceholder")}
              maxLength={PROMOTION_LIMITS.maxLabelLength}
              className="mt-2 h-12"
              aria-describedby="promotion-label-hint"
              {...register("promotion.label")}
            />
            <p id="promotion-label-hint" className="text-body-sm text-muted-foreground mt-1">
              {t("seller:promotion.badgeHint")}
            </p>
            {fieldErrors.label && (
              <p className="text-body-sm text-destructive mt-1">
                {translateFieldError(fieldErrors.label, t)}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-label text-foreground flex items-center gap-2">
              <CalendarClock className="size-4" aria-hidden="true" />
              {t("seller:promotion.scheduleTitle")}
            </p>
            <p className="text-body-sm text-muted-foreground">
              {t("seller:promotion.scheduleHint")}
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="promotion-starts">{t("seller:promotion.startsAt")}</Label>
                <Input
                  id="promotion-starts"
                  type="datetime-local"
                  className="mt-2 h-12"
                  {...register("promotion.startsAt")}
                />
                {fieldErrors.startsAt && (
                  <p className="text-body-sm text-destructive mt-1">
                    {translateFieldError(fieldErrors.startsAt, t)}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="promotion-ends">{t("seller:promotion.endsAt")}</Label>
                <Input
                  id="promotion-ends"
                  type="datetime-local"
                  className="mt-2 h-12"
                  aria-invalid={fieldErrors.endsAt ? "true" : undefined}
                  {...register("promotion.endsAt")}
                />
                {fieldErrors.endsAt && (
                  <p className="text-body-sm text-destructive mt-1">
                    {translateFieldError(fieldErrors.endsAt, t)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}
