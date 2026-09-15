import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { ArrowRight, PackageSearch } from "lucide-react-native";
import { toOrderViews } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Chip";

import { Screen } from "@/components/ui/Screen";
import { Divider, SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { useAcceptOrder, useAvailableOrders, useCourierOrders } from "@/hooks/Courier/useCourier";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";
import { useRefreshTint } from "@/theme/useRefreshTint";

// Keys, not copy: module scope runs before a language is chosen.
const TABS = [
  { value: "available", labelKey: "orders.available" },
  { value: "active", labelKey: "order:list.tabs.active" },
  { value: "history", labelKey: "order:list.tabs.past" },
];

const BADGE_TONE = {
  warning: "warning",
  info: "info",
  primary: "mint",
  success: "mint",
  destructive: "danger",
};

/**
 * A job in the pool.
 *
 * The fee is the largest thing on the card because it is the only number a
 * courier is deciding on, and the two addresses sit under it as a route so the
 * distance is legible before the claim rather than after.
 */
function PoolCard({ order, raw, onClaim, isClaiming }) {
  const { t } = useTranslation(["courier", "basket", "common"]);
  const { color } = useTokens();

  return (
    <Card className="gap-3" elevation="raised">
      <View className="flex-row items-start gap-3">
        <View className="flex-1 gap-1">
          <Text variant="caption" tone="muted">
            {t("basket:summary.deliveryFee")}
          </Text>
          <Text variant="price-xl" tone="primary">
            {formatPrice(raw?.deliveryFee ?? 0)}
          </Text>
        </View>
        <Badge tone="neutral">
          {t("basket:itemCount", { count: order.itemCount })}
        </Badge>
      </View>

      <Divider />

      <View className="gap-2.5">
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text variant="caption" tone="muted">
              {t("delivery.pickup")}
            </Text>
            <Text variant="body" numberOfLines={1}>
              {order.restaurant?.name}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text variant="caption" tone="muted">
              {t("delivery.dropoff")}
            </Text>
            <Text variant="body" numberOfLines={2}>
              {raw?.deliveryAddressSnapshot?.fullAddress ?? t("delivery.customer")}
            </Text>
          </View>
        </View>
      </View>

      <Button size="lg" fullWidth loading={isClaiming} onPress={onClaim}>
        <View className="flex-row items-center gap-2">
          <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
            {t("orders.accept")}
          </Text>
          <ArrowRight size={19} strokeWidth={2.6} color={color["primary-foreground"]} />
        </View>
      </Button>
    </Card>
  );
}

export default function CourierOrders() {
  const { t } = useTranslation(["courier", "profile", "order", "basket", "seller", "auth", "common"]);
  const refreshTint = useRefreshTint();
  const [tab, setTab] = useState("available");
  const accept = useAcceptOrder();

  const pool = useAvailableOrders();
  const mine = useCourierOrders(tab === "history" ? "history" : "active");
  const query = tab === "available" ? pool : mine;

  const rawOrders = query.data?.orders ?? [];
  const orders = toOrderViews(rawOrders);

  async function claim(orderId) {
    try {
      await accept.mutateAsync(orderId);
      toast.success(t("courier:orders.claimed"));
      router.push(`/(courier)/delivery/${orderId}`);
    } catch (error) {
      // Claiming is a race the backend settles atomically, so losing it is
      // ordinary rather than an error worth alarming about.
      toast.info(t("courier:orders.claimedByOther"), { description: errorMessage(error) });
    }
  }

  return (
    <Screen edges={["top"]}>
      <View className="gap-4 px-5 pb-4 pt-2">
        <SectionHeader
          title={t("orders.title")}
          size="lg"
          subtitle={
            tab === "available"
              ? `${orders.length} waiting to be claimed`
              : tab === "active"
                ? t("courier:orders.carryingNow")
                : t("courier:orders.everythingDelivered")
          }
        />

        <Segmented
          options={TABS.map((entry) => ({ value: entry.value, label: t(entry.labelKey) }))}
          value={tab}
          onChange={setTab}
        />
      </View>

      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerClassName="gap-3 px-5 pb-32"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            {...refreshTint}
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
          />
        }
        renderItem={({ item, index }) =>
          tab === "available" ? (
            <PoolCard
              order={item}
              raw={rawOrders[index]}
              isClaiming={accept.isPending && accept.variables === item.id}
              onClaim={() => claim(item.id)}
            />
          ) : (
            <Card className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <Text variant="h3" numberOfLines={1}>
                    {item.restaurant?.name}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    #{item.number} · {item.placedAtLabel}
                  </Text>
                </View>
                <Text variant="price">{formatPrice(rawOrders[index]?.deliveryFee ?? 0)}</Text>
              </View>

              <View className="flex-row items-center justify-between gap-2">
                <Badge tone={BADGE_TONE[item.statusTone] ?? "neutral"} size="sm">
                  {item.statusLabel}
                </Badge>
                {tab === "active" ? (
                  <Button size="md" onPress={() => router.push(`/(courier)/delivery/${item.id}`)}>
                    {t("orders.resume")}
                  </Button>
                ) : null}
              </View>
            </Card>
          )
        }
        ListEmptyComponent={
          query.isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-40 w-full rounded-lg" />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={PackageSearch}
              title={
                tab === "available"
                  ? t("orders.empty.title")
                  : tab === "active"
                    ? t("orders.empty.noActive")
                    : t("orders.noCompleted")
              }
              description={
                tab === "available"
                  ? t("orders.empty.availableHint")
                  : tab === "active"
                    ? t("orders.empty.activeHint")
                    : t("orders.empty.historyHint")
              }
              actionLabel={tab === "active" ? t("orders.findJob") : undefined}
              onAction={tab === "active" ? () => setTab("available") : undefined}
            />
          )
        }
      />
    </Screen>
  );
}
