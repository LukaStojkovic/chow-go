import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import * as apiCart from "@/services/apiCart";
import { useAuthStore } from "./useAuthStore";
import useCartStore from "./useCartStore";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/services/apiCart", () => ({
  addToCart: vi.fn(),
  clearCart: vi.fn(),
  getCart: vi.fn(),
  removeItemFromCart: vi.fn(),
  updateCartItemQuantity: vi.fn(),
}));

const cart = (items = [{ menuItem: "m1", quantity: 1 }], totalPrice = 10, restaurant = { _id: "r1" }) => ({
  data: { items, totalPrice, restaurant },
});

const customer = { _id: "u1", role: "customer" };
const EMPTY = { items: [], totalPrice: 0, restaurant: null, isLoading: false, pendingConflict: null };

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.setState(EMPTY);
  useAuthStore.setState({ authUser: customer, isAuthOpen: false });
});

describe("addItem", () => {
  it("asks a signed-out visitor to log in instead of calling the API", async () => {
    useAuthStore.setState({ authUser: null });
    await expect(useCartStore.getState().addItem("m1")).resolves.toBe(false);
    expect(apiCart.addToCart).not.toHaveBeenCalled();
    expect(useAuthStore.getState()).toMatchObject({ isAuthOpen: true, isLoginModal: true });
  });

  it("replaces local state with the server's cart", async () => {
    apiCart.addToCart.mockResolvedValue(cart());
    await expect(useCartStore.getState().addItem("m1", 2, "no onions")).resolves.toBe(true);
    expect(apiCart.addToCart).toHaveBeenCalledWith("m1", 2, "no onions", []);
    expect(useCartStore.getState()).toMatchObject({ totalPrice: 10, restaurant: { _id: "r1" } });
  });

  it("passes the picked option ids through", async () => {
    apiCart.addToCart.mockResolvedValue(cart());
    await useCartStore.getState().addItem("m1", 1, undefined, ["o1", "o2"]);
    expect(apiCart.addToCart).toHaveBeenCalledWith("m1", 1, undefined, ["o1", "o2"]);
  });

  it("turns the one-restaurant refusal into a pending conflict, not a toast", async () => {
    apiCart.addToCart.mockRejectedValue(
      new Error("You can only add items from one restaurant. Clear cart first."),
    );
    await expect(useCartStore.getState().addItem("m2", 1, undefined, ["o1"])).resolves.toBe(false);
    expect(useCartStore.getState().pendingConflict).toEqual({
      menuItemId: "m2",
      quantity: 1,
      specialInstructions: undefined,
      options: ["o1"],
    });
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("toasts any other failure", async () => {
    apiCart.addToCart.mockRejectedValue(new Error("Dish unavailable"));
    await expect(useCartStore.getState().addItem("m1")).resolves.toBe(false);
    expect(toast.error).toHaveBeenCalledWith("Dish unavailable");
  });
});

describe("conflict resolution", () => {
  it("clears the basket and retries the add", async () => {
    useCartStore.setState({
      ...cart().data,
      pendingConflict: { menuItemId: "m2", quantity: 3, options: ["o9"] },
    });
    apiCart.clearCart.mockResolvedValue({});
    apiCart.addToCart.mockResolvedValue(cart([{ menuItem: "m2", quantity: 3 }], 30, { _id: "r2" }));

    await expect(useCartStore.getState().resolveConflictByReplacing()).resolves.toBe(true);
    expect(apiCart.clearCart).toHaveBeenCalledOnce();
    expect(apiCart.addToCart).toHaveBeenCalledWith("m2", 3, undefined, ["o9"]);
    expect(useCartStore.getState()).toMatchObject({ pendingConflict: null, restaurant: { _id: "r2" } });
  });

  it("does nothing without a conflict, and can be dismissed", async () => {
    await expect(useCartStore.getState().resolveConflictByReplacing()).resolves.toBe(false);
    useCartStore.setState({ pendingConflict: { menuItemId: "m2" } });
    useCartStore.getState().dismissConflict();
    expect(useCartStore.getState().pendingConflict).toBeNull();
  });
});

describe("updateItemQuantity / removeItem", () => {
  it("applies the server's answer", async () => {
    apiCart.updateCartItemQuantity.mockResolvedValue(cart([{ menuItem: "m1", quantity: 4 }], 40));
    await useCartStore.getState().updateItemQuantity("m1", 4);
    expect(useCartStore.getState().totalPrice).toBe(40);

    apiCart.removeItemFromCart.mockResolvedValue(cart([], 0));
    await useCartStore.getState().removeItem("m1");
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("addresses a line by its line id", async () => {
    apiCart.updateCartItemQuantity.mockResolvedValue(cart());
    apiCart.removeItemFromCart.mockResolvedValue(cart([], 0));
    await useCartStore.getState().updateItemQuantity("m1~o1-o2", 2);
    await useCartStore.getState().removeItem("m1~o1-o2");
    expect(apiCart.updateCartItemQuantity).toHaveBeenCalledWith("m1~o1-o2", 2, undefined);
    expect(apiCart.removeItemFromCart).toHaveBeenCalledWith("m1~o1-o2");
  });

  it("toasts, resyncs from the server and rethrows on failure", async () => {
    apiCart.getCart.mockResolvedValue(cart());
    apiCart.updateCartItemQuantity.mockRejectedValue(new Error("Too many"));
    await expect(useCartStore.getState().updateItemQuantity("m1", 99)).rejects.toThrow("Too many");
    expect(toast.error).toHaveBeenCalledWith("Too many");
    expect(apiCart.getCart).toHaveBeenCalled();

    apiCart.removeItemFromCart.mockRejectedValue(new Error("Gone"));
    await expect(useCartStore.getState().removeItem("m1")).rejects.toThrow("Gone");
  });
});

describe("clearCart", () => {
  it("empties locally without calling the API when signed out", async () => {
    useAuthStore.setState({ authUser: null });
    useCartStore.setState(cart().data);
    await useCartStore.getState().clearCart();
    expect(apiCart.clearCart).not.toHaveBeenCalled();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("keeps the basket when the server refuses", async () => {
    useCartStore.setState(cart().data);
    apiCart.clearCart.mockRejectedValue(new Error("nope"));
    await useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(toast.error).toHaveBeenCalledWith("nope");
  });
});

describe("fetchCart", () => {
  it("only fetches for customers", async () => {
    useAuthStore.setState({ authUser: { role: "seller" } });
    useCartStore.setState(cart().data);
    await useCartStore.getState().fetchCart();
    expect(apiCart.getCart).not.toHaveBeenCalled();
    expect(useCartStore.getState().items).toEqual([]);
  });

  it("loads the server cart and resets the loading flag even on failure", async () => {
    apiCart.getCart.mockResolvedValue(cart());
    await useCartStore.getState().fetchCart();
    expect(useCartStore.getState()).toMatchObject({ totalPrice: 10, isLoading: false });

    apiCart.getCart.mockRejectedValue(new Error("offline"));
    await useCartStore.getState().fetchCart();
    expect(useCartStore.getState()).toMatchObject({ totalPrice: 10, isLoading: false });
    expect(toast.error).not.toHaveBeenCalled();
  });
});
