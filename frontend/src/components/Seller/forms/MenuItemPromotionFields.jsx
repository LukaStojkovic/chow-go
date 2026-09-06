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
 */

import { CalendarClock } from "lucide-react";

import { formatPrice } from "@chowgo/shared/format";
import { PROMOTION_LIMITS, PROMOTION_TYPES, previewPromotion } from "@chowgo/shared/promotion";
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
  const promotion = watch("promotion") || {};
  const isActive = Boolean(promotion.isActive);
  const type = promotion.type || "percentage";
  const price = parseFloat(watch("price"));

  const preview = previewPromotion(price, { type, value: promotion.value });
  const fieldErrors = errors?.promotion || {};

  const isPercentage = type === "percentage";

  return (
    <fieldset className="border-border space-y-5 rounded-md border p-4">
      <legend className="text-label text-foreground px-1">Promotion</legend>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Label htmlFor="promotion-active" className="cursor-pointer">
            Put this dish on sale
          </Label>
          <p className="text-body-sm text-muted-foreground mt-1">
            Reduced dishes are collected into &ldquo;Deals near you&rdquo; on the
            customer home screen, and carry a discount badge everywhere they
            appear.
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
              <Label htmlFor="promotion-type">Discount type</Label>
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
                  {PROMOTION_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="promotion-value">
                {isPercentage ? "Percent off" : "Amount off"}
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
                  {fieldErrors.value.message}
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
              <>
                Customers pay{" "}
                <span className="text-primary tabular font-semibold">
                  {formatPrice(preview.discounted)}
                </span>{" "}
                instead of{" "}
                <span className="tabular line-through">{formatPrice(price)}</span>{" "}
                &mdash; {preview.percentOff}% off, saving{" "}
                <span className="tabular">{formatPrice(preview.saving)}</span> per
                dish.
              </>
            ) : (
              <>
                Set a price and a discount to see what customers will pay. A
                promotion cannot take a dish below{" "}
                {formatPrice(PROMOTION_LIMITS.minPrice)}
                {isPercentage ? `, or exceed ${PROMOTION_LIMITS.maxPercentOff}%` : ""}
                .
              </>
            )}
          </p>

          <div>
            <Label htmlFor="promotion-label">Badge text (optional)</Label>
            <Input
              id="promotion-label"
              placeholder="e.g. Weekend deal"
              maxLength={PROMOTION_LIMITS.maxLabelLength}
              className="mt-2 h-12"
              aria-describedby="promotion-label-hint"
              {...register("promotion.label")}
            />
            <p id="promotion-label-hint" className="text-body-sm text-muted-foreground mt-1">
              Shown next to the discount. Leave empty to show just the
              percentage.
            </p>
            {fieldErrors.label && (
              <p className="text-body-sm text-destructive mt-1">
                {fieldErrors.label.message}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-label text-foreground flex items-center gap-2">
              <CalendarClock className="size-4" aria-hidden="true" />
              Run it for a set period (optional)
            </p>
            <p className="text-body-sm text-muted-foreground">
              Leave both empty and the promotion runs until you switch it off.
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="promotion-starts">Starts</Label>
                <Input
                  id="promotion-starts"
                  type="datetime-local"
                  className="mt-2 h-12"
                  {...register("promotion.startsAt")}
                />
                {fieldErrors.startsAt && (
                  <p className="text-body-sm text-destructive mt-1">
                    {fieldErrors.startsAt.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="promotion-ends">Ends</Label>
                <Input
                  id="promotion-ends"
                  type="datetime-local"
                  className="mt-2 h-12"
                  aria-invalid={fieldErrors.endsAt ? "true" : undefined}
                  {...register("promotion.endsAt")}
                />
                {fieldErrors.endsAt && (
                  <p className="text-body-sm text-destructive mt-1">
                    {fieldErrors.endsAt.message}
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
