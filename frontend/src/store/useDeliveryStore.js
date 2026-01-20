import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDeliveryStore = create()(
  persist(
    (set) => ({
      address: "",
      coordinates: null,
      selectedDeliveryAddress: null,

      setLocation: (address, coordinates) => set({ address, coordinates }),
      clearLocation: () => set({ address: "", coordinates: null }),
      setSelectedDeliveryAddress: (selectedDeliveryAddress) =>
        set({ selectedDeliveryAddress }),
    }),
    {
      name: "delivery-location",
    },
  ),
);
