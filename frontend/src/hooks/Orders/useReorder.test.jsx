import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { addToCart } from "@/services/apiCart";
import useCartStore from "@/store/useCartStore";
import { createWrapper } from "@/test/utils";
import { useReorder } from "./useReorder";

const navigate = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock("@/services/apiCart", () => ({ addToCart: vi.fn() }));
vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}));

const fetchCart = vi.fn();
const clearCart = vi.fn();

const pastOrder = {
  _id: "o1",
  restaurant: { _id: "r1" },
  items: [
    {
      menuItem: { _id: "m1" },
      quantity: 2,
      options: [{ groupId: "g1", optionId: "o-large", name: "Large", priceDelta: 2 }],
    },
    { menuItem: "m2" },
    { menuItem: null, quantity: 1 },
  ],
};

function renderReorder() {
  return renderHook(() => useReorder(), { wrapper: createWrapper() });
}

beforeEach(() => {
  vi.clearAllMocks();
  useCartStore.setState({ items: [], restaurant: null, fetchCart, clearCart });
});

describe("useReorder", () => {
  it("adds every line sequentially, then opens checkout", async () => {
    addToCart.mockResolvedValue({});
    const { result } = renderReorder();

    await act(() => result.current.reorder(pastOrder));

    expect(addToCart.mock.calls).toEqual([
      ["m1", 2, undefined, ["o-large"]],
      ["m2", 1, undefined, []],
    ]);
    expect(fetchCart).toHaveBeenCalledOnce();
    expect(toast.success).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/checkout");
    expect(result.current.isReordering).toBe(false);
  });

  it("reports dishes that are no longer available", async () => {
    addToCart.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("unavailable"));
    const { result } = renderReorder();
    await act(() => result.current.reorder(pastOrder));
    expect(toast.warning).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/checkout");
  });

  it("counts a refused option as a dish that could not be re-added", async () => {
    addToCart
      .mockRejectedValueOnce(Object.assign(new Error("Large is sold out"), { code: "OPTION_UNAVAILABLE" }))
      .mockResolvedValueOnce({});
    const { result } = renderReorder();
    await act(() => result.current.reorder(pastOrder));
    expect(toast.warning).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith("/checkout");
  });

  it("stays put when nothing could be added", async () => {
    addToCart.mockRejectedValue(new Error("unavailable"));
    const { result } = renderReorder();
    await act(() => result.current.reorder(pastOrder));
    expect(toast.error).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("adds to a basket from the same restaurant without asking", async () => {
    addToCart.mockResolvedValue({});
    useCartStore.setState({ items: [{ menuItem: "x" }], restaurant: { _id: "r1" } });
    const { result } = renderReorder();
    await act(() => result.current.reorder({ ...pastOrder, restaurant: "r1" }));
    expect(result.current.conflict).toBeNull();
    expect(addToCart).toHaveBeenCalled();
  });

  it("asks before replacing a basket from another restaurant", async () => {
    addToCart.mockResolvedValue({});
    useCartStore.setState({ items: [{ menuItem: "x" }], restaurant: { _id: "r9", name: "Grill" } });
    const { result } = renderReorder();

    act(() => result.current.reorder(pastOrder));
    expect(result.current.conflict).toEqual({ order: pastOrder, currentRestaurantName: "Grill" });
    expect(addToCart).not.toHaveBeenCalled();

    await act(() => result.current.confirmReplace());
    expect(clearCart).toHaveBeenCalledOnce();
    expect(addToCart).toHaveBeenCalledTimes(2);
    expect(result.current.conflict).toBeNull();
  });

  it("can cancel the replacement", () => {
    useCartStore.setState({ items: [{ menuItem: "x" }], restaurant: { _id: "r9" } });
    const { result } = renderReorder();
    act(() => result.current.reorder(pastOrder));
    act(() => result.current.cancelReplace());
    expect(result.current.conflict).toBeNull();
    expect(clearCart).not.toHaveBeenCalled();
  });
});
