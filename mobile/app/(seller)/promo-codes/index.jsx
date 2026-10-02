import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Archive, Plus, TicketPercent } from "lucide-react-native";
import { formatDate, formatPrice } from "@chowgo/shared/format";
import { promoDiscountLabel } from "@chowgo/shared/promoCode";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button, IconButton } from "@/components/ui/Button";
import { PressableCard } from "@/components/ui/Card";
import { Sheet, SheetActions } from "@/components/ui/Dialog";
import { Screen, ScreenHeader } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useSellerPromoCodes, useSellerPromoStatus } from "@/hooks/Promo/usePromo";
import { toast } from "@/store/useToastStore";

const STATUS_TONE = { active: "mint", paused: "warning", archived: "neutral" };

function usesLabel(t, promo) {
  return promo.maxRedemptions
    ? t("promo:uses.limited", { used: promo.redemptionCount, max: promo.maxRedemptions })
    : t("promo:uses.unlimited", { used: promo.redemptionCount });
}

export default function SellerPromoCodes() {
  const { t } = useTranslation(["promo"]);
  const list = useSellerPromoCodes({ page: 1, limit: 50 });
  const status = useSellerPromoStatus();
  const [archiving, setArchiving] = useState(null);
  const items = list.data?.items ?? [];

  const change = (promo, action) =>
    status.mutate(
      { id: promo._id, action },
      {
        onSuccess: () => toast.success(t("promo:manage.updated")),
        onError: (error) => toast.error(errorMessage(error)),
      },
    );

  return (
    <Screen>
      <ScreenHeader
        title={t("promo:manage.title")}
        right={
          <IconButton
            icon={Plus}
            variant="primary"
            label={t("promo:manage.create")}
            onPress={() => router.push("/(seller)/promo-codes/new")}
          />
        }
      />
      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-8"
        refreshControl={<RefreshControl refreshing={list.isRefetching} onRefresh={list.refetch} />}
      >
        <Text variant="body-sm" tone="muted">
          {t("promo:manage.description")}
        </Text>

        {list.isError ? (
          <Text variant="body-sm" tone="destructive">
            {t("promo:manage.loadFailed")}
          </Text>
        ) : !list.isLoading && items.length === 0 ? (
          <EmptyState
            icon={TicketPercent}
            title={t("promo:manage.empty")}
            description={t("promo:manage.emptyDescription")}
            actionLabel={t("promo:manage.create")}
            onAction={() => router.push("/(seller)/promo-codes/new")}
          />
        ) : (
          items.map((promo) => (
            <PressableCard
              key={promo._id}
              className="gap-2"
              onPress={() => router.push(`/(seller)/promo-codes/${promo._id}`)}
              accessibilityLabel={promo.code}
            >
              <View className="flex-row items-center gap-2">
                <Text variant="h3" className="flex-1" numberOfLines={1}>
                  {promo.code}
                </Text>
                <Badge tone={STATUS_TONE[promo.status]} size="sm">
                  {t(`promo:status.${promo.status}`)}
                </Badge>
              </View>
              <Text variant="body-sm">{promo.label || promoDiscountLabel(t, promo, formatPrice)}</Text>
              <Text variant="caption" tone="muted">
                {[
                  promo.label ? promoDiscountLabel(t, promo, formatPrice) : null,
                  usesLabel(t, promo),
                  promo.endsAt ? t("promo:validity.until", { date: formatDate(promo.endsAt) }) : t("promo:validity.always"),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
              {promo.status !== "archived" ? (
                <View className="flex-row gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="mint"
                    onPress={() => change(promo, promo.status === "active" ? "pause" : "resume")}
                  >
                    {promo.status === "active" ? t("promo:actions.pause") : t("promo:actions.resume")}
                  </Button>
                  <Button size="sm" variant="ghost" onPress={() => setArchiving(promo)}>
                    {t("promo:actions.archive")}
                  </Button>
                </View>
              ) : null}
            </PressableCard>
          ))
        )}
      </ScrollView>

      <Sheet
        visible={Boolean(archiving)}
        onClose={() => setArchiving(null)}
        icon={Archive}
        title={t("promo:actions.archive")}
        description={t("promo:manage.archiveConfirm", { code: archiving?.code })}
      >
        <SheetActions>
          <Button variant="outline" size="lg" fullWidth onPress={() => setArchiving(null)}>
            {t("promo:manage.cancel")}
          </Button>
          <Button
            variant="destructive"
            size="lg"
            fullWidth
            onPress={() => {
              change(archiving, "archive");
              setArchiving(null);
            }}
          >
            {t("promo:actions.archive")}
          </Button>
        </SheetActions>
      </Sheet>
    </Screen>
  );
}
