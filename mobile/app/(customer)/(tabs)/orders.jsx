import { useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { ACTIVE_STATUS_FILTER, toOrderViews } from "@chowgo/shared/adapters/order";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Button } from "@/components/ui/Button";
import { Screen } from "@/components/ui/Screen";
import { Text } from "@/components/ui/Text";
import { OrderCard } from "@/features/orders/OrderCard";
import { useCustomerOrders } from "@/hooks/Orders/useOrders";
import { useAuthStore } from "@/store/useAuthStore";

export default function Orders() {
  const authUser = useAuthStore((state) => state.authUser);
  const [tab, setTab] = useState("active");

  const query = useCustomerOrders(
    tab === "active" ? { status: ACTIVE_STATUS_FILTER } : { limit: 20 },
  );

  if (!authUser) {
    return (
      <Screen edges={["top"]} className="justify-center">
        <EmptyState
          title="Sign in to see your orders"
          description="Your order history lives with your account."
          actionLabel="Sign in"
          onAction={() => router.push("/(auth)/login")}
        />
      </Screen>
    );
  }

  const orders = toOrderViews(query.data?.orders ?? []);
  const visible =
    tab === "active" ? orders : orders.filter((order) => order.lifecycle !== "active");

  return (
    <Screen edges={["top"]}>
      <View className="flex-row gap-2 px-5 pb-3 pt-2">
        {["active", "past"].map((key) => (
          <Button
            key={key}
            size="sm"
            variant={tab === key ? "primary" : "outline"}
            className="flex-1"
            onPress={() => setTab(key)}
          >
            {key === "active" ? "Active" : "Past"}
          </Button>
        ))}
      </View>

      <FlatList
        data={visible}
        keyExtractor={(order) => order.id}
        contentContainerClassName="gap-3 px-5 pb-28"
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />
        }
        renderItem={({ item }) => (
          <OrderCard order={item} onPress={() => router.push(`/(customer)/order/${item.id}`)} />
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </View>
          ) : (
            <EmptyState
              title={tab === "active" ? "No active orders" : "No past orders"}
              description={
                tab === "active"
                  ? "When you order, you can track it here."
                  : "Delivered and cancelled orders show up here."
              }
            />
          )
        }
      />
    </Screen>
  );
}
