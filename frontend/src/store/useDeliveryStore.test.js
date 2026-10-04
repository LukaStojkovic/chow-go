import { describe, expect, it } from "vitest";

import { useDeliveryStore } from "./useDeliveryStore";

describe("useDeliveryStore", () => {
  it("sets, persists and clears the delivery location", () => {
    useDeliveryStore.getState().setLocation("Knez Mihailova 1", [44.8, 20.4]);
    useDeliveryStore.getState().setSelectedDeliveryAddress({ _id: "a1" });

    const persisted = JSON.parse(localStorage.getItem("delivery-location")).state;
    expect(persisted).toEqual({
      address: "Knez Mihailova 1",
      coordinates: [44.8, 20.4],
      selectedDeliveryAddress: { _id: "a1" },
    });

    useDeliveryStore.getState().clearLocation();
    expect(useDeliveryStore.getState()).toMatchObject({ address: "", coordinates: null, selectedDeliveryAddress: { _id: "a1" } });
  });
});
