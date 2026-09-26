import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDate } from "@chowgo/shared/format";

import { PageContainer, Stack } from "@/components/layout/primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAction, useAdminList, useAdminOverview } from "@/hooks/Admin/useAdmin";
import {
  cancelOrderAsAdmin,
  setCourierVerification,
  setRestaurantStatus,
  setUserSuspension,
} from "@/services/apiAdmin";
import { ListToolbar, Pager, ReasonDialog } from "./AdminParts";

const STATUS_TONE = {
  pending: "warning",
  approved: "success",
  verified: "success",
  rejected: "destructive",
  suspended: "destructive",
};

function useListState() {
  const [params, setParams] = useState({ page: 1, limit: 20 });
  return {
    params,
    setStatus: (status) => setParams((p) => ({ ...p, status: status || undefined, page: 1 })),
    setSearch: (q) => setParams((p) => ({ ...p, q: q || undefined, page: 1 })),
    setPage: (page) => setParams((p) => ({ ...p, page })),
  };
}

function ListBody({ query, columns, children }) {
  const { t } = useTranslation("admin");
  if (query.isError) return <p className="text-body-sm text-destructive py-6">{t("loadFailed")}</p>;
  const items = query.data?.items ?? [];

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>{t(`columns.${column}`)}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && !query.isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground text-center py-8">
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              items.map(children)
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

function RestaurantsTab({ ask }) {
  const { t } = useTranslation("admin");
  const list = useListState();
  const query = useAdminList("restaurants", list.params);
  const action = useAdminAction(setRestaurantStatus);

  const button = (restaurant, name, { required = false, destructive = false } = {}) => (
    <Button
      key={name}
      size="sm"
      variant={destructive ? "outline" : "default"}
      onClick={() =>
        ask({
          title: t("reason.title", { action: t(`actions.${name}`), name: restaurant.name }),
          required,
          destructive,
          isPending: action.isPending,
          run: (reason) => action.mutateAsync({ id: restaurant._id, action: name, reason }),
        })
      }
    >
      {t(`actions.${name}`)}
    </Button>
  );

  return (
    <Stack gap="sm">
      <ListToolbar
        statuses={["pending", "approved", "rejected", "suspended"]}
        status={list.params.status}
        onStatus={list.setStatus}
        onSearch={list.setSearch}
        statusLabel={(value) => t(`restaurantStatus.${value}`)}
      />
      <ListBody query={query} columns={["name", "owner", "city", "status", "joined", "actions"]}>
        {(restaurant) => {
          const status = restaurant.approvalStatus ?? "approved";
          return (
            <TableRow key={restaurant._id}>
              <TableCell>
                <p className="font-medium">{restaurant.name}</p>
                <p className="text-caption text-muted-foreground">{restaurant.email}</p>
              </TableCell>
              <TableCell>{restaurant.ownerId?.email ?? "-"}</TableCell>
              <TableCell>{restaurant.address?.city ?? "-"}</TableCell>
              <TableCell>
                <Badge variant={STATUS_TONE[status]}>{t(`restaurantStatus.${status}`)}</Badge>
                {restaurant.approvalNote ? (
                  <p className="text-caption text-muted-foreground mt-1 max-w-56">{restaurant.approvalNote}</p>
                ) : null}
              </TableCell>
              <TableCell>{formatDate(restaurant.createdAt)}</TableCell>
              <TableCell className="space-x-2 whitespace-nowrap">
                {status === "pending" && [
                  button(restaurant, "approve"),
                  button(restaurant, "reject", { required: true, destructive: true }),
                ]}
                {status === "rejected" && button(restaurant, "approve")}
                {status === "approved" && button(restaurant, "suspend", { required: true, destructive: true })}
                {status === "suspended" && button(restaurant, "reinstate")}
              </TableCell>
            </TableRow>
          );
        }}
      </ListBody>
      <Pager pagination={query.data?.pagination} onPage={list.setPage} />
    </Stack>
  );
}

function CouriersTab({ ask }) {
  const { t } = useTranslation("admin");
  const list = useListState();
  const query = useAdminList("couriers", list.params);
  const action = useAdminAction(setCourierVerification);

  const button = (courier, status, label, { required = false, destructive = false } = {}) => (
    <Button
      key={status}
      size="sm"
      variant={destructive ? "outline" : "default"}
      onClick={() =>
        ask({
          title: t("reason.title", { action: t(`actions.${label}`), name: courier.fullName }),
          required,
          destructive,
          run: (reason) => action.mutateAsync({ id: courier._id, status, reason }),
        })
      }
    >
      {t(`actions.${label}`)}
    </Button>
  );

  return (
    <Stack gap="sm">
      <ListToolbar
        statuses={["pending", "verified", "rejected"]}
        status={list.params.status}
        onStatus={list.setStatus}
        onSearch={list.setSearch}
        statusLabel={(value) => t(`courierStatus.${value}`)}
      />
      <ListBody query={query} columns={["name", "phone", "vehicle", "deliveries", "status", "actions"]}>
        {(courier) => (
          <TableRow key={courier._id}>
            <TableCell>
              <p className="font-medium">{courier.fullName}</p>
              <p className="text-caption text-muted-foreground">{courier.email}</p>
            </TableCell>
            <TableCell>{courier.phoneNumber || "-"}</TableCell>
            <TableCell>
              {[courier.vehicleType, courier.vehicleModel, courier.vehicleNumber].filter(Boolean).join(" · ")}
            </TableCell>
            <TableCell>{courier.totalDeliveries ?? 0}</TableCell>
            <TableCell>
              <Badge variant={STATUS_TONE[courier.verificationStatus]}>
                {t(`courierStatus.${courier.verificationStatus}`)}
              </Badge>
            </TableCell>
            <TableCell className="space-x-2 whitespace-nowrap">
              {courier.verificationStatus !== "verified" && button(courier, "verified", "verify")}
              {courier.verificationStatus !== "rejected" &&
                button(courier, "rejected", "reject", { required: true, destructive: true })}
              {courier.verificationStatus !== "pending" && button(courier, "pending", "resetToPending", { destructive: true })}
            </TableCell>
          </TableRow>
        )}
      </ListBody>
      <Pager pagination={query.data?.pagination} onPage={list.setPage} />
    </Stack>
  );
}

function UsersTab({ ask }) {
  const { t } = useTranslation(["admin", "common"]);
  const list = useListState();
  const query = useAdminList("users", list.params);
  const action = useAdminAction(setUserSuspension);

  return (
    <Stack gap="sm">
      <ListToolbar onSearch={list.setSearch} />
      <ListBody query={query} columns={["name", "email", "phone", "role", "status", "actions"]}>
        {(user) => (
          <TableRow key={user._id}>
            <TableCell className="font-medium">
              {user.name}
              {user.isAdmin ? (
                <Badge variant="info" className="ml-2">
                  {t("adminBadge")}
                </Badge>
              ) : null}
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>{user.phoneNumber || "-"}</TableCell>
            <TableCell>{user.role}</TableCell>
            <TableCell>
              {user.suspendedAt ? (
                <>
                  <Badge variant="destructive">{t("suspendedSince", { date: formatDate(user.suspendedAt) })}</Badge>
                  {user.suspensionReason ? (
                    <p className="text-caption text-muted-foreground mt-1 max-w-56">{user.suspensionReason}</p>
                  ) : null}
                </>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="whitespace-nowrap">
              {user.isAdmin ? null : user.suspendedAt ? (
                <Button
                  size="sm"
                  onClick={() =>
                    ask({
                      title: t("reason.title", { action: t("actions.unsuspendAccount"), name: user.email }),
                      run: (reason) => action.mutateAsync({ id: user._id, suspend: false, reason }),
                    })
                  }
                >
                  {t("actions.unsuspendAccount")}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    ask({
                      title: t("reason.title", { action: t("actions.suspendAccount"), name: user.email }),
                      required: true,
                      destructive: true,
                      run: (reason) => action.mutateAsync({ id: user._id, suspend: true, reason }),
                    })
                  }
                >
                  {t("actions.suspendAccount")}
                </Button>
              )}
            </TableCell>
          </TableRow>
        )}
      </ListBody>
      <Pager pagination={query.data?.pagination} onPage={list.setPage} />
    </Stack>
  );
}

function OrdersTab({ ask }) {
  const { t } = useTranslation("admin");
  const [orderId, setOrderId] = useState("");
  const action = useAdminAction(cancelOrderAsAdmin);
  const id = orderId.trim();

  return (
    <Card padded className="space-y-3 max-w-xl">
      <p className="text-body-sm text-muted-foreground">{t("orders.hint")}</p>
      <div className="space-y-2">
        <Label htmlFor="admin-order-id">{t("orders.orderId")}</Label>
        <Input
          id="admin-order-id"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          placeholder={t("orders.orderIdPlaceholder")}
        />
      </div>
      <Button
        variant="destructive"
        disabled={!/^[a-f0-9]{24}$/i.test(id)}
        onClick={() =>
          ask({
            title: t("reason.title", { action: t("actions.cancelOrder"), name: id }),
            required: true,
            destructive: true,
            run: async (reason) => {
              await action.mutateAsync({ id, reason });
              setOrderId("");
            },
          })
        }
      >
        {t("actions.cancelOrder")}
      </Button>
    </Card>
  );
}

function AuditTab() {
  const list = useListState();
  const query = useAdminList("audit", list.params);

  return (
    <Stack gap="sm">
      <ListBody query={query} columns={["when", "admin", "action", "target", "reason"]}>
        {(row) => (
          <TableRow key={row._id}>
            <TableCell className="whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</TableCell>
            <TableCell>{row.actorEmail}</TableCell>
            <TableCell>
              <code className="text-caption">{row.action}</code>
            </TableCell>
            <TableCell>
              <code className="text-caption">
                {row.targetType}:{String(row.targetId).slice(-6)}
              </code>
            </TableCell>
            <TableCell className="max-w-72">{row.reason || "-"}</TableCell>
          </TableRow>
        )}
      </ListBody>
      <Pager pagination={query.data?.pagination} onPage={list.setPage} />
    </Stack>
  );
}

export default function AdminPage() {
  const { t } = useTranslation("admin");
  const overview = useAdminOverview();
  const [request, setRequest] = useState(null);

  const stats = [
    ["pendingRestaurants", overview.data?.pendingRestaurants],
    ["pendingCouriers", overview.data?.pendingCouriers],
    ["suspendedUsers", overview.data?.suspendedUsers],
    ["activeOrders", overview.data?.activeOrders],
  ];

  return (
    <PageContainer width="feed" withBottomNav={false} className="py-8">
      <Stack gap="lg">
        <header>
          <h1 className="text-h1">{t("title")}</h1>
          <p className="text-body-sm text-muted-foreground">{t("subtitle")}</p>
        </header>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map(([key, value]) => (
            <Card key={key} padded>
              <p className="text-caption text-muted-foreground">{t(`overview.${key}`)}</p>
              <p className="text-h2 tabular">{value ?? "-"}</p>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="restaurants">
          <TabsList className="flex-wrap h-auto">
            {["restaurants", "couriers", "users", "orders", "audit"].map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {t(`tabs.${tab}`)}
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="restaurants">
            <RestaurantsTab ask={setRequest} />
          </TabsContent>
          <TabsContent value="couriers">
            <CouriersTab ask={setRequest} />
          </TabsContent>
          <TabsContent value="users">
            <UsersTab ask={setRequest} />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab ask={setRequest} />
          </TabsContent>
          <TabsContent value="audit">
            <AuditTab />
          </TabsContent>
        </Tabs>
      </Stack>

      <ReasonDialog request={request} onClose={() => setRequest(null)} />
    </PageContainer>
  );
}
