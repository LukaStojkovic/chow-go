import { RefreshControl, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ArrowDownRight, ArrowUpRight } from "lucide-react-native";
import { toOrderViews } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { BarChart } from "@/components/charts/BarChart";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { SellerOrderCard } from "@/features/seller/SellerOrderCard";
import { useRestaurantStats } from "@/hooks/Restaurants/useRestaurantStats";
import { useTokens } from "@/theme/useTokens";

function StatTile({ label, value, trend, isPositive }) {
  const { color } = useTokens();
  const Arrow = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="flex-1 gap-1">
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="h2">{value}</Text>
      {trend !== undefined && trend !== 0 ? (
        <View className="flex-row items-center gap-1">
          <Arrow size={12} color={isPositive ? color.success : color.destructive} />
          <Text variant="caption" tone={isPositive ? "success" : "destructive"}>
            {Math.abs(trend)}%
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

export default function SellerOverview() {
  const query = useRestaurantStats();
  const stats = query.data?.stats;
  const chartData = query.data?.chartData ?? [];
  const popularItems = query.data?.popularItems ?? [];
  const recentOrders = toOrderViews(query.data?.recentOrders ?? []);

  if (query.isLoading) {
    return (
      <Screen edges={["top"]} className="gap-4 p-5">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </Screen>
    );
  }

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerClassName="gap-5 p-5 pb-28"
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />
        }
      >
        <Text variant="h1">Overview</Text>

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
          <StatTile label="Rating" value={String(stats?.rating?.value ?? "—")} />
        </View>

        <Card className="gap-3">
          <Text variant="h3">Revenue this week</Text>
          <BarChart
            data={chartData.map((entry) => ({
              label: entry.date,
              tick: entry.date?.slice(5),
              value: entry.revenue ?? 0,
            }))}
            formatValue={(value) => formatPrice(value)}
          />
        </Card>

        <Card className="gap-3">
          <Text variant="h3">Popular this month</Text>
          {popularItems.length ? (
            popularItems.map((item) => (
              <View key={item.name} className="flex-row items-center gap-3">
                <View className="h-10 w-10 overflow-hidden rounded-sm bg-muted">
                  {item.image ? (
                    <Image source={item.image} style={{ flex: 1 }} contentFit="cover" />
                  ) : null}
                </View>
                <View className="flex-1">
                  <Text variant="label" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {item.totalOrders} ordered
                  </Text>
                </View>
                <Text variant="price">{formatPrice(item.totalRevenue ?? 0)}</Text>
              </View>
            ))
          ) : (
            <Text variant="body-sm" tone="muted">
              Nothing ordered yet this month.
            </Text>
          )}
        </Card>

        <View className="gap-3">
          <Text variant="h3">Recent orders</Text>
          {recentOrders.length ? (
            recentOrders.map((order) => (
              <SellerOrderCard
                key={order.id}
                order={order}
                onPress={() => router.push(`/(seller)/incoming/${order.id}`)}
                onOpen={() => router.push(`/(seller)/order/${order.id}`)}
                onAdvance={() => router.push(`/(seller)/(tabs)/orders`)}
              />
            ))
          ) : (
            <EmptyState title="No orders yet" description="They will appear here as they arrive." />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
