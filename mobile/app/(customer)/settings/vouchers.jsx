import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";
import { TicketPercent } from "lucide-react-native";
import { formatDate, formatPrice } from "@chowgo/shared/format";
import { promoDiscountLabel } from "@chowgo/shared/promoCode";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Card } from "@/components/ui/Card";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useMyVouchers } from "@/hooks/Promo/usePromo";
import { useTokens } from "@/theme/useTokens";

export default function Vouchers() {
  const { t } = useTranslation(["promo"]);
  const { color } = useTokens();
  const vouchers = useMyVouchers();

  return (
    <Screen>
      <ScreenHeader title={t("promo:vouchers.title")} subtitle={t("promo:vouchers.description")} />
      {vouchers.data?.length === 0 ? (
        <EmptyState icon={TicketPercent} title={t("promo:vouchers.empty")} />
      ) : (
        <ScrollView contentContainerClassName="gap-3 px-5 pb-6">
          {(vouchers.data ?? []).map((voucher) => (
            <Card key={voucher.code} className="flex-row items-center gap-3">
              <TicketPercent size={22} color={color.primary} />
              <View className="flex-1 gap-0.5">
                <Text variant="label">{promoDiscountLabel(t, voucher, formatPrice)}</Text>
                <Text variant="body-sm" selectable className="font-jakarta-bold">
                  {voucher.code}
                </Text>
                {voucher.endsAt ? (
                  <Text variant="caption" tone="muted">
                    {t("promo:conditions.endsAt", { date: formatDate(voucher.endsAt) })}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
