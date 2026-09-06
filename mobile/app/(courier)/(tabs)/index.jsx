import { RefreshControl, ScrollView, Switch, View } from "react-native";
import { router } from "expo-router";
import { toOrderViews } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { BarChart } from "@/components/charts/BarChart";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import {
  useCourierOrders,
  useCourierOverview,
  useCourierProfile,
  useDutyStatus,
} from "@/hooks/Courier/useCourier";
import { toast } from "@/store/useToastStore";
import { useTokens } from "@/theme/useTokens";

function Stat({ label, value }) {
  return (
    <Card className="flex-1 gap-1">
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="h2">{value}</Text>
    </Card>
  );
}

export default function CourierToday() {
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
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-40 w-full" />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerClassName="gap-5 p-5 pb-28"
        refreshControl={
          <RefreshControl
            refreshing={overview.isRefetching}
            onRefresh={() => {
              overview.refetch();
              active.refetch();
            }}
          />
        }
      >
        <Text variant="h1">Today</Text>

        {/* The one control that decides whether work arrives at all, so it sits
            above everything else and states its own consequence. */}
        <Card className="flex-row items-center justify-between">
          <View className="flex-1 gap-0.5 pr-3">
            <Text variant="label">{onDuty ? "You're on duty" : "You're off duty"}</Text>
            <Text variant="caption" tone="muted">
              {onDuty ? "New orders can be claimed." : "You won't be offered deliveries."}
            </Text>
          </View>
          <Switch
            value={onDuty}
            disabled={duty.isPending}
            onValueChange={(next) =>
              duty.mutate(next, {
                onError: () => toast.error("Could not change your duty status"),
              })
            }
            trackColor={{ true: color.primary, false: color.border }}
          />
        </Card>

        {activeOrders.length ? (
          <View className="gap-2">
            <Text variant="h3">Active delivery</Text>
            {activeOrders.map((order) => (
              <Card key={order.id} className="gap-3">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text variant="label">{order.restaurant?.name}</Text>
                    <Text variant="caption" tone="muted">
                      #{order.number} · {order.statusLabel}
                    </Text>
                  </View>
                  <Text variant="price">{formatPrice(order.pricing?.deliveryFee ?? 0)}</Text>
                </View>
                <Button onPress={() => router.push(`/(courier)/delivery/${order.id}`)}>
                  Continue delivery
                </Button>
              </Card>
            ))}
          </View>
        ) : null}

        <View className="flex-row gap-3">
          <Stat label="Earned today" value={formatPrice(analytics?.today?.earnings ?? 0)} />
          <Stat label="Deliveries" value={String(analytics?.today?.deliveries ?? 0)} />
        </View>
        <View className="flex-row gap-3">
          <Stat label="This week" value={formatPrice(analytics?.week?.earnings ?? 0)} />
          <Stat label="This month" value={formatPrice(analytics?.month?.earnings ?? 0)} />
        </View>

        <Card className="gap-3">
          <Text variant="h3">Earnings this week</Text>
          <BarChart
            data={(analytics?.chartData ?? []).map((entry) => ({
              label: entry.day,
              tick: entry.day,
              value: entry.earnings ?? 0,
            }))}
            formatValue={(value) => formatPrice(value)}
          />
        </Card>

        <Card className="gap-2">
          <Text variant="h3">All time</Text>
          {[
            ["Deliveries", String(analytics?.allTime?.totalDeliveries ?? 0)],
            ["Completed", String(analytics?.allTime?.successfulDeliveries ?? 0)],
            ["Cancelled", String(analytics?.allTime?.cancelledDeliveries ?? 0)],
            ["Acceptance rate", `${analytics?.allTime?.acceptanceRate ?? 0}%`],
            ["Rating", String(analytics?.allTime?.averageRating ?? 0)],
          ].map(([label, value]) => (
            <View key={label} className="flex-row justify-between">
              <Text variant="body-sm" tone="muted">
                {label}
              </Text>
              <Text variant="body-sm">{value}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}
