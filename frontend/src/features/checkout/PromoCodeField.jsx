import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TicketPercent, X } from "lucide-react";

import { formatPrice } from "@chowgo/shared/format";
import { normalizeCode, promoDiscountLabel } from "@chowgo/shared/promoCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMyVouchers, useValidatePromo } from "@/hooks/Promo/usePromo";

export function PromoCodeField({ restaurantId, currency, applied, onApply, onRemove }) {
  const { t } = useTranslation(["promo", "errors"]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(null);
  const validate = useValidatePromo();
  const { data: vouchers = [] } = useMyVouchers({ enabled: !applied });

  const apply = (raw) => {
    const code = normalizeCode(raw);
    if (!code || !restaurantId) return;
    setError(null);
    validate.mutate(
      { code, restaurantId },
      {
        onSuccess: (result) => {
          setDraft("");
          onApply({ code: result.promo.code, discount: result.discount, promo: result.promo });
        },
        onError: (err) => setError(err?.response?.data?.message || t("checkout.failed")),
      },
    );
  };

  if (applied) {
    return (
      <div className="bg-primary/5 border-primary/20 flex items-center gap-3 rounded-md border p-3">
        <TicketPercent className="text-primary size-4 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-medium">{t("checkout.applied", { code: applied.code })}</p>
          <p className="text-caption text-muted-foreground">
            {applied.promo?.label || promoDiscountLabel(t, applied.promo, formatPrice)}
            {applied.discount > 0 && ` · ${t("checkout.saving", { amount: formatPrice(applied.discount, { currency }) })}`}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={t("checkout.remove")} onClick={onRemove}>
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          apply(draft);
        }}
      >
        <Label htmlFor="promo-code" className="sr-only">
          {t("checkout.label")}
        </Label>
        <Input
          id="promo-code"
          value={draft}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          maxLength={24}
          placeholder={t("checkout.placeholder")}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "promo-code-error" : undefined}
          onChange={(event) => {
            setDraft(event.target.value.toUpperCase());
            if (error) setError(null);
          }}
          className="h-9 uppercase"
        />
        <Button type="submit" variant="outline" size="sm" className="h-9" disabled={!draft.trim()} isLoading={validate.isPending}>
          {t("checkout.apply")}
        </Button>
      </form>

      {error && (
        <p id="promo-code-error" role="alert" className="text-caption text-destructive">
          {error}
        </p>
      )}

      {vouchers.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-caption text-muted-foreground">{t("checkout.yourVouchers")}</p>
          <div className="flex flex-wrap gap-2">
            {vouchers.map((voucher) => (
              <Button
                key={voucher.code}
                type="button"
                variant="outline"
                size="sm"
                aria-label={t("checkout.useVoucher", { code: voucher.code })}
                onClick={() => apply(voucher.code)}
              >
                <TicketPercent className="size-3.5" aria-hidden="true" />
                {promoDiscountLabel(t, voucher, formatPrice)}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
