import { useState } from "react";
import { FlatList, RefreshControl, View } from "react-native";
import { router } from "expo-router";
import { LogIn, Receipt } from "lucide-react-native";
import { ACTIVE_STATUS_FILTER, toOrderViews } from "@chowgo/shared/adapters/order";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Skeleton } from "@/components/feedback/Skeleton";
import { Segmented } from "@/components/ui/Chip";
import { Screen } from "@/components/ui/Screen";
import { SectionHeader } from "@/components/ui/Section";
import { OrderCard } from "@/features/orders/OrderCard";
import { useCustomerOrders } from "@/hooks/Orders/useOrders";
import { useReorder } from "@/hooks/Orders/useReorder";
import { ReplaceBasketPrompt } from "@/features/basket/ReplaceBasketPrompt";
import { useAuthStore } from "@/store/useAuthStore";
import { useRefreshTint } from "@/theme/useRefreshTint";

const TABS = [
  { value: "active", label: "Active" },
  { value: "past", label: "Past" },
];

export default function Orders() {
  const refreshTint = useRefreshTint();
  const authUser = useAuthStore((state) => state.authUser);
  const [tab, setTab] = useState("active");

  const { reorder, reorderingId, conflict, confirmReplace, cancelReplace } = useReorder();
  const query = useCustomerOrders(
    tab === "active" ? { status: ACTIVE_STATUS_FILTER } : { limit: 20 },
  );

  if (!authUser) {
    return (
      <Screen edges={["top"]} className="justify-center">
        <EmptyState
          icon={LogIn}
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
      <View className="gap-4 px-5 pb-4 pt-2">
        <SectionHeader
          title="Your orders"
          size="lg"
          subtitle={
            tab === "active" ? "Everything on its way to you" : "Delivered and cancelled orders"
          }
        />
        <Segmented options={TABS} value={tab} onChange={setTab} />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(order) => order.id}
        contentContainerClassName="gap-3 px-5 pb-44"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            {...refreshTint}
            refreshing={query.isRefetching}
            onRefresh={query.refetch}
          />
        }
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() => router.push(`/(customer)/order/${item.id}`)}
            onReorder={
              item.canReorder
                ? () => reorder(query.data.orders.find((o) => String(o._id) === item.id))
                : undefined
            }
            isReordering={reorderingId === item.id}
          />
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <View className="gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-32 w-full rounded-lg" />
              ))}
            </View>
          ) : (
            <EmptyState
              icon={Receipt}
              title={tab === "active" ? "No active orders" : "No past orders"}
              description={
                tab === "active"
                  ? "When you order, you can follow it here from the kitchen to your door."
                  : "Delivered and cancelled orders show up here."
              }
              actionLabel={tab === "active" ? "Find something to eat" : undefined}
              onAction={tab === "active" ? () => router.push("/(customer)/(tabs)") : undefined}
            />
          )
        }
      />

      <ReplaceBasketPrompt
        visible={Boolean(conflict)}
        currentRestaurantName={conflict?.currentRestaurantName}
        onConfirm={confirmReplace}
        onCancel={cancelReplace}
      />
    </Screen>
  );
}
