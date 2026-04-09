import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { useSocket } from "@/contexts/SocketContext";
import { Wifi, WifiOff, MapPin, Package, Truck, CheckCircle2, X } from "lucide-react";
import { useGetCourierAvailableOrders } from "@/hooks/CourierOrders/useGetCourierAvailableOrders";
import { useGetCourierOrders } from "@/hooks/CourierOrders/useGetCourierOrders";
import { useCourierOrderMutations } from "@/hooks/CourierOrders/useCourierOrderMutations";
import { useCourierLocationTracker } from "@/hooks/CourierOrders/useCourierLocationTracker";

function StatusPill({ status }) {
  const map = {
    ready: { label: "Ready", variant: "secondary" },
    assigned: { label: "Assigned", variant: "default" },
    picked_up: { label: "Picked Up", variant: "secondary" },
    in_transit: { label: "In Transit", variant: "secondary" },
    delivered: { label: "Delivered", variant: "success" },
    cancelled: { label: "Cancelled", variant: "destructive" },
  };

  const v = map[status] || { label: status, variant: "secondary" };
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

function OrderCard({ order, actions }) {
  const restaurantName = order?.restaurant?.name || "Restaurant";
  const orderNumber = order?.orderNumber || order?._id?.slice?.(-6);
  const itemsCount = order?.items?.length || 0;
  const total = typeof order?.total === "number" ? order.total : null;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold truncate">Order #{orderNumber}</h3>
            <StatusPill status={order.status} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
            {restaurantName} • {itemsCount} item{itemsCount === 1 ? "" : "s"}
            {total != null ? ` • $${total.toFixed(2)}` : ""}
          </p>
        </div>
      </div>

      {order?.restaurant?.address?.city && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="truncate">
            {order.restaurant.address.street}, {order.restaurant.address.city}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {actions}
      </div>
    </div>
  );
}

export default function CourierOrdersPage() {
  const { isConnected } = useSocket();
  const [tab, setTab] = useState("available");

  const { accept, cancel, pickedUp, inTransit, delivered } = useCourierOrderMutations();

  const { orders: availableOrders, isLoading: isLoadingAvailable } =
    useGetCourierAvailableOrders();

  const courierStatus = useMemo(() => {
    if (tab === "available") return null;
    if (tab === "active") return "active";
    return tab;
  }, [tab]);

  const { orders: myOrders, isLoading: isLoadingMyOrders } = useGetCourierOrders({
    status: courierStatus || "active",
  });

  const activeOrderId = useMemo(() => {
    const o = myOrders?.find((x) =>
      ["assigned", "picked_up", "in_transit"].includes(x.status),
    );
    return o?._id || null;
  }, [myOrders]);

  useCourierLocationTracker(activeOrderId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 pb-24">
      <main className="container mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Courier Orders</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Accept deliveries and update status in real time.
            </p>
          </div>
          <Badge variant={isConnected ? "success" : "destructive"}>
            {isConnected ? (
              <>
                <Wifi className="w-3 h-3 mr-1" />
                Live
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>

        <Card className="border-gray-100 dark:border-zinc-800">
          <CardHeader className="pb-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full justify-start">
                <TabsTrigger value="available">
                  <Package className="h-4 w-4" />
                  Available
                </TabsTrigger>
                <TabsTrigger value="active">
                  <Truck className="h-4 w-4" />
                  Active
                </TabsTrigger>
                <TabsTrigger value="delivered">
                  <CheckCircle2 className="h-4 w-4" />
                  Delivered
                </TabsTrigger>
              </TabsList>

              <CardContent className="pt-6">
                <TabsContent value="available" className="space-y-4">
                  {isLoadingAvailable ? (
                    <div className="text-sm text-muted-foreground">Loading…</div>
                  ) : availableOrders.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No orders are ready right now.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {availableOrders.map((order) => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          actions={
                            <Button
                              onClick={() => accept.mutate(order._id)}
                              disabled={accept.isPending}
                              className="rounded-xl"
                            >
                              Accept
                            </Button>
                          }
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                  {isLoadingMyOrders ? (
                    <div className="text-sm text-muted-foreground">Loading…</div>
                  ) : myOrders.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      You don’t have any active orders.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {myOrders.map((order) => (
                        <OrderCard
                          key={order._id}
                          order={order}
                          actions={
                            <>
                              {order.status === "assigned" && (
                                <>
                                  <Button
                                    variant="secondary"
                                    onClick={() => pickedUp.mutate(order._id)}
                                    disabled={pickedUp.isPending}
                                    className="rounded-xl"
                                  >
                                    Picked up
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      cancel.mutate({
                                        orderId: order._id,
                                        reason: "Cancelled by courier",
                                      })
                                    }
                                    disabled={cancel.isPending}
                                    className="rounded-xl"
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </>
                              )}

                              {order.status === "picked_up" && (
                                <Button
                                  variant="secondary"
                                  onClick={() => inTransit.mutate(order._id)}
                                  disabled={inTransit.isPending}
                                  className="rounded-xl"
                                >
                                  Start delivery
                                </Button>
                              )}

                              {order.status === "in_transit" && (
                                <Button
                                  onClick={() => delivered.mutate(order._id)}
                                  disabled={delivered.isPending}
                                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                                >
                                  Mark delivered
                                </Button>
                              )}
                            </>
                          }
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="delivered" className="space-y-4">
                  {isLoadingMyOrders ? (
                    <div className="text-sm text-muted-foreground">Loading…</div>
                  ) : myOrders.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No delivered orders yet.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {myOrders.map((order) => (
                        <OrderCard key={order._id} order={order} actions={null} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </CardHeader>
        </Card>
      </main>
    </div>
  );
}

