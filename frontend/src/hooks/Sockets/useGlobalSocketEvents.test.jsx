import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { useSocket } from "@/contexts/SocketContext";
import { useAuthStore } from "@/store/useAuthStore";
import { createFakeSocket, createTestQueryClient, createWrapper } from "@/test/utils";
import { askForNotifications, useGlobalSocketEvents } from "./useGlobalSocketEvents";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() } }));
vi.mock("@/contexts/SocketContext", () => ({ useSocket: vi.fn() }));

const CUSTOMER_EVENTS = [
  "order:confirmed",
  "order:rejected",
  "order:preparing",
  "order:ready",
  "order:cancelled",
  "order:assigned",
  "order:picked_up",
  "order:in_transit",
  "order:delivered",
];
const SELLER_EVENTS = [
  "order:new",
  "order:cancelled",
  "order:assigned",
  "order:picked_up",
  "order:in_transit",
  "order:delivered",
  "order:courier_unassigned",
];
const COURIER_EVENTS = [
  "order:assigned",
  "order:picked_up",
  "order:in_transit",
  "order:delivered",
  "order:courier_unassigned",
  "order:available",
  "order:taken",
];

const users = {
  customer: { _id: "u1", role: "customer" },
  seller: { _id: "u2", role: "seller", restaurant: [{ _id: "r1" }] },
  courier: { _id: "u3", role: "courier" },
};

let socket;
let register;
let queryClient;
let invalidate;
let checkAuth;
let NotificationMock;

function setup(role, { epoch = 1, connected = true } = {}) {
  useAuthStore.setState({ authUser: users[role], checkAuth });
  vi.mocked(useSocket).mockReturnValue({ socket, isConnected: connected, connectionEpoch: epoch, register });
  return renderHook(() => useGlobalSocketEvents(), { wrapper: createWrapper(queryClient) });
}

const invalidatedKeys = () => invalidate.mock.calls.map(([arg]) => arg.queryKey[0]);
const order = { _id: "o1", orderNumber: 1042, total: 1400, status: "confirmed" };

beforeEach(() => {
  vi.clearAllMocks();
  socket = createFakeSocket();
  register = vi.fn();
  checkAuth = vi.fn();
  queryClient = createTestQueryClient();
  invalidate = vi.spyOn(queryClient, "invalidateQueries");
  NotificationMock = vi.fn();
  NotificationMock.permission = "default";
  NotificationMock.requestPermission = vi.fn(() => Promise.resolve("granted"));
  vi.stubGlobal("Notification", NotificationMock);
  vi.stubGlobal(
    "Audio",
    vi.fn(function Audio() {
      this.play = vi.fn(() => Promise.resolve());
    }),
  );
});

describe("room registration", () => {
  it("registers each role with the server once connected", () => {
    setup("customer");
    expect(register).toHaveBeenLastCalledWith({ role: "customer" });
    setup("seller");
    expect(register).toHaveBeenLastCalledWith({ role: "seller", restaurantId: "r1" });
    setup("courier");
    expect(register).toHaveBeenLastCalledWith({ role: "courier" });
  });

  it("does not register a seller without a restaurant, or before connecting", () => {
    useAuthStore.setState({ authUser: { role: "seller", restaurant: [] } });
    vi.mocked(useSocket).mockReturnValue({ socket, isConnected: true, connectionEpoch: 1, register });
    renderHook(() => useGlobalSocketEvents(), { wrapper: createWrapper(queryClient) });
    setup("customer", { connected: false });
    expect(register).not.toHaveBeenCalled();
  });
});

describe("listeners per role", () => {
  it.each([
    ["customer", CUSTOMER_EVENTS],
    ["seller", SELLER_EVENTS],
    ["courier", COURIER_EVENTS],
  ])("%s listens to exactly its events and removes them on unmount", (role, events) => {
    const { unmount } = setup(role);
    expect([...socket.handlers.keys()].sort()).toEqual([...events].sort());
    unmount();
    expect([...socket.handlers.values()].every((set) => set.size === 0) || socket.handlers.size === 0).toBe(true);
  });

  it("does not stack listeners when the language changes", async () => {
    setup("customer");
    const { changeLanguage } = await import("@chowgo/shared/i18n");
    await act(() => changeLanguage("sr"));
    expect(socket.listenerCount("order:confirmed")).toBe(1);
  });
});

