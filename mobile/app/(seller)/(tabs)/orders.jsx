import { useEffect, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { ACTIVE_STATUS_FILTER, toOrderViews } from "@chowgo/shared/adapters/order";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { SellerOrderCard } from "@/features/seller/SellerOrderCard";
import { useSellerOrders, useUpdateOrderStatus } from "@/hooks/SellerOrders/useSellerOrders";
import { useSocket } from "@/realtime/SocketProvider";
import { toast } from "@/store/useToastStore";

const FILTERS = [
  { key: "active", label: "Active", status: ACTIVE_STATUS_FILTER },
  { key: "pending", label: "New", status: "pending" },
  { key: "preparing", label: "Preparing", status: "preparing" },
  { key: "ready", label: "Ready", status: "ready" },
  { key: "delivered", label: "Done", status: "delivered" },
];

export default function SellerOrdersScreen() {
  const [filter, setFilter] = useState("active");
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const { isConnected } = useSocket();
  const advance = useUpdateOrderStatus();

  useEffect(() => {
    const timer = setTimeout(() => setSearch(text.trim()), 350);
    return () => clearTimeout(timer);
  }, [text]);

  const active = FILTERS.find((entry) => entry.key === filter) ?? FILTERS[0];
  const query = useSellerOrders({ status: active.status, search: search || undefined, limit: 30 });
  const orders = toOrderViews(query.data?.orders ?? []);
  const counts = query.data?.counts ?? {};

  return (
    <Screen edges={["top"]}>
      <View className="gap-3 pb-3 pt-2">
        <View className="flex-row items-center justify-between px-5">
          <Text variant="h1">Orders</Text>
          {/* A seller needs to know the live feed is live; a stale console is
              indistinguishable from a quiet evening. */}
          <View className="flex-row items-center gap-1.5">
            <View
              className={`h-2 w-2 rounded-full ${isConnected ? "bg-success" : "bg-muted-foreground"}`}
            />
            <Text variant="caption" tone="muted">
              {isConnected ? "Live" : "Reconnecting"}
            </Text>
          </View>
        </View>

        <View className="px-5">
          <Input
            value={text}
            onChangeText={setText}
            placeholder="Order number or customer"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2 px-5"
        >
          {FILTERS.map((entry) => {
            const count = entry.key === "active" ? undefined : counts[entry.key];
            return (
              <Button
                key={entry.key}
                size="sm"
                variant={filter === entry.key ? "primary" : "outline"}
                onPress={() => setFilter(entry.key)}
              >
                {count ? `${entry.label} (${count})` : entry.label}
              </Button>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerClassName="gap-3 px-5 pb-28"
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />
        }
        renderItem={({ item }) => (
          <SellerOrderCard
            order={item}
            isBusy={advance.isPending && advance.variables?.orderId === item.id}
            onPress={() => router.push(`/(seller)/incoming/${item.id}`)}
            onOpen={() => router.push(`/(seller)/order/${item.id}`)}
            onAdvance={async (status) => {
              try {
                await advance.mutateAsync({ orderId: item.id, status });
              } catch (error) {
                toast.error("Could not update the order", { description: errorMessage(error) });
              }
            }}
          />
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28 w-full" />
              ))}
            </View>
          ) : (
            <EmptyState
              title={search ? `Nothing for "${search}"` : "No orders here"}
              description={
                filter === "active" ? "New orders appear here the moment they arrive." : undefined
              }
            />
          )
        }
      />
    </Screen>
  );
}
