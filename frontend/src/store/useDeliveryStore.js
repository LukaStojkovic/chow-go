import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDeliveryStore = create()(
  persist(
    (set) => ({
      address: "",
      setAddress: (address) => set({ address }),
    }),
    {
      name: "address",
    }
  )
);
