import { act, renderHook } from "@testing-library/react-native";
import * as Haptics from "expo-haptics";

import { stopBackgroundTracking } from "@/location/backgroundTracking";
import { useAuthStore } from "@/store/useAuthStore";
import { useToastStore } from "@/store/useToastStore";
import { createFakeSocket, createTestQueryClient, createWrapper } from "@/test/utils";
import { useSocket } from "./SocketProvider";
import { useGlobalSocketEvents } from "./useGlobalSocketEvents";

jest.mock("./SocketProvider", () => ({ useSocket: jest.fn() }));
jest.mock("@/location/backgroundTracking", () => ({ stopBackgroundTracking: jest.fn() }));

const EVENTS = {
  customer: [
    "order:confirmed",
    "order:rejected",
    "order:preparing",
    "order:ready",
    "order:cancelled",
    "order:assigned",
    "order:picked_up",
    "order:in_transit",
    "order:delivered",
  ],
  seller: [
    "order:new",
    "order:cancelled",
    "order:assigned",
    "order:picked_up",
    "order:in_transit",
    "order:delivered",
    "order:courier_unassigned",
  ],
  courier: [
    "order:assigned",
    "order:delivered",
    "order:courier_unassigned",
    "order:cancelled",
    "order:picked_up",
    "order:in_transit",
    "order:available",
    "order:taken",
  ],
};

const users = {
  customer: { _id: "u1", role: "customer" },
  seller: { _id: "u2", role: "seller", restaurant: [{ _id: "r1" }] },
  courier: { _id: "u3", role: "courier" },
};

const order = { _id: "o1", orderNumber: 1042, status: "picked_up" };

let socket;
let register;
let queryClient;
let invalidate;
let checkAuth;

async function setup(role, { epoch = 1, connected = true } = {}) {
  useAuthStore.setState({ authUser: users[role], checkAuth });
  useSocket.mockReturnValue({ socket, isConnected: connected, connectionEpoch: epoch, register });
  return await renderHook(() => useGlobalSocketEvents(), { wrapper: createWrapper(queryClient) });
}

const keys = () => invalidate.mock.calls.map(([arg]) => arg.queryKey[0]);
const toasts = () => useToastStore.getState().toasts;

beforeEach(() => {
  jest.clearAllMocks();
  socket = createFakeSocket();
  register = jest.fn();
  checkAuth = jest.fn();
  queryClient = createTestQueryClient();
  invalidate = jest.spyOn(queryClient, "invalidateQueries");
  useToastStore.setState({ toasts: [] });
});

describe("registration", () => {
  it.each([
    ["customer", { role: "customer" }],
    ["seller", { role: "seller", restaurantId: "r1" }],
    ["courier", { role: "courier" }],
  ])("registers a %s once connected", async (role, payload) => {
    await setup(role);
    expect(register).toHaveBeenCalledWith(payload);
  });

  it("waits for the connection", async () => {
    await setup("customer", { connected: false });
    expect(register).not.toHaveBeenCalled();
  });
});

describe("listeners", () => {
  it.each(Object.entries(EVENTS))("%s listens to exactly its events and cleans up", async (role, events) => {
    const { unmount } = await setup(role);
    expect([...socket.handlers.keys()].sort()).toEqual([...events].sort());
    await unmount();
    expect(events.every((event) => socket.listenerCount(event) === 0)).toBe(true);
  });
});

describe("customer", () => {
  it("toasts, buzzes and refreshes on a status change", async () => {
    await setup("customer");
    await act(() => socket.emit("order:confirmed", { order }));
    expect(toasts()[0]).toMatchObject({ tone: "success", description: expect.stringContaining("1042") });
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success);
    expect(keys()).toEqual(["order", "customerOrders"]);
  });

  it("shows the reason and an error buzz for a rejection", async () => {
    await setup("customer");
    await act(() => socket.emit("order:rejected", { order, reason: "Kitchen closed" }));
    expect(toasts()[0]).toMatchObject({ tone: "error", description: "Kitchen closed" });
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Error);
  });

  it("writes the bare order into an open detail cache, matching getOrderById", async () => {
    queryClient.setQueryData(["order", "o1"], { _id: "o1", status: "assigned" });
    await setup("customer");
    await act(() => socket.emit("order:picked_up", { order }));
    expect(queryClient.getQueryData(["order", "o1"])).toEqual(order);
    expect(keys()).toEqual(["customerOrders"]);
  });

  it("does not seed a cache entry nobody asked for", async () => {
    await setup("customer");
    await act(() => socket.emit("order:delivered", { order }));
    expect(queryClient.getQueryData(["order", "o1"])).toBeUndefined();
  });
});

describe("seller", () => {
  it("announces a new order for longer and refreshes", async () => {
    await setup("seller");
    await act(() => socket.emit("order:new", { order }));
    expect(toasts()[0]).toMatchObject({ tone: "success", duration: 8000 });
    expect(keys()).toEqual(["restaurantOrders"]);
  });

  it.each(EVENTS.seller.slice(1))("refreshes on %s", async (event) => {
    await setup("seller");
    await act(() => socket.emit(event, { order }));
    expect(keys()).toEqual(["restaurantOrders"]);
  });
});

describe("courier", () => {
  it("refreshes orders and the profile on assignment", async () => {
    await setup("courier");
    await act(() => socket.emit("order:assigned", { order }));
    expect(keys()).toEqual(["courierOrders", "courierOrder", "courierAvailableOrders"]);
    expect(checkAuth).toHaveBeenCalledTimes(1);
    expect(stopBackgroundTracking).not.toHaveBeenCalled();
  });

  it.each(["order:delivered", "order:courier_unassigned", "order:cancelled"])(
    "stops background GPS when a delivery ends (%s)",
    async (event) => {
      await setup("courier");
      await act(() => socket.emit(event, { order }));
      expect(stopBackgroundTracking).toHaveBeenCalledTimes(1);
      expect(checkAuth).toHaveBeenCalledTimes(1);
    },
  );

  it("refreshes only the pool when orders appear or are taken", async () => {
    await setup("courier");
    await act(() => socket.emit("order:available", {}));
    await act(() => socket.emit("order:taken", {}));
    expect(keys()).toEqual(["courierAvailableOrders", "courierAvailableOrders"]);
  });
});

describe("reconnect", () => {
  it.each([
    ["customer", ["order", "customerOrders"]],
    ["seller", ["restaurantOrders"]],
    ["courier", ["courierOrders", "courierOrder", "courierAvailableOrders"]],
  ])("resyncs a %s after missing events", async (role, expected) => {
    await setup(role, { epoch: 2 });
    expect(keys()).toEqual(expected);
  });

  it("does nothing on the first connection", async () => {
    await setup("courier", { epoch: 1 });
    expect(invalidate).not.toHaveBeenCalled();
  });
});
