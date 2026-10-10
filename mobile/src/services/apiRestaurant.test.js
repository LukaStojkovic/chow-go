import { api } from "@/api/client";
import * as uploads from "@/api/uploads";
import { createMenuItem, getMenuLayout, saveMenuLayout, updateMenuItem, updateRestaurant } from "./apiRestaurant";

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(api, "put").mockResolvedValue({ data: {} });
  jest.spyOn(api, "post").mockResolvedValue({ data: {} });
  jest.spyOn(api, "get").mockResolvedValue({ data: {} });
  jest.spyOn(uploads, "toFormData");
});

const sentFields = () => uploads.toFormData.mock.calls[0][0];

it("sends a moved pin as location[lat] and location[lng]", async () => {
  await updateRestaurant({ location: { lat: 44.8125, lng: 20.4612 } });
  expect(sentFields()).toMatchObject({ "location[lat]": "44.8125", "location[lng]": "20.4612" });
  expect(api.put.mock.calls[0][0]).toBe("/restaurants/update");
});

it("leaves the pin out of an ordinary settings save", async () => {
  await updateRestaurant({ name: "R", address: { street: "New 2", city: "Novi Sad", zipCode: "21000" } });
  const fields = sentFields();
  expect(fields).toMatchObject({ "address[street]": "New 2", "address[city]": "Novi Sad", "address[zipCode]": "21000" });
  expect(Object.keys(fields).some((key) => key.startsWith("location"))).toBe(false);
});

const dish = { name: "Burek", category: "Breakfast", price: 300, available: true, images: [] };

it("reads the seller menu layout from the singular seller route", async () => {
  const layout = { sections: [], unsectioned: [] };
  api.get.mockResolvedValue({ data: { status: "success", data: layout } });
  await expect(getMenuLayout()).resolves.toBe(layout);
  expect(api.get).toHaveBeenCalledWith("/restaurant/menu-layout");
});

it("replaces the layout with ids only for existing sections", async () => {
  api.put.mockResolvedValue({ data: { data: { sections: [], unsectioned: [] } } });
  await saveMenuLayout([
    { _id: "s1", name: "Breakfast", itemIds: ["m2", "m1"] },
    { name: "Drinks", itemIds: [] },
  ]);
  expect(api.put).toHaveBeenCalledWith("/restaurant/menu-layout", {
    sections: [
      { _id: "s1", name: "Breakfast", itemIds: ["m2", "m1"] },
      { name: "Drinks", itemIds: [] },
    ],
  });
});

it("sends a chosen section, an empty one to clear it, and nothing when untouched", async () => {
  await createMenuItem("r1", { ...dish, sectionId: "s1" });
  expect(sentFields()).toMatchObject({ sectionId: "s1" });

  uploads.toFormData.mockClear();
  await updateMenuItem("r1", "m1", { ...dish, sectionId: "" });
  expect(sentFields().sectionId).toBe("");
  expect(api.put.mock.calls[0][0]).toBe("/restaurants/r1/menu/m1");

  uploads.toFormData.mockClear();
  await updateMenuItem("r1", "m1", dish);
  expect("sectionId" in sentFields()).toBe(false);
});
