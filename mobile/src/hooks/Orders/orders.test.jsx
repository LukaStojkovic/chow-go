import { act, renderHook, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

import { addToCart } from "@/services/apiCart";
import { cancelOrder, createOrder } from "@/services/apiOrder";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { axiosError, createTestQueryClient, createWrapper } from "@/test/utils";
import { useCancelOrder, useCreateOrder } from "./useOrders";
import { useReorder } from "./useReorder";

jest.mock("@/services/apiOrder");
jest.mock("@/services/apiCart");
jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));

const KEY = "chowgo:checkout-key:r1";
const payload = { restaurantId: "r1", deliveryAddressId: "a1", paymentMethod: "cash" };

let queryClient;

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = createTestQueryClient();
  useToastStore.setState({ toasts: [] });
});

// reorder() starts the add sequence without returning it; let it finish inside act.
const reorderAndSettle = (result, order) =>
  act(async () => {
    result.current.reorder(order);
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const render = (hook) => renderHook(hook, { wrapper: createWrapper(queryClient) });

describe("useCreateOrder", () => {
  it("sends one idempotency key per attempt and forgets it on success", async () => {
    createOrder.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce({ _id: "o1" });
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = await render(() => useCreateOrder());

    await act(async () => {
      await result.current.mutateAsync(payload).catch(() => {});
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    const firstKey = createOrder.mock.calls[0][0].idempotencyKey;
    await expect(AsyncStorage.getItem(KEY)).resolves.toBe(firstKey);

    await act(async () => {
      await result.current.mutateAsync(payload);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createOrder.mock.calls[1][0].idempotencyKey).toBe(firstKey);
    await waitFor(async () => expect(await AsyncStorage.getItem(KEY)).toBeNull());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["customerOrders"] });
  });

  it("still sends a key when storage fails", async () => {
    jest.spyOn(AsyncStorage, "getItem").mockRejectedValueOnce(new Error("io"));
    createOrder.mockResolvedValue({ _id: "o1" });
    const { result } = await render(() => useCreateOrder());
    await act(async () => {
      await result.current.mutateAsync(payload);
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createOrder.mock.calls[0][0].idempotencyKey).toBeTruthy();
  });
});

describe("useCancelOrder", () => {
  it("cancels with a reason and refreshes the order and history", async () => {
    cancelOrder.mockResolvedValue({});
    const invalidate = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = await render(() => useCancelOrder("o1"));
    await act(async () => {
      await result.current.mutateAsync("Changed my mind");
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(cancelOrder).toHaveBeenCalledWith("o1", "Changed my mind");
    expect(invalidate.mock.calls.map(([arg]) => arg.queryKey)).toEqual([["order", "o1"], ["customerOrders"]]);
  });
});

describe("useReorder", () => {
  const fetchCart = jest.fn();
  const clearCart = jest.fn();
  const pastOrder = {
    _id: "o1",
    restaurant: "r1",
    items: [
      {
        menuItem: { _id: "m1", name: "Pizza" },
        name: "Pizza",
        quantity: 2,
        options: [{ groupId: "g1", groupName: "Size", optionId: "o1", name: "Large", priceDelta: 2 }],
      },
      { menuItem: "m2", name: "Cola" },
      { menuItem: null },
    ],
  };

  beforeEach(() => {
    useCartStore.setState({ items: [], restaurant: null, fetchCart, clearCart });
  });

  it("adds lines in order and opens checkout", async () => {
    addToCart.mockResolvedValue({});
    const { result } = await render(() => useReorder());
    await reorderAndSettle(result, pastOrder);
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/(customer)/checkout"));
    expect(addToCart.mock.calls).toEqual([
      ["m1", 2, undefined, ["o1"]],
      ["m2", 1, undefined, []],
    ]);
    expect(fetchCart).toHaveBeenCalled();
  });

  it("names the dishes it could not add", async () => {
    addToCart
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(axiosError(400, { code: "OPTION_UNAVAILABLE", message: "Option sold out" }));
    const { result } = await render(() => useReorder());
    await reorderAndSettle(result, pastOrder);
    await waitFor(() => expect(useToastStore.getState().toasts).toHaveLength(1));
    expect(useToastStore.getState().toasts[0]).toMatchObject({
      tone: "warning",
      description: expect.stringContaining("Cola"),
    });
  });

  it("stays put when nothing could be added", async () => {
    addToCart.mockRejectedValue(new Error("gone"));
    const { result } = await render(() => useReorder());
    await reorderAndSettle(result, pastOrder);
    await waitFor(() => expect(useToastStore.getState().toasts[0]?.tone).toBe("error"));
    expect(router.push).not.toHaveBeenCalled();
  });

  it("confirms before replacing another restaurant's basket", async () => {
    addToCart.mockResolvedValue({});
    useCartStore.setState({ items: [{ menuItem: "x" }], restaurant: { _id: "r9", name: "Grill" } });
    const { result } = await render(() => useReorder());

    await act(() => result.current.reorder(pastOrder));
    expect(result.current.conflict).toEqual({ order: pastOrder, currentRestaurantName: "Grill" });
    expect(addToCart).not.toHaveBeenCalled();

    await act(() => result.current.confirmReplace());
    expect(clearCart).toHaveBeenCalled();
    expect(addToCart).toHaveBeenCalledTimes(2);

    await act(() => result.current.cancelReplace());
    expect(result.current.conflict).toBeNull();
  });
});
