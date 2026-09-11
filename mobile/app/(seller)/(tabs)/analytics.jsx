import { RefreshControl, ScrollView, View } from "react-native";
import {
  Clock,
  CreditCard,
  MessageSquareQuote,
  PieChart,
  Star,
  TrendingUp,
} from "lucide-react-native";
import { formatPrice } from "@chowgo/shared/format";
import { BarChart, ProportionRow } from "@/components/charts/BarChart";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Card } from "@/components/ui/Card";

import { Screen } from "@/components/ui/Screen";
import { Divider, SectionHeader } from "@/components/ui/Section";
import { Text } from "@/components/ui/Text";
import { useRestaurantAnalytics } from "@/hooks/Restaurants/useRestaurantStats";
import { useTokens } from "@/theme/useTokens";
import { useRefreshTint } from "@/theme/useRefreshTint";

const STATUS_TONES = {
  delivered: "success",
  cancelled: "destructive",
  rejected: "destructive",
  pending: "warning",
};

function Kpi({ label, value, icon, tone = "mint" }) {
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

// A card whose heading carries an icon tile, matching the dashboard so the two
// screens read as one console rather than two.
function Panel({ title, subtitle, icon, tone = "mint", children }) {
  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text variant="h3" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </Card>
  );
}

export default function SellerAnalytics() {
  const refreshTint = useRefreshTint();
  const query = useRestaurantAnalytics();
  const { color } = useTokens();
  const data = query.data;

  if (query.isLoading) {
    return (
      <Screen edges={["top"]} className="gap-4 p-5">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </Screen>
    );
  }

  const kpis = data?.kpis ?? {};
  const statusTotal = (data?.orderStatusBreakdown ?? []).reduce((sum, e) => sum + e.count, 0);
  const paymentTotal = (data?.paymentMethodSplit ?? []).reduce((sum, e) => sum + e.count, 0);

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
        <SectionHeader
          title="Analytics"
          size="lg"
          subtitle="How the kitchen is trading"
          className="pb-1"
        />

        <View className="flex-row gap-3">
          <Kpi label="Revenue today" value={formatPrice(kpis.todayRevenue ?? 0)} />

          <Kpi label="Orders today" value={String(kpis.todayOrders ?? 0)} />
        </View>
        <View className="flex-row gap-3">
          <Kpi label="Average order" value={formatPrice(kpis.avgOrderValue ?? 0)} />

          <Kpi label="This month" value={formatPrice(kpis.monthlyRevenue ?? 0)} />
        </View>

        <Card className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text variant="h3">Store rating</Text>
            <Text variant="caption" tone="muted">
              {kpis.totalReviews ?? 0} reviews
            </Text>
          </View>
          <View className="flex-row items-center gap-1.5">
            <Star size={17} color={color.rating} fill={color.rating} />
            <Text variant="price-lg">{(kpis.averageRating ?? 0).toFixed(1)}</Text>
          </View>
        </Card>

        <Panel title="Revenue this week" subtitle="Tap a bar for that day" icon={TrendingUp}>
          <BarChart
            data={(data?.dailyRevenue ?? []).map((entry) => ({
              label: entry.date,
              tick: entry.date,
              value: entry.revenue ?? 0,
            }))}
            formatValue={(value) => formatPrice(value)}
            peakLabel="Best day"
          />
        </Panel>

        <Panel title="Busiest hours" subtitle="When the tickets land" icon={Clock} tone="citrus">
          <BarChart
            // A tick every six hours: twenty-four labels on a phone is noise.
            data={(data?.peakHours ?? []).map((entry, index) => ({
              label: entry.hour,
              tick: index % 6 === 0 ? entry.hour : "",
              value: entry.orders ?? 0,
            }))}
            formatValue={(value) => `${value} orders`}
            peakLabel="Rush hour"
          />
        </Panel>

        <Panel title="Order outcomes" icon={PieChart} tone="info">
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
        </Panel>

        <Panel title="How customers pay" icon={CreditCard} tone="info">
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
        </Panel>

        <Panel title="Top items" subtitle="Best sellers over the period" tone="warning">
          {(data?.topItems ?? []).length ? (
            data.topItems.map((item, index) => (
              <View key={item._id}>
                {index > 0 ? <Divider className="mb-3" /> : null}
                <View className="flex-row items-center gap-3">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-subtle">
                    <Text variant="label-sm" tone="primary">
                      {index + 1}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text variant="h3" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {item.totalQuantity} sold
                    </Text>
                  </View>
                  <Text variant="price">{formatPrice(item.totalRevenue ?? 0)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text variant="body-sm" tone="muted">
              Nothing sold yet.
            </Text>
          )}
        </Panel>

        <View className="gap-3 pt-2">
          <SectionHeader title="Recent reviews" subtitle="What customers said" />
          {(data?.recentRatings ?? []).length ? (
            data.recentRatings.map((rating, index) => (
              <Card key={rating._id ?? index} className="gap-2">
                <View className="flex-row items-center gap-1">
                  {Array.from({ length: 5 }).map((_, star) => (
                    <Star
                      key={star}
                      size={15}
                      color={star < (rating.rating ?? 0) ? color.rating : color["border-strong"]}
                      fill={star < (rating.rating ?? 0) ? color.rating : "transparent"}
                    />
                  ))}
                </View>
                {rating.review ? (
                  <Text variant="body" tone="muted">
                    {rating.review}
                  </Text>
                ) : null}
              </Card>
            ))
          ) : (
            <EmptyState
              icon={MessageSquareQuote}
              title="No reviews yet"
              description="Ratings appear here once orders start being delivered."
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
