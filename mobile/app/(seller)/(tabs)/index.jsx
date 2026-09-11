import { RefreshControl, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Clock, Store } from "lucide-react-native";
import { toOrderViews } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { BarChart } from "@/components/charts/BarChart";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

import { Screen } from "@/components/ui/Screen";
import { Divider, SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { SellerOrderCard } from "@/features/seller/SellerOrderCard";
import { useOwnRestaurant } from "@/hooks/Restaurants/useOwnRestaurant";
import { useRestaurantStats } from "@/hooks/Restaurants/useRestaurantStats";
import { useSellerOrders } from "@/hooks/SellerOrders/useSellerOrders";
import { useTokens } from "@/theme/useTokens";
import { useRefreshTint } from "@/theme/useRefreshTint";

function StatTile({ label, value, icon, tone, trend, isPositive }) {
  const { color } = useTokens();
  const Arrow = isPositive ? ArrowUpRight : ArrowDownRight;

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

      {trend !== undefined && trend !== 0 ? (
        <View className="flex-row items-center gap-1">
          <Arrow size={13} color={isPositive ? color.success : color.destructive} />
          <Text variant="label-sm" tone={isPositive ? "success" : "destructive"}>
            {Math.abs(trend)}%
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

/**
 * The kitchen board.
 *
 * Four counts that answer "what is on my pass right now" without opening the
 * orders tab. Each is tinted by how urgent it is - amber for something waiting
 * on a human decision, citrus for something cooking, mint for something done.
 */
function KitchenTile({ label, value, tone, hint }) {
  const TONES = {
    warning: "bg-warning-subtle",
    citrus: "bg-tertiary-subtle",
    mint: "bg-primary-subtle",
    muted: "bg-muted",
  };
  const TEXT = {
    warning: "warning",
    citrus: "tertiary",
    mint: "primary",
    muted: "muted",
  };

  return (
    <View className={`flex-1 gap-1 rounded-md p-3 ${TONES[tone]}`}>
      <Text variant="caption" tone={TEXT[tone]} numberOfLines={1}>
        {label}
      </Text>
      <Text variant="price-lg" tone={TEXT[tone]}>
        {value}
      </Text>
      {hint ? (
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export default function SellerOverview() {
  const refreshTint = useRefreshTint();
  const query = useRestaurantStats();
  const { data: restaurant } = useOwnRestaurant();
  const board = useSellerOrders({ status: "active" });
  const { color } = useTokens();

  const stats = query.data?.stats;
  const chartData = query.data?.chartData ?? [];
  const popularItems = query.data?.popularItems ?? [];
  const recentOrders = toOrderViews(query.data?.recentOrders ?? []);
  const counts = board.data?.counts ?? {};
  const isOpen = Boolean(restaurant?.isOpenNow);

  if (query.isLoading) {
    return (
      <Screen edges={["top"]} className="gap-4 p-5">
        <Skeleton className="h-14 w-full rounded-lg" />
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
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
          />
        }
      >
        {/* Identity first: a seller with two branches needs to know which one
              these numbers belong to before reading any of them. */}
        <View className="flex-row items-center gap-3 pb-1">
          <View className="h-11 w-11 overflow-hidden rounded-sm bg-muted">
            {restaurant?.profilePicture ? (
              <Image source={restaurant.profilePicture} style={{ flex: 1 }} contentFit="cover" />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Store size={20} color={color["muted-foreground"]} />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text variant="h2" numberOfLines={1}>
              {restaurant?.name ?? "Your restaurant"}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              Today at a glance
            </Text>
          </View>
        </View>

        {/* Whether the kitchen is currently taking orders is precomputed by the
              cron job from the schedule, so this reports it rather than offering
              a switch there is no endpoint to honour. */}
        <Card
          className="flex-row items-center gap-3"
          bordered={!isOpen}
          elevation={isOpen ? "subtle" : "none"}
        >
          <StatusDot tone={isOpen ? "success" : "muted"} size={10} />
          <View className="flex-1">
            <Text variant="h3">{isOpen ? "Accepting orders" : "Closed right now"}</Text>
            <Text variant="caption" tone="muted">
              {isOpen ? "Customers can order from you" : "Set your hours in Settings"}
            </Text>
          </View>
          <Button variant="mint" size="sm" onPress={() => router.push("/(seller)/(tabs)/settings")}>
            Hours
          </Button>
        </Card>

        <View className="flex-row gap-3">
          <StatTile
            label="Revenue this month"
            value={formatPrice(Number(stats?.totalRevenue?.value ?? 0))}
            trend={stats?.totalRevenue?.trend}
            isPositive={stats?.totalRevenue?.isPositive}
          />

          <StatTile
            label="Active orders"
            value={String(stats?.activeOrders?.value ?? 0)}
            trend={stats?.activeOrders?.trend}
            isPositive={stats?.activeOrders?.isPositive}
          />
        </View>

        <View className="flex-row gap-3">
          <StatTile
            label="Customers"
            value={String(stats?.totalCustomers?.value ?? 0)}
            trend={stats?.totalCustomers?.trend}
            isPositive={stats?.totalCustomers?.isPositive}
          />

          <StatTile label="Store rating" value={String(stats?.rating?.value ?? "—")} />
        </View>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h3">Revenue this week</Text>
              <Text variant="caption" tone="muted">
                Tap a bar for that day
              </Text>
            </View>
          </View>
          <BarChart
            data={chartData.map((entry) => ({
              label: entry.date,
              tick: entry.date?.slice(5),
              value: entry.revenue ?? 0,
            }))}
            formatValue={(value) => formatPrice(value)}
            peakLabel="Best day"
          />
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <Text variant="h3" className="flex-1">
              On the pass
            </Text>
          </View>

          <View className="flex-row gap-2">
            <KitchenTile
              label="Pending"
              value={counts.pending ?? 0}
              tone="warning"
              hint="Needs you"
            />

            <KitchenTile label="Cooking" value={counts.preparing ?? 0} tone="citrus" />
            <KitchenTile label="Ready" value={counts.ready ?? 0} tone="mint" hint="For pickup" />
            <KitchenTile label="Out" value={counts.in_transit ?? 0} tone="muted" />
          </View>

          <Button size="lg" fullWidth onPress={() => router.push("/(seller)/(tabs)/orders")}>
            <View className="flex-row items-center gap-2">
              <Text variant="body-lg" className="font-jakarta-bold text-primary-foreground">
                Open the order board
              </Text>
              <ArrowRight size={19} strokeWidth={2.6} color={color["primary-foreground"]} />
            </View>
          </Button>
        </Card>

        <Card className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="flex-1">
              <Text variant="h3">Best sellers</Text>
              <Text variant="caption" tone="muted">
                This month
              </Text>
            </View>
          </View>

          {popularItems.length ? (
            popularItems.map((item, index) => (
              <View key={item.name}>
                {index > 0 ? <Divider className="mb-3" /> : null}
                <View className="flex-row items-center gap-3">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-subtle">
                    <Text variant="label-sm" tone="primary">
                      {index + 1}
                    </Text>
                  </View>
                  <View className="h-11 w-11 overflow-hidden rounded-sm bg-muted">
                    {item.image ? (
                      <Image source={item.image} style={{ flex: 1 }} contentFit="cover" />
                    ) : null}
                  </View>
                  <View className="flex-1">
                    <Text variant="h3" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {item.totalOrders} ordered
                    </Text>
                  </View>
                  <Text variant="price">{formatPrice(item.totalRevenue ?? 0)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text variant="body-sm" tone="muted">
              Nothing ordered yet this month.
            </Text>
          )}
        </Card>

        <SectionHeader
          title="Recent orders"
          subtitle="The last few through your kitchen"
          actionLabel="See all"
          onAction={() => router.push("/(seller)/(tabs)/orders")}
          className="pt-2"
        />

        {recentOrders.length ? (
          <View className="gap-3">
            {recentOrders.map((order) => (
              <SellerOrderCard
                key={order.id}
                order={order}
                onPress={() => router.push(`/(seller)/incoming/${order.id}`)}
                onOpen={() => router.push(`/(seller)/order/${order.id}`)}
                onAdvance={() => router.push("/(seller)/(tabs)/orders")}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={Clock}
            title="No orders yet"
            description="They will appear here the moment one arrives."
          />
        )}
      </ScrollView>
    </Screen>
  );
}
