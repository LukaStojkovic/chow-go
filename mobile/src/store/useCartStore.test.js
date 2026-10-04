import * as apiCart from "@/services/apiCart";
import { axiosError } from "@/test/utils";
import { useAuthStore } from "./useAuthStore";
import { useCartStore } from "./useCartStore";
import { useToastStore } from "./useToastStore";

jest.mock("@/services/apiCart");

const cart = (items, restaurant, totalPrice = 10) => ({ data: { items, totalPrice, restaurant } });
const line = (id) => ({ menuItem: id, quantity: 1 });
const toasts = () => useToastStore.getState().toasts;

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ authUser: { _id: "u1", role: "customer" } });
  useCartStore.setState({ items: [], totalPrice: 0, restaurant: null, isLoading: false, pendingConflict: null });
  useToastStore.setState({ toasts: [] });
});

describe("restaurant reconciliation", () => {
  it("keeps a bare restaurant id rather than dropping it", async () => {
    apiCart.addToCart.mockResolvedValue(cart([line("m1")], "r1"));
    await useCartStore.getState().addItem("m1");
    expect(useCartStore.getState().restaurant).toEqual({ _id: "r1" });
  });

  it("keeps the populated restaurant when a later response sends only its id", async () => {
    apiCart.addToCart.mockResolvedValueOnce(cart([line("m1")], { _id: "r1", name: "Grill" }));
    apiCart.addToCart.mockResolvedValueOnce(cart([line("m1"), line("m2")], "r1"));
    await useCartStore.getState().addItem("m1");
    await useCartStore.getState().addItem("m2");
    expect(useCartStore.getState().restaurant).toEqual({ _id: "r1", name: "Grill" });
  });

  it("replaces the restaurant when the id changes, and clears it when the basket empties", async () => {
    useCartStore.setState({ restaurant: { _id: "r1", name: "Grill" } });
    apiCart.addToCart.mockResolvedValueOnce(cart([line("m9")], "r2"));
    await useCartStore.getState().addItem("m9");
    expect(useCartStore.getState().restaurant).toEqual({ _id: "r2" });

    apiCart.removeItemFromCart.mockResolvedValueOnce(cart([], null, 0));
    await useCartStore.getState().removeItem("m9");
    expect(useCartStore.getState().restaurant).toBeNull();
  });

  it("accepts an unwrapped cart payload", async () => {
    apiCart.getCart.mockResolvedValue({ items: [line("m1")], totalPrice: 7, restaurant: { _id: "r1" } });
    await useCartStore.getState().fetchCart();
    expect(useCartStore.getState()).toMatchObject({ totalPrice: 7, isLoading: false });
  });
});

describe("addItem", () => {
  it("reports unauthenticated without calling the API", async () => {
    useAuthStore.setState({ authUser: null });
    await expect(useCartStore.getState().addItem("m1")).resolves.toEqual({ status: "unauthenticated" });
    expect(apiCart.addToCart).not.toHaveBeenCalled();
  });

  it("turns the one-restaurant refusal into a conflict", async () => {
    apiCart.addToCart.mockRejectedValue(
      axiosError(400, { message: "You can only add items from one restaurant. Clear cart first." }),
    );
    await expect(useCartStore.getState().addItem("m2", 2, "extra")).resolves.toEqual({ status: "conflict" });
    expect(useCartStore.getState().pendingConflict).toEqual({ menuItemId: "m2", quantity: 2, specialInstructions: "extra" });
    expect(toasts()).toHaveLength(0);
  });

  it("toasts other failures", async () => {
    apiCart.addToCart.mockRejectedValue(axiosError(400, { message: "Dish unavailable" }));
    await expect(useCartStore.getState().addItem("m1")).resolves.toEqual({ status: "error" });
    expect(toasts()[0]).toMatchObject({ tone: "error", description: "Dish unavailable" });
  });
});

describe("conflict resolution", () => {
  it("clears the basket and retries", async () => {
    useCartStore.setState({ pendingConflict: { menuItemId: "m2", quantity: 1 } });
    apiCart.clearCart.mockResolvedValue({});
    apiCart.addToCart.mockResolvedValue(cart([line("m2")], { _id: "r2" }));
    await expect(useCartStore.getState().resolveConflictByReplacing()).resolves.toBe(true);
    expect(useCartStore.getState()).toMatchObject({ pendingConflict: null, restaurant: { _id: "r2" } });
  });

  it("reports a failed replacement", async () => {
    useCartStore.setState({ pendingConflict: { menuItemId: "m2", quantity: 1 } });
    apiCart.clearCart.mockRejectedValue(new Error("offline"));
    await expect(useCartStore.getState().resolveConflictByReplacing()).resolves.toBe(false);
    expect(toasts()[0].tone).toBe("error");
  });

  it("does nothing without a conflict and can be dismissed", async () => {
    await expect(useCartStore.getState().resolveConflictByReplacing()).resolves.toBe(false);
    useCartStore.setState({ pendingConflict: { menuItemId: "m2" } });
    useCartStore.getState().dismissConflict();
    expect(useCartStore.getState().pendingConflict).toBeNull();
  });
});

describe("quantities and clearing", () => {
  it("removes a line when its quantity drops to zero", async () => {
    apiCart.removeItemFromCart.mockResolvedValue(cart([], null, 0));
    await useCartStore.getState().updateItemQuantity("m1", 0);
    expect(apiCart.removeItemFromCart).toHaveBeenCalledWith("m1");
    expect(apiCart.updateCartItemQuantity).not.toHaveBeenCalled();
  });

  it("toasts a failed update or removal without throwing", async () => {
    apiCart.updateCartItemQuantity.mockRejectedValue(new Error("x"));
    apiCart.removeItemFromCart.mockRejectedValue(new Error("y"));
    await useCartStore.getState().updateItemQuantity("m1", 3);
    await useCartStore.getState().removeItem("m1");
    expect(toasts().map((toast) => toast.tone)).toEqual(["error", "error"]);
  });

  it("empties locally even when the server clear fails", async () => {
    useCartStore.setState(cart([line("m1")], { _id: "r1" }).data);
    apiCart.clearCart.mockRejectedValue(new Error("offline"));
    await expect(useCartStore.getState().clearCart()).rejects.toThrow("offline");
    expect(useCartStore.getState()).toMatchObject({ items: [], restaurant: null });
  });

  it("skips fetching when signed out and swallows a failed fetch", async () => {
    useAuthStore.setState({ authUser: null });
    await useCartStore.getState().fetchCart();
    expect(apiCart.getCart).not.toHaveBeenCalled();

    useAuthStore.setState({ authUser: { _id: "u1" } });
    apiCart.getCart.mockRejectedValue(new Error("offline"));
    await useCartStore.getState().fetchCart();
    expect(useCartStore.getState().isLoading).toBe(false);
  });

  it("clears local state including any conflict", () => {
    useCartStore.setState({ ...cart([line("m1")], { _id: "r1" }).data, pendingConflict: { menuItemId: "m2" } });
    useCartStore.getState().clearLocalCart();
    expect(useCartStore.getState()).toMatchObject({ items: [], totalPrice: 0, restaurant: null, pendingConflict: null });
  });
});
