import { api } from "@/api/client";
import { addToCart, removeItemFromCart, updateCartItemQuantity } from "./apiCart";

beforeEach(() => {
  jest.restoreAllMocks();
  for (const method of ["post", "patch", "delete"]) {
    jest.spyOn(api, method).mockResolvedValue({ data: { data: { items: [] } } });
  }
});

it("sends option ids only when there are some", async () => {
  await addToCart("m1", 2, "no salt", ["o1", "o2"]);
  await addToCart("m2");
  expect(api.post.mock.calls[0]).toEqual([
    "/cart/items",
    { menuItemId: "m1", quantity: 2, specialInstructions: "no salt", options: ["o1", "o2"] },
  ]);
  expect(api.post.mock.calls[1][1]).not.toHaveProperty("options");
});

it("encodes line ids in the path", async () => {
  await updateCartItemQuantity("m1~o1-o2", 3);
  await removeItemFromCart("m1~o1-o2");
  expect(api.patch.mock.calls[0][0]).toBe("/cart/items/m1~o1-o2");
  expect(api.delete.mock.calls[0][0]).toBe(`/cart/items/${encodeURIComponent("m1~o1-o2")}`);
});
