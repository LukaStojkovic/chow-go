import { RefreshControl, ScrollView, View } from "react-native";
import { Star } from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { BarChart, ProportionRow } from "@/components/charts/BarChart";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useRestaurantAnalytics } from "@/hooks/Restaurants/useRestaurantStats";
import { useTokens } from "@/theme/useTokens";

const STATUS_TONES = {
  delivered: "success",
  cancelled: "destructive",
  rejected: "destructive",
  pending: "warning",
};

function Kpi({ label, value }) {
  return (
    <Card className="flex-1 gap-1">
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Text variant="h3">{value}</Text>
    </Card>
  );
}

export default function SellerAnalytics() {
  const query = useRestaurantAnalytics();
  const { color } = useTokens();
  const data = query.data;

  if (query.isLoading) {
    return (
      <Screen edges={["top"]} className="gap-4 p-5">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-48 w-full" />
      </Screen>
    );
  }

  const kpis = data?.kpis ?? {};
  const statusTotal = (data?.orderStatusBreakdown ?? []).reduce((sum, e) => sum + e.count, 0);
  const paymentTotal = (data?.paymentMethodSplit ?? []).reduce((sum, e) => sum + e.count, 0);

  return (
    <Screen edges={["top"]}>
      <ScrollView
        contentContainerClassName="gap-5 p-5 pb-28"
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />
        }
      >
        <Text variant="h1">Analytics</Text>

        <View className="flex-row gap-3">
          <Kpi label="Today" value={formatPrice(kpis.todayRevenue ?? 0)} />
          <Kpi label="Orders today" value={String(kpis.todayOrders ?? 0)} />
        </View>
        <View className="flex-row gap-3">
          <Kpi label="Average order" value={formatPrice(kpis.avgOrderValue ?? 0)} />
          <Kpi label="This month" value={formatPrice(kpis.monthlyRevenue ?? 0)} />
        </View>

        <Card className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text variant="h3">Rating</Text>
            <View className="flex-row items-center gap-1.5">
              <Star size={15} color={color.rating} fill={color.rating} />
              <Text variant="price">{(kpis.averageRating ?? 0).toFixed(1)}</Text>
              <Text variant="caption" tone="muted">
                ({kpis.totalReviews ?? 0})
              </Text>
            </View>
          </View>
        </Card>

        <Card className="gap-3">
          <Text variant="h3">Revenue this week</Text>
          <BarChart
            data={(data?.dailyRevenue ?? []).map((entry) => ({
              label: entry.date,
              tick: entry.date,
              value: entry.revenue ?? 0,
            }))}
            formatValue={(value) => formatPrice(value)}
          />
        </Card>

        <Card className="gap-3">
          <Text variant="h3">Busiest hours</Text>
          <BarChart
            // A tick every six hours: twenty-four labels on a phone is noise.
            data={(data?.peakHours ?? []).map((entry, index) => ({
              label: entry.hour,
              tick: index % 6 === 0 ? entry.hour : "",
              value: entry.orders ?? 0,
            }))}
            barClassName="bg-info"
            formatValue={(value) => `${value} orders`}
          />
        </Card>

        <Card className="gap-3">
          <Text variant="h3">Order outcomes</Text>
          {statusTotal ? (
            (data?.orderStatusBreakdown ?? []).map((entry) => (
              <ProportionRow
                key={entry._id}
                label={entry._id}
                value={entry.count}
                total={statusTotal}
                tone={STATUS_TONES[entry._id] ?? "primary"}
              />
            ))
          ) : (
            <Text variant="body-sm" tone="muted">
              No orders yet.
            </Text>
          )}
        </Card>

        <Card className="gap-3">
          <Text variant="h3">How customers pay</Text>
          {paymentTotal ? (
            (data?.paymentMethodSplit ?? []).map((entry) => (
              <ProportionRow
                key={entry._id}
                label={entry._id === "cash" ? "Cash on delivery" : "Card"}
                value={entry.count}
                total={paymentTotal}
                tone="info"
              />
            ))
          ) : (
            <Text variant="body-sm" tone="muted">
              No payments yet.
            </Text>
          )}
        </Card>

        <Card className="gap-3">
          <Text variant="h3">Top items</Text>
          {(data?.topItems ?? []).length ? (
            data.topItems.map((item) => (
              <View key={item._id} className="flex-row items-center justify-between gap-3">
                <View className="flex-1">
                  <Text variant="label" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {item.totalQuantity} sold
                  </Text>
                </View>
                <Text variant="price">{formatPrice(item.totalRevenue ?? 0)}</Text>
              </View>
            ))
          ) : (
            <Text variant="body-sm" tone="muted">
              Nothing sold yet.
            </Text>
          )}
        </Card>

        <View className="gap-3">
          <Text variant="h3">Recent reviews</Text>
          {(data?.recentRatings ?? []).length ? (
            data.recentRatings.map((rating, index) => (
              <Card key={rating._id ?? index} className="gap-1">
                <View className="flex-row items-center gap-1">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <Star
                      key={star}
                      size={13}
                      color={color.rating}
                      fill={star < (rating.rating ?? 0) ? color.rating : "transparent"}
                    />
                  ))}
                </View>
                {rating.review ? (
                  <Text variant="body-sm" tone="muted">
                    {rating.review}
                  </Text>
                ) : null}
              </Card>
            ))
          ) : (
            <EmptyState title="No reviews yet" description="Ratings appear here after delivery." />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
