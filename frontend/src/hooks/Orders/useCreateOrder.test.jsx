import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { createOrder } from "@/services/apiOrder";
import useCartStore from "@/store/useCartStore";
import { axiosError, createTestQueryClient, createWrapper } from "@/test/utils";
import { useCreateOrder } from "./useCreateOrder";

const navigate = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/services/apiOrder", () => ({ createOrder: vi.fn() }));
vi.mock("@/hooks/Sockets/useGlobalSocketEvents", () => ({ askForNotifications: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}));

const KEY = "chowgo:checkout-key:r1";
const orderData = { restaurantId: "r1", deliveryAddressId: "a1", paymentMethod: "cash" };

let queryClient;

function renderCreateOrder() {
  return renderHook(() => useCreateOrder(), { wrapper: createWrapper(queryClient) });
}

beforeEach(() => {
  vi.clearAllMocks();
  queryClient = createTestQueryClient();
  useCartStore.setState({ items: [{ menuItem: "m1" }], totalPrice: 10, restaurant: { _id: "r1" }, fetchCart: vi.fn() });
});

describe("useCreateOrder", () => {
  it("sends an idempotency key and lands on the confirmation screen", async () => {
    createOrder.mockResolvedValue({ data: { order: { _id: "o1" } } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderCreateOrder();

    act(() => result.current.createOrder(orderData));

    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/orders/o1/confirmed", { replace: true }));
    const sent = createOrder.mock.calls[0][0];
    expect(sent).toMatchObject(orderData);
    expect(sent.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(sessionStorage.getItem(KEY)).toBeNull();
    expect(useCartStore.getState()).toMatchObject({ items: [], totalPrice: 0, restaurant: null });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["customerOrders"] });
  });

  it("reuses the same key across retries until an order lands", async () => {
    createOrder.mockRejectedValueOnce(new Error("timeout")).mockRejectedValueOnce(new Error("timeout"));
    const { result } = renderCreateOrder();

    act(() => result.current.createOrder(orderData));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    act(() => result.current.createOrder(orderData));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(2));

    const [first, second] = createOrder.mock.calls.map(([arg]) => arg.idempotencyKey);
    expect(first).toBe(second);
    expect(sessionStorage.getItem(KEY)).toBe(first);
  });

  it("keeps a separate key per restaurant", async () => {
    createOrder.mockRejectedValue(new Error("timeout"));
    const { result } = renderCreateOrder();
    act(() => result.current.createOrder(orderData));
    act(() => result.current.createOrder({ ...orderData, restaurantId: "r2" }));
    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(2));
    const [a, b] = createOrder.mock.calls.map(([arg]) => arg.idempotencyKey);
    expect(a).not.toBe(b);
  });

  it("falls back to order history when the response has no order id", async () => {
    createOrder.mockResolvedValue({ data: {} });
    const { result } = renderCreateOrder();
    act(() => result.current.createOrder(orderData));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/orders", { replace: true }));
    expect(toast.success).toHaveBeenCalled();
  });

  it.each(["PRICE_CHANGED", "ITEM_UNAVAILABLE"])("refetches the basket on %s", async (code) => {
    createOrder.mockRejectedValue(axiosError(409, { code, message: "Prices changed" }));
    const { result } = renderCreateOrder();
    act(() => result.current.createOrder(orderData));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Prices changed"));
    expect(useCartStore.getState().fetchCart).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("does not refetch the basket for other failures", async () => {
    createOrder.mockRejectedValue(axiosError(400, { code: "ADDRESS_TOO_FAR" }));
    const { result } = renderCreateOrder();
    act(() => result.current.createOrder(orderData));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(useCartStore.getState().fetchCart).not.toHaveBeenCalled();
  });

  it("still sends a key when sessionStorage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    createOrder.mockResolvedValue({ data: { order: { _id: "o1" } } });
    const { result } = renderCreateOrder();
    act(() => result.current.createOrder(orderData));
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(createOrder.mock.calls[0][0].idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
  });
});
