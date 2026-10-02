import { useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { TicketPercent, X } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { normalizeCode, promoDiscountLabel } from "@chowgo/shared/promoCode";
import { errorMessage } from "@/api/client";
import { Button, IconButton } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { useMyVouchers, useValidatePromo } from "@/hooks/Promo/usePromo";
import { useTokens } from "@/theme/useTokens";

export function PromoCodeField({ restaurantId, currency, applied, onApply, onRemove }) {
  const { t } = useTranslation(["promo"]);
  const { color } = useTokens();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(null);
  const validate = useValidatePromo();
  const vouchers = useMyVouchers({ enabled: !applied });

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
        onError: (err) => setError(errorMessage(err) || t("promo:checkout.failed")),
      },
    );
  };

  if (applied) {
    return (
      <View className="bg-primary-subtle flex-row items-center gap-3 rounded-lg px-4 py-3">
        <TicketPercent size={18} color={color.primary} />
        <View className="flex-1">
          <Text variant="label">{t("promo:checkout.applied", { code: applied.code })}</Text>
          <Text variant="caption" tone="muted">
            {applied.promo?.label || promoDiscountLabel(t, applied.promo, formatPrice)}
            {applied.discount > 0
              ? ` · ${t("promo:checkout.saving", { amount: formatPrice(applied.discount, { currency }) })}`
              : ""}
          </Text>
        </View>
        <IconButton icon={X} size={32} variant="muted" label={t("promo:checkout.remove")} onPress={onRemove} />
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-start gap-2">
        <Input
          containerClassName="flex-1"
          value={draft}
          onChangeText={(value) => {
            setDraft(value.toUpperCase());
            if (error) setError(null);
          }}
          placeholder={t("promo:checkout.placeholder")}
          accessibilityLabel={t("promo:checkout.label")}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={24}
          returnKeyType="done"
          onSubmitEditing={() => apply(draft)}
          error={error}
        />
        <Button variant="mint" size="md" className="h-14" disabled={!draft.trim()} loading={validate.isPending} onPress={() => apply(draft)}>
          {t("promo:checkout.apply")}
        </Button>
      </View>

      {vouchers.data?.length ? (
        <View className="gap-2">
          <Text variant="caption" tone="muted">
            {t("promo:checkout.yourVouchers")}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {vouchers.data.map((voucher) => (
              <Chip
                key={voucher.code}
                icon={TicketPercent}
                label={promoDiscountLabel(t, voucher, formatPrice)}
                onPress={() => apply(voucher.code)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
