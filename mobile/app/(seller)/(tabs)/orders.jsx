import { useEffect, useState } from "react";
import { FlatList, RefreshControl, ScrollView, View } from "react-native";
import { router } from "expo-router";
import { ACTIVE_STATUS_FILTER, toOrderViews } from "@chowgo/shared/adapters/order";
import { errorMessage } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";

import { StatusDot } from "@/components/ui/Badge";
import { Chip } from "@/components/ui/Chip";
import { SearchInput } from "@/components/ui/Input";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";

import { ReceiptText } from "lucide-react-native";
import { SellerOrderCard } from "@/features/seller/SellerOrderCard";
import { useSellerOrders, useUpdateOrderStatus } from "@/hooks/SellerOrders/useSellerOrders";
import { useSocket } from "@/realtime/SocketProvider";
import { toast } from "@/store/useToastStore";
import { useRefreshTint } from "@/theme/useRefreshTint";

const FILTERS = [
  { key: "active", label: "Active", status: ACTIVE_STATUS_FILTER },
  { key: "pending", label: "New", status: "pending" },
  { key: "preparing", label: "Preparing", status: "preparing" },
  { key: "ready", label: "Ready", status: "ready" },
  { key: "delivered", label: "Done", status: "delivered" },
];

export default function SellerOrdersScreen() {
  const refreshTint = useRefreshTint();
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
        <View className="gap-4 px-5">
          <SectionHeader
            title="Orders"
            size="lg"
            subtitle={`${orders.length} on the board`}
            /* A seller needs to know the live feed is live; a stale console is
               indistinguishable from a quiet evening. */
            actionLabel={isConnected ? "Live" : "Reconnecting"}
            onAction={() => query.refetch()}
          />

          <SearchInput
            value={text}
            onChangeText={setText}
            placeholder="Order number or customer"
            autoCorrect={false}
            clearButtonMode="while-editing"
            right={<StatusDot tone={isConnected ? "success" : "muted"} />}
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
              <Chip
                key={entry.key}
                label={count ? `${entry.label} · ${count}` : entry.label}
                active={filter === entry.key}
                onPress={() => setFilter(entry.key)}
              />
            );
          })}
        </ScrollView>
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
                <Skeleton key={index} className="h-36 w-full rounded-lg" />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={ReceiptText}
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
