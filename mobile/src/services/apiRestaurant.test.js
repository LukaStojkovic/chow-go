import { api } from "@/api/client";
import * as uploads from "@/api/uploads";
import { updateRestaurant } from "./apiRestaurant";

beforeEach(() => {
  jest.restoreAllMocks();
  jest.spyOn(api, "put").mockResolvedValue({ data: {} });
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