describe("customer events", () => {
  it("toasts and refreshes order caches when an order is confirmed", () => {
    setup("customer");
    act(() => socket.emit("order:confirmed", { order }));
    expect(toast.success).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ duration: 5000 }));
    expect(invalidatedKeys()).toEqual(expect.arrayContaining(["order", "customerOrders"]));
  });

  it("writes the updated order straight into an open order's cache", () => {
    queryClient.setQueryData(["order", "o1"], { data: { order: { _id: "o1", status: "ready" } }, success: true });
    queryClient.setQueryData(["order", "o2"], { data: { order: { _id: "o2", status: "ready" } } });
    setup("customer");

    act(() => socket.emit("order:picked_up", { order: { ...order, status: "picked_up" } }));
    expect(queryClient.getQueryData(["order", "o1"])).toEqual({
      data: { order: { ...order, status: "picked_up" } },
      success: true,
    });
    expect(queryClient.getQueryData(["order", "o2"]).data.order.status).toBe("ready");
    expect(invalidatedKeys()).toEqual(["customerOrders"]);
  });

  it("does not create a cache entry for an order nobody is viewing", () => {
    setup("customer");
    act(() => socket.emit("order:delivered", { order }));
    expect(queryClient.getQueryData(["order", "o1"])).toBeUndefined();
    act(() => socket.emit("order:in_transit", { order: null }));
    expect(invalidatedKeys()).toEqual(["customerOrders"]);
  });

  it("shows the reason for a rejection or cancellation", () => {
    setup("customer");
    act(() => socket.emit("order:rejected", { order, reason: "Kitchen closed" }));
    act(() => socket.emit("order:cancelled", { order, reason: "Out of stock" }));
    expect(toast.error).toHaveBeenNthCalledWith(1, expect.any(String), expect.objectContaining({ description: "Kitchen closed" }));
    expect(toast.error).toHaveBeenNthCalledWith(2, expect.any(String), expect.objectContaining({ description: "Out of stock" }));
  });

  it("shows a system notification only when permission was granted", () => {
    setup("customer");
    act(() => socket.emit("order:ready", { order }));
    expect(NotificationMock).not.toHaveBeenCalled();

    NotificationMock.permission = "granted";
    act(() => socket.emit("order:preparing", { order }));
    expect(NotificationMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ icon: expect.any(String) }));
  });

  it("still refreshes when the browser refuses to construct a Notification", () => {
    NotificationMock.permission = "granted";
    NotificationMock.mockImplementation(() => {
      throw new TypeError("Illegal constructor");
    });
    setup("customer");
    act(() => socket.emit("order:confirmed", { order }));
    expect(invalidatedKeys()).toContain("customerOrders");
  });

  it("works where Notification does not exist at all", () => {
    vi.stubGlobal("Notification", undefined);
    setup("customer");
    act(() => socket.emit("order:cancelled", { order }));
    expect(invalidatedKeys()).toContain("customerOrders");
  });
});

describe("seller events", () => {
  it("plays a sound, toasts the total and refreshes on a new order", () => {
    setup("seller");
    act(() => socket.emit("order:new", { order }));
    expect(Audio).toHaveBeenCalledWith("/sounds/new-order.mp3");
    expect(toast.success).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ description: expect.stringContaining("1042") }),
    );
    expect(invalidatedKeys()).toEqual(["restaurantOrders"]);
  });

  it.each(["order:cancelled", "order:assigned", "order:picked_up", "order:in_transit", "order:delivered", "order:courier_unassigned"])(
    "refreshes restaurant orders on %s",
    (event) => {
      setup("seller");
      act(() => socket.emit(event, { order }));
      expect(invalidatedKeys()).toEqual(["restaurantOrders"]);
    },
  );

  it("asks sellers and couriers for notification permission, not customers", () => {
    setup("customer").unmount();
    expect(NotificationMock.requestPermission).not.toHaveBeenCalled();
    setup("seller");
    expect(NotificationMock.requestPermission).toHaveBeenCalledOnce();
  });
});

describe("courier events", () => {
  it("refreshes own orders, the pool and the profile when assigned or unassigned", () => {
    setup("courier");
    act(() => socket.emit("order:assigned", { order }));
    expect(invalidatedKeys()).toEqual(["courierOrders", "courierOrder", "courierAvailableOrders"]);
    expect(checkAuth).toHaveBeenCalledOnce();

    invalidate.mockClear();
    act(() => socket.emit("order:courier_unassigned", { order }));
    expect(checkAuth).toHaveBeenCalledTimes(2);
  });

  it("refreshes only own orders on progress updates", () => {
    setup("courier");
    act(() => socket.emit("order:picked_up", { order }));
    expect(invalidatedKeys()).toEqual(["courierOrders", "courierOrder"]);
    expect(checkAuth).not.toHaveBeenCalled();
  });

  it("refreshes the pool when an order appears or is taken", () => {
    setup("courier");
    act(() => socket.emit("order:available", {}));
    act(() => socket.emit("order:taken", {}));
    expect(invalidatedKeys()).toEqual(["courierAvailableOrders", "courierAvailableOrders"]);
  });
});

describe("reconnect", () => {
  it.each([
    ["customer", ["order", "customerOrders"]],
    ["seller", ["restaurantOrders"]],
    ["courier", ["courierAvailableOrders", "courierOrders", "courierOrder"]],
  ])("refetches what a %s may have missed while disconnected", (role, keys) => {
    setup(role, { epoch: 2 });
    expect(invalidatedKeys()).toEqual(keys);
  });

  it("does not refetch on the first connection", () => {
    setup("customer", { epoch: 1 });
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe("askForNotifications", () => {
  it("only asks while the browser has not decided", () => {
    askForNotifications();
    expect(NotificationMock.requestPermission).toHaveBeenCalledOnce();
    NotificationMock.permission = "denied";
    askForNotifications();
    expect(NotificationMock.requestPermission).toHaveBeenCalledOnce();
  });
});
