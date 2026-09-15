import { RefreshControl, ScrollView, View } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { ArrowRight, CheckCircle2, Package, Star, TrendingUp, XCircle } from "lucide-react-native";
import { toOrderViews } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { BarChart } from "@/components/charts/BarChart";
import { Skeleton } from "@/components/feedback/Skeleton";
import { StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { Screen } from "@/components/ui/Screen";
import { Divider, SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { Toggle } from "@/components/ui/Toggle";
import { shortStatus } from "@/features/orders/orderStatus";
import {
  useCourierOrders,
  useCourierOverview,
  useCourierProfile,
  useDutyStatus,
} from "@/hooks/Courier/useCourier";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";
import { useRefreshTint } from "@/theme/useRefreshTint";

function Stat({ label, value, icon, tone }) {
  return (
    <Card className="flex-1 gap-2 p-4">
      <View className="flex-row items-start justify-between gap-2">
        <Text variant="caption" tone="muted" numberOfLines={2} className="flex-1">
          {label}
        </Text>
      </View>
      <Text variant="price-lg" numberOfLines={1}>
        {value}
      </Text>
    </Card>
  );
}

export default function CourierToday() {
  const { t } = useTranslation(["courier", "profile", "order", "basket", "seller", "auth", "common"]);
  const refreshTint = useRefreshTint();
  const overview = useCourierOverview();
  const profile = useCourierProfile();
  const duty = useDutyStatus();
  const active = useCourierOrders("active");
  const { color } = useTokens();

  const analytics = overview.data;
  const onDuty = profile.data?.isAvailable ?? false;
  const activeOrders = toOrderViews(active.data?.orders ?? []);

  if (overview.isLoading) {
    return (
      <Screen edges={["top"]} className="gap-4 p-5">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerClassName="gap-3 px-5 pb-32 pt-2"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            {...refreshTint}
            refreshing={overview.isRefetching}
            onRefresh={() => {
              overview.refetch();
              active.refetch();
            }}
          />
        }
      >
        <SectionHeader
          title={t("dashboard.today")}
          size="lg"
          subtitle={`${analytics?.today?.deliveries ?? 0} delivered so far`}
          className="pb-1"
        />

        {/* The one control that decides whether work arrives at all, so it sits
              above everything else and states its own consequence. */}
        <Card className="flex-row items-center gap-3" elevation={onDuty ? "raised" : "subtle"}>
          <View className="flex-1 gap-0.5">
            <View className="flex-row items-center gap-2">
              {onDuty ? <StatusDot /> : null}
              <Text variant="h3">{onDuty ? t("duty.youAreOn") : t("duty.youAreOff")}</Text>
            </View>
            <Text variant="caption" tone="muted">
              {onDuty ? t("duty.onHint") : t("duty.offShortHint")}
            </Text>
          </View>
          <Toggle
            value={onDuty}
            disabled={duty.isPending}
            onValueChange={(next) =>
              duty.mutate(next, {
                onError: () => toast.error(t("duty.changeFailed")),
              })
            }
            accessibilityLabel={t("duty.on")}
          />
        </Card>

        {/* An active delivery outranks every statistic on this screen: it is
              the only thing on it that is still happening. */}
        {activeOrders.length ? (
          <View className="gap-3">
            <SectionHeader title={t("dashboard.inProgress")} className="pt-2" />
            {activeOrders.map((order) => (
              <Card key={order.id} className="gap-3" elevation="raised">
                <View className="flex-row items-center gap-3">
                  <View className="flex-1">
                    <Text variant="h3" numberOfLines={1}>
                      {order.restaurant?.name}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      #{order.number} · {shortStatus(order)}
                    </Text>
                  </View>
                  <Text variant="price">{formatPrice(order.pricing?.deliveryFee ?? 0)}</Text>
                </View>

                <Button
                  size="lg"
                  fullWidth
                  onPress={() => router.push(`/(courier)/delivery/${order.id}`)}
                >
                  <View className="flex-row items-center gap-2">
                    <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
                      {t("delivery.continue")}
                    </Text>
                    <ArrowRight size={19} strokeWidth={2.6} color={color["primary-foreground"]} />
                  </View>
                </Button>
              </Card>
            ))}
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <Stat
            label={t("dashboard.earnedToday")}
            value={formatPrice(analytics?.today?.earnings ?? 0)}
          />

          <Stat
            label={t("dashboard.deliveriesToday")}
            value={String(analytics?.today?.deliveries ?? 0)}
          />
        </View>
        <View className="flex-row gap-3">
          <Stat
            label={t("dashboard.week")}
            value={formatPrice(analytics?.week?.earnings ?? 0)}
          />

          <Stat
            label={t("dashboard.month")}
            value={formatPrice(analytics?.month?.earnings ?? 0)}
          />
        </View>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h3">{t("dashboard.weeklyEarnings")}</Text>
              <Text variant="caption" tone="muted">
                {t("seller:analytics.tapBarHint")}
              </Text>
            </View>
          </View>
          <BarChart
            data={(analytics?.chartData ?? []).map((entry) => ({
              label: entry.day,
              tick: entry.day,
              value: entry.earnings ?? 0,
            }))}
            formatValue={(value) => formatPrice(value)}
            peakLabel={t("seller:analytics.bestDay")}
          />
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <Text variant="h3" className="flex-1">
              {t("dashboard.allTime")}
            </Text>
          </View>

          {[
            {
              icon: Package,
              label: t("dashboard.deliveries"),
              value: analytics?.allTime?.totalDeliveries ?? 0,
            },
            {
              icon: CheckCircle2,
              label: t("profile.successful"),
              value: analytics?.allTime?.successfulDeliveries ?? 0,
            },
            {
              icon: XCircle,
              label: t("order:short.cancelled"),
              value: analytics?.allTime?.cancelledDeliveries ?? 0,
            },
            {
              icon: TrendingUp,
              label: t("dashboard.acceptanceRate"),
              value: `${analytics?.allTime?.acceptanceRate ?? 0}%`,
            },
            {
              icon: Star,
              label: t("dashboard.rating"),
              value: analytics?.allTime?.averageRating ?? 0,
            },
          ].map((row, index) => (
            <View key={row.label}>
              {index > 0 ? <Divider className="mb-3" /> : null}
              <View className="flex-row items-center gap-3">
                <row.icon size={16} color={color["muted-foreground"]} />
                <Text variant="body" tone="muted" className="flex-1">
                  {row.label}
                </Text>
                <Text variant="price">{String(row.value)}</Text>
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}
