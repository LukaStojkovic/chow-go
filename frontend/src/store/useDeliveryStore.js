import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDeliveryStore = create()(
  persist(
    (set) => ({
      address: "",
      coordinates: null,

      setLocation: (address, coordinates) => set({ address, coordinates }),
      clearLocation: () => set({ address: "", coordinates: null }),
    }),
    {
      name: "delivery-location",
    }
  )
);
