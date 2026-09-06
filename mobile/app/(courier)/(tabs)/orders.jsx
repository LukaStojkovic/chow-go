import { useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { PackageSearch } from "lucide-react-native";
import { toOrderViews } from "@chowgo/shared/adapters/order";
import { formatPrice } from "@chowgo/shared/format";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { useAcceptOrder, useAvailableOrders, useCourierOrders } from "@/hooks/Courier/useCourier";
import { toast } from "@/store/useToastStore";

const TABS = [
  { key: "available", label: "Available" },
  { key: "active", label: "Active" },
  { key: "history", label: "History" },
];

function PoolCard({ order, raw, onClaim, isClaiming }) {
  return (
    <Card className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-0.5">
          <Text variant="label" numberOfLines={1}>
            {order.restaurant?.name}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={2}>
            to {raw?.deliveryAddressSnapshot?.fullAddress ?? "the customer"}
          </Text>
        </View>
        <View className="items-end">
          <Text variant="price">{formatPrice(raw?.deliveryFee ?? 0)}</Text>
          <Text variant="caption" tone="muted">
            {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
          </Text>
        </View>
      </View>
      <Button loading={isClaiming} onPress={onClaim}>
        Claim delivery
      </Button>
    </Card>
  );
}

export default function CourierOrders() {
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
      toast.success("Delivery claimed");
      router.push(`/(courier)/delivery/${orderId}`);
    } catch (error) {
      // Claiming is a race the backend settles atomically, so losing it is
      // ordinary rather than an error worth alarming about.
      toast.info("Someone else took that one", { description: errorMessage(error) });
    }
  }

  return (
    <Screen edges={["top"]}>
      <View className="gap-3 pb-3 pt-2">
        <Text variant="h1" className="px-5">
          Orders
        </Text>
        <View className="flex-row gap-2 px-5">
          {TABS.map((entry) => (
            <Button
              key={entry.key}
              size="sm"
              variant={tab === entry.key ? "primary" : "outline"}
              className="flex-1"
              onPress={() => setTab(entry.key)}
            >
              {entry.label}
            </Button>
          ))}
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerClassName="gap-3 px-5 pb-28"
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />
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
            <Card className="gap-2">
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <Text variant="label" numberOfLines={1}>
                    {item.restaurant?.name}
                  </Text>
                  <Text variant="caption" tone="muted">
                    #{item.number} · {item.statusLabel}
                  </Text>
                </View>
                <Text variant="price">{formatPrice(rawOrders[index]?.deliveryFee ?? 0)}</Text>
              </View>
              {tab === "active" ? (
                <Button size="sm" onPress={() => router.push(`/(courier)/delivery/${item.id}`)}>
                  Continue
                </Button>
              ) : null}
            </Card>
          )
        }
        ListEmptyComponent={
          query.isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full" />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={PackageSearch}
              title={
                tab === "available"
                  ? "Nothing waiting"
                  : tab === "active"
                    ? "No active delivery"
                    : "No deliveries yet"
              }
              description={
                tab === "available"
                  ? "Orders appear here the moment a restaurant marks one ready."
                  : undefined
              }
            />
          )
        }
      />
    </Screen>
  );
}
