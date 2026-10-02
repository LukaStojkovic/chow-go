import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PROMO_LIMITS } from "@chowgo/shared/promoCode";
import { CURRENCIES } from "@chowgo/shared/currency";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);
const numberOrNull = (value) => (value === "" || value === null || value === undefined ? null : Number(value));

function initialState(promo, currency) {
  return {
    code: promo?.code ?? "",
    label: promo?.label ?? "",
    type: promo?.type ?? "percentage",
    value: promo?.value ? String(promo.value) : "",
    maxDiscount: promo?.maxDiscount ? String(promo.maxDiscount) : "",
    minSubtotal: promo?.minSubtotal ? String(promo.minSubtotal) : "",
    startsAt: toLocalInput(promo?.startsAt),
    endsAt: toLocalInput(promo?.endsAt),
    maxRedemptions: promo?.maxRedemptions ? String(promo.maxRedemptions) : "",
    perCustomerLimit: String(promo?.perCustomerLimit ?? 1),
    firstOrderOnly: Boolean(promo?.firstOrderOnly),
    currency: promo?.currency ?? currency,
  };
}

function Field({ id, label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function PromoCodeFormDialog({ open, promo, types, currency, showCurrency = false, isSaving, onSubmit, onClose }) {
  const { t } = useTranslation("promo");
  const [form, setForm] = useState(() => initialState(promo, currency));
  const isEdit = Boolean(promo?._id);
  const locked = isEdit && promo.redemptionCount > 0;
  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event?.target ? event.target.value : event }));
  const money = form.currency;

  const submit = (event) => {
    event.preventDefault();
    const payload = {
      label: form.label.trim(),
      minSubtotal: numberOrNull(form.minSubtotal) ?? 0,
      startsAt: fromLocalInput(form.startsAt),
      endsAt: fromLocalInput(form.endsAt),
      maxRedemptions: numberOrNull(form.maxRedemptions),
      perCustomerLimit: numberOrNull(form.perCustomerLimit) ?? 1,
      firstOrderOnly: form.firstOrderOnly,
    };
    if (!isEdit) payload.code = form.code.trim();
    if (!locked) {
      payload.type = form.type;
      if (form.type !== "free_delivery") payload.value = Number(form.value);
      payload.maxDiscount = form.type === "percentage" ? numberOrNull(form.maxDiscount) : null;
      if (showCurrency) payload.currency = form.currency;
    }
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? t("manage.edit") : t("manage.create")}</DialogTitle>
            {locked && <DialogDescription>{t("manage.lockedNotice")}</DialogDescription>}
          </DialogHeader>

          <Field id="promo-code-input" label={t("fields.code")} hint={isEdit ? null : t("fields.codeHint")}>
            <Input
              id="promo-code-input"
              value={form.code}
              disabled={isEdit}
              required
              minLength={PROMO_LIMITS.minCodeLength}
              maxLength={PROMO_LIMITS.maxCodeLength}
              pattern="[A-Za-z0-9-]+"
              autoComplete="off"
              className="uppercase"
              onChange={(event) => setForm((f) => ({ ...f, code: event.target.value.toUpperCase() }))}
            />
          </Field>

          <Field id="promo-label" label={t("fields.label")} hint={t("fields.labelHint")}>
            <Input id="promo-label" value={form.label} maxLength={PROMO_LIMITS.maxLabelLength} onChange={set("label")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="promo-type" label={t("fields.type")}>
              <Select value={form.type} onValueChange={set("type")} disabled={locked}>
                <SelectTrigger id="promo-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {showCurrency && (
              <Field id="promo-currency" label={t("fields.currency")}>
                <Select value={form.currency} onValueChange={set("currency")} disabled={locked}>
                  <SelectTrigger id="promo-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(CURRENCIES).map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}

            {form.type !== "free_delivery" && (
              <Field
                id="promo-value"
                label={form.type === "percentage" ? t("fields.valuePercent") : t("fields.valueAmount", { currency: money })}
              >
                <Input
                  id="promo-value"
                  type="number"
                  inputMode="decimal"
                  min={form.type === "percentage" ? 1 : 0.01}
                  max={form.type === "percentage" ? PROMO_LIMITS.maxPercentOff : undefined}
                  step={form.type === "percentage" ? 1 : "any"}
                  required
                  disabled={locked}
                  value={form.value}
                  onChange={set("value")}
                />
              </Field>
            )}

            {form.type === "percentage" && (
              <Field id="promo-max" label={t("fields.maxDiscount", { currency: money })} hint={t("fields.maxDiscountHint")}>
                <Input
                  id="promo-max"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  disabled={locked}
                  value={form.maxDiscount}
                  onChange={set("maxDiscount")}
                />
              </Field>
            )}

            <Field id="promo-min" label={t("fields.minSubtotal", { currency: money })}>
              <Input id="promo-min" type="number" inputMode="decimal" min={0} step="any" value={form.minSubtotal} onChange={set("minSubtotal")} />
            </Field>

            <Field id="promo-starts" label={t("fields.startsAt")}>
              <Input id="promo-starts" type="datetime-local" value={form.startsAt} onChange={set("startsAt")} />
            </Field>

            <Field id="promo-ends" label={t("fields.endsAt")}>
              <Input id="promo-ends" type="datetime-local" value={form.endsAt} onChange={set("endsAt")} />
            </Field>

            <Field id="promo-total" label={t("fields.maxRedemptions")} hint={t("fields.maxRedemptionsHint")}>
              <Input
                id="promo-total"
                type="number"
                min={Math.max(1, promo?.redemptionCount ?? 1)}
                step={1}
                value={form.maxRedemptions}
                onChange={set("maxRedemptions")}
              />
            </Field>

            <Field id="promo-per" label={t("fields.perCustomerLimit")}>
              <Input id="promo-per" type="number" min={1} step={1} required value={form.perCustomerLimit} onChange={set("perCustomerLimit")} />
            </Field>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="promo-first"
              checked={form.firstOrderOnly}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, firstOrderOnly: checked }))}
            />
            <Label htmlFor="promo-first">{t("fields.firstOrderOnly")}</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              {t("manage.cancel")}
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {t("manage.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
