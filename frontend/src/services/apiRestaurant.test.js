import { beforeEach, describe, expect, it, vi } from "vitest";
import { axiosInstance } from "@/lib/axios";
import { createMenuItem, saveMenuLayout, updateMenuItem } from "./apiRestaurant";

vi.mock("@/lib/axios", () => ({
  axiosInstance: { post: vi.fn(), put: vi.fn(), get: vi.fn() },
}));

const dish = { name: "Burger", category: "burgers", price: "5", available: true };
const sentForm = (method) => axiosInstance[method].mock.calls.at(-1)[1];

describe("menu item sections in apiRestaurant", () => {
  beforeEach(() => {
    axiosInstance.post.mockResolvedValue({ data: {} });
    axiosInstance.put.mockResolvedValue({ data: { data: { sections: [], unsectioned: [] } } });
  });

  it("sends a chosen section", async () => {
    await createMenuItem("r1", { ...dish, sectionId: "s1" });
    expect(sentForm("post").get("sectionId")).toBe("s1");
  });

  it("sends an empty sectionId to clear it", async () => {
    await updateMenuItem("r1", "d1", { ...dish, sectionId: "" });
    expect(sentForm("put").has("sectionId")).toBe(true);
    expect(sentForm("put").get("sectionId")).toBe("");
  });

  it("omits sectionId when the form did not set one", async () => {
    await updateMenuItem("r1", "d1", dish);
    expect(sentForm("put").has("sectionId")).toBe(false);
  });

  it("puts the whole layout", async () => {
    const layout = { sections: [{ name: "Mains", itemIds: ["d1"] }] };
    await expect(saveMenuLayout(layout)).resolves.toEqual({ sections: [], unsectioned: [] });
    expect(axiosInstance.put).toHaveBeenCalledWith("/restaurant/menu-layout", layout);
  });
});
